import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ExamDocument, QuestionItem } from '../types/exam';
import { calculateDistribution } from './shuffler';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export interface ExportOptions {
  type: 'student' | 'teacher' | 'answer_sheet' | 'both';
  versionLabel?: string; // e.g. 'A卷', 'B卷'
  highlightCorrect?: boolean; // Highlight correct answer in teacher paper
  clearAnswerBrackets?: boolean; // Clear ( ) in student paper
}

/**
 * Exports modified exam as Word (.docx) with 100% exact original formatting
 */
export async function exportModifiedDocx(
  examDoc: ExamDocument,
  questions: QuestionItem[],
  options: ExportOptions
): Promise<Blob> {
  // 1. Clone original JSZip instance so we do not mutate original
  const zip = new JSZip();
  const filePromises: Promise<any>[] = [];

  examDoc.rawZip.forEach((relativePath: string, file: any) => {
    filePromises.push(
      file.async('uint8array').then((content: Uint8Array) => {
        zip.file(relativePath, content);
      })
    );
  });

  await Promise.all(filePromises);

  // 2. Parse original document.xml afresh from raw zip
  const originalXml = await examDoc.rawZip.file('word/document.xml').async('text');
  const parser = new DOMParser();
  const docXml = parser.parseFromString(originalXml, 'application/xml');

  const body = docXml.querySelector('w\\:body, body');
  if (!body) {
    throw new Error('無法找到 Word 文件的 body 節點');
  }

  const paragraphs = Array.from(body.querySelectorAll('w\\:p, p'));

  // 3. If question sequence order was shuffled, reorder the question paragraph chunks in the Word document FIRST!
  reorderAllQuestionsInDocument(docXml, paragraphs, questions, examDoc);

  // 3.5 For each question, apply updated question numbers, answer brackets, and options
  questions.forEach((q) => {
    // A. Update question answer blank and number in question paragraph
    if (q.questionParagraphIndex !== undefined && q.questionParagraphIndex < paragraphs.length) {
      const qPara = paragraphs[q.questionParagraphIndex];
      updateQuestionAnswerBlank(qPara, q, options);
      updateQuestionNumberInParagraph(qPara, q);
    }

    // B. Reorder options based on layoutType
    if (q.layoutType === 'paragraph') {
      reorderParagraphOptions(paragraphs, q, options);
    } else if (q.layoutType === 'inline') {
      reorderInlineOptions(paragraphs, q, options);
    }
  });

  // 4. If version label is provided (e.g. "【A卷】" or "【B卷】"), update document header/title
  if (options.versionLabel && paragraphs.length > 0) {
    appendVersionLabelToTitle(paragraphs[0], options.versionLabel);
  }

  // 5. Serialize XML back to document.xml
  const serializer = new XMLSerializer();
  const modifiedXmlString = serializer.serializeToString(docXml);

  zip.file('word/document.xml', modifiedXmlString);

  // 6. Generate final docx Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return blob;
}

/**
 * Updates the answer blank in the question paragraph
 * e.g. "( A ) 1. 題目" -> "(   ) 1. 題目" (Student) or "( C ) 1. 題目" (Teacher)
 */
function updateQuestionAnswerBlank(
  qPara: Element,
  q: QuestionItem,
  options: ExportOptions
) {
  const textNodes = Array.from(qPara.querySelectorAll('w\\:t, t'));
  if (textNodes.length === 0) return;

  const targetAnswer = options.type === 'teacher' ? q.currentAnswer : '   ';

  // Find and replace answer bracket patterns like "( )", "( A )", "（ B ）", "【C】"
  const bracketRegex = /([\(（\[【])\s*([A-Ea-e\s]?)\s*([\);）\]】])/;

  for (let i = 0; i < textNodes.length; i++) {
    const tNode = textNodes[i];
    const originalText = tNode.textContent || '';
    if (bracketRegex.test(originalText)) {
      tNode.textContent = originalText.replace(bracketRegex, `$1 ${targetAnswer} $3`);
      return;
    }
  }

  // If bracket was split across multiple text nodes, combine and update first matching run
  const fullText = textNodes.map((t) => t.textContent).join('');
  if (bracketRegex.test(fullText)) {
    // Put replaced text in first non-empty text node and clean others in the match range
    const replaced = fullText.replace(bracketRegex, `$1 ${targetAnswer} $3`);
    textNodes[0].textContent = replaced;
    for (let i = 1; i < textNodes.length; i++) {
      if (textNodes[i].textContent && fullText.indexOf(textNodes[i].textContent!) < fullText.indexOf('。')) {
        // Only clear if it was part of question prefix
      }
    }
  }
}

/**
 * Safely replaces matched text in a paragraph across multiple text nodes without losing run styling
 */
function replaceTextAcrossNodes(
  textNodes: Element[],
  pattern: RegExp,
  replacement: (match: string, ...groups: string[]) => string
): boolean {
  for (let i = 0; i < textNodes.length; i++) {
    const tNode = textNodes[i];
    const text = tNode.textContent || '';
    if (pattern.test(text)) {
      tNode.textContent = text.replace(pattern, replacement as any);
      return true;
    }
  }

  // Cross-node check
  const nodeSpans: { node: Element; start: number; end: number; text: string }[] = [];
  let fullText = '';
  for (const node of textNodes) {
    const t = node.textContent || '';
    const start = fullText.length;
    fullText += t;
    nodeSpans.push({ node, start, end: fullText.length, text: t });
  }

  const match = pattern.exec(fullText);
  if (!match) return false;

  const matchStart = match.index;
  const matchEnd = matchStart + match[0].length;
  const replacedSegment = fullText.slice(matchStart, matchEnd).replace(pattern, replacement as any);

  let replacedInserted = false;
  for (const span of nodeSpans) {
    if (span.end <= matchStart || span.start >= matchEnd) {
      continue;
    }
    const localStart = Math.max(0, matchStart - span.start);
    const localEnd = Math.min(span.text.length, matchEnd - span.start);

    const before = span.text.substring(0, localStart);
    const after = span.text.substring(localEnd);

    if (!replacedInserted) {
      span.node.textContent = before + replacedSegment + after;
      replacedInserted = true;
    } else {
      span.node.textContent = before + after;
    }
  }

  return true;
}

/**
 * Updates the question number in the question paragraph when question order is shuffled.
 * e.g. "4. 下列何者..." -> "1. 下列何者...", "( ) 4. " -> "( ) 1. "
 */
function updateQuestionNumberInParagraph(qPara: Element, q: QuestionItem) {
  const oldNum = q.originalNumber;
  const newNum = q.number;
  if (!oldNum || !newNum || oldNum === newNum) return;

  const textNodes = Array.from(qPara.querySelectorAll('w\\:t, t'));
  if (textNodes.length === 0) return;

  const patterns = [
    // 1. Bracket then number: e.g. "(   ) 4. ", "（ B ） 4、", "【  】4."
    new RegExp(`([\\(（\\[【][^\\)）\\]】]*[\\)）\\]】]\\s*)${oldNum}([\\.、．:：\\s\\t])`),
    // 2. Parenthesized question number at start: e.g. "(4)", "（4）"
    new RegExp(`(^|\\s)([\\(（\\[【])${oldNum}([\\)）\\]】])`),
    // 3. Number at start of line or space: e.g. "4. ", "4、"
    new RegExp(`(^|\\s)${oldNum}([\\.、．:：\\s\\t])`),
    // 4. 第 4 題
    new RegExp(`(第\\s*)${oldNum}(\\s*題)`),
    // 5. Q4: or Q4.
    new RegExp(`(Q\\s*)${oldNum}([\\.、．:：\\s])`, 'i'),
  ];

  for (const pat of patterns) {
    const success = replaceTextAcrossNodes(textNodes, pat, (match, p1, p2, p3) => {
      if (p3 !== undefined) {
        return `${p1}${p2}${newNum}${p3}`;
      }
      return `${p1}${newNum}${p2}`;
    });
    if (success) return;
  }

  // Fallback: If the number was in its own standalone text node e.g. <w:t>4</w:t>
  for (let i = 0; i < textNodes.length; i++) {
    const tNode = textNodes[i];
    const text = (tNode.textContent || '').trim();
    if (text === `${oldNum}`) {
      const nextText = textNodes[i + 1]?.textContent || '';
      if (
        nextText.startsWith('.') ||
        nextText.startsWith('、') ||
        nextText.startsWith('．') ||
        nextText.startsWith('題') ||
        nextText.startsWith(':') ||
        nextText.startsWith('：')
      ) {
        tNode.textContent = tNode.textContent!.replace(`${oldNum}`, `${newNum}`);
        return;
      }
    }
  }
}

/**
 * Reorders paragraph-per-option questions while preserving 100% of formatting,
 * fonts, styles, indentations, and runs of each option.
 */
function reorderParagraphOptions(
  paragraphs: Element[],
  q: QuestionItem,
  options: ExportOptions
) {
  // Collect the original DOM elements for the options
  const optElements: { originalIndex: number; element: Element }[] = [];

  q.options.forEach((opt) => {
    if (opt.xmlParagraphIndex !== undefined && opt.xmlParagraphIndex < paragraphs.length) {
      optElements.push({
        originalIndex: opt.originalIndex,
        element: paragraphs[opt.xmlParagraphIndex],
      });
    }
  });

  if (optElements.length < 2) return;

  const parent = optElements[0].element.parentNode;
  if (!parent) return;

  // Insertion anchor: use temporary comment marker right before the first option
  optElements.sort((a, b) => a.originalIndex - b.originalIndex);
  const firstOpt = optElements[0].element;
  const marker = firstOpt.ownerDocument.createComment('options_reorder_marker');
  parent.insertBefore(marker, firstOpt);

  // Now for each option in q.options, update label and insert in new sequence before marker
  q.options.forEach((newOpt, newPos) => {
    const found = optElements.find((item) => item.originalIndex === newOpt.originalIndex);
    if (found) {
      const el = found.element;
      const newLabel = LETTERS[newPos] || `${newPos + 1}`;
      updateOptionLabelInParagraph(el, newLabel);

      if (options.type === 'teacher' && options.highlightCorrect && newLabel === q.currentAnswer) {
        highlightParagraph(el);
      }

      parent.insertBefore(el, marker);
    }
  });

  // Remove marker
  parent.removeChild(marker);
}

/**
 * Updates the leading option label inside a paragraph
 * e.g. "(B) 答案" -> "(A) 答案"
 */
function updateOptionLabelInParagraph(para: Element, newLabel: string) {
  const textNodes = Array.from(para.querySelectorAll('w\\:t, t'));
  if (textNodes.length === 0) return;

  const labelRegex = /^\s*([\(（\[【]?)\s*([A-Ea-e0-9①-⑤]+)\s*([\);）\]】\.、．:：]?\s*)/;

  for (let i = 0; i < textNodes.length; i++) {
    const tNode = textNodes[i];
    const text = tNode.textContent || '';
    if (labelRegex.test(text)) {
      tNode.textContent = text.replace(labelRegex, (match, open, oldLabel, close) => {
        const op = open || '(';
        const cl = close ? close.replace(/^[A-Ea-e]/, '') : ') ';
        return `${op}${newLabel}${cl}`;
      });
      return;
    }
  }
}

/**
 * Highlights a paragraph in Word XML for teacher answer key
 */
function highlightParagraph(para: Element) {
  const runs = Array.from(para.querySelectorAll('w\\:r, r'));
  runs.forEach((run) => {
    let rPr = run.querySelector('w\\:rPr, rPr');
    if (!rPr) {
      rPr = para.ownerDocument.createElementNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'w:rPr'
      );
      run.insertBefore(rPr, run.firstChild);
    }
    // Add bold
    if (!rPr.querySelector('w\\:b, b')) {
      const b = para.ownerDocument.createElementNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'w:b'
      );
      rPr.appendChild(b);
    }
    // Add red or blue color
    let color = rPr.querySelector('w\\:color, color');
    if (!color) {
      color = para.ownerDocument.createElementNS(
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'w:color'
      );
      rPr.appendChild(color);
    }
    color.setAttribute('w:val', 'C00000'); // Clean dark red
  });
}

/**
 * Reorders inline options within a single paragraph
 */
function reorderInlineOptions(
  paragraphs: Element[],
  q: QuestionItem,
  options: ExportOptions
) {
  const pIdx = q.questionParagraphIndex;
  if (pIdx === undefined || pIdx >= paragraphs.length) return;

  const para = paragraphs[pIdx];
  const textNodes = Array.from(para.querySelectorAll('w\\:t, t'));
  if (textNodes.length === 0) return;

  // Build new inline options text
  let inlineText = '';
  q.options.forEach((opt, idx) => {
    const label = LETTERS[idx];
    const prefix = `(${label}) ${opt.text}`;
    inlineText += `${prefix}    `;
  });

  // Find if question stem is in first text node
  const fullText = textNodes.map((t) => t.textContent).join('');
  const firstOptIdx = fullText.search(/[\(（\[【]\s*[A-Ea-e]\s*[\)）\]】]|\b[A-Ea-e][\.、]/);

  if (firstOptIdx !== -1) {
    const stem = fullText.substring(0, firstOptIdx).trim();
    // Put stem + new inline options into first text node and clear subsequent
    textNodes[0].textContent = stem + '  ' + inlineText.trim();
    for (let i = 1; i < textNodes.length; i++) {
      textNodes[i].textContent = '';
    }
  } else {
    textNodes[textNodes.length - 1].textContent = inlineText.trim();
  }
}

/**
 * Reorders all question paragraph blocks within the Word document XML according to questions array.
 */
function reorderAllQuestionsInDocument(
  docXml: Document,
  paragraphs: Element[],
  questions: QuestionItem[],
  examDoc?: ExamDocument
) {
  // Check if question order actually differs from original
  const isOrderChanged = examDoc?.questions
    ? examDoc.questions.some((origQ, idx) => origQ.id !== questions[idx]?.id)
    : questions.some((q, idx) => (q.originalNumber || idx + 1) !== idx + 1);
  if (!isOrderChanged) return;

  // Collect each question's paragraphs
  const questionBlocks: {
    question: QuestionItem;
    elements: Element[];
  }[] = questions.map((q) => {
    const sortedIndices = [...new Set(q.xmlParagraphIndices)].sort((a, b) => a - b);
    const elements = sortedIndices
      .filter((i) => i >= 0 && i < paragraphs.length)
      .map((i) => paragraphs[i]);
    return { question: q, elements };
  });

  // Find the earliest question paragraph index in the original document
  const allQIndices = questions
    .flatMap((q) => q.xmlParagraphIndices)
    .filter((i) => i >= 0 && i < paragraphs.length);
  if (allQIndices.length === 0) return;

  const firstQIndex = Math.min(...allQIndices);
  const firstQElement = paragraphs[firstQIndex];
  const parentNode = firstQElement.parentNode;
  if (!parentNode) return;

  // Insert a temporary marker element right before the first question element
  const marker = docXml.createComment('questions_reorder_marker');
  parentNode.insertBefore(marker, firstQElement);

  // Detach all question elements
  questionBlocks.forEach((block) => {
    block.elements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  });

  // Re-insert question elements in the new question order right before marker
  questionBlocks.forEach((block) => {
    block.elements.forEach((el) => {
      parentNode.insertBefore(el, marker);
    });
  });

  // Remove marker
  parentNode.removeChild(marker);
}

/**
 * Appends version label to document title
 */
function appendVersionLabelToTitle(titlePara: Element, versionLabel: string) {
  const textNodes = Array.from(titlePara.querySelectorAll('w\\:t, t'));
  if (textNodes.length > 0) {
    const lastNode = textNodes[textNodes.length - 1];
    if (!lastNode.textContent?.includes(versionLabel)) {
      lastNode.textContent = `${lastNode.textContent} (${versionLabel})`;
    }
  }
}

/**
 * Generates an Answer Sheet / Teacher Key document as a standalone Word (.docx)
 */
export async function generateAnswerSheetDocx(
  examDoc: ExamDocument,
  questions: QuestionItem[],
  versionLabel: string = 'A卷'
): Promise<Blob> {
  const zip = new JSZip();
  const stats = calculateDistribution(questions);

  // XML Boilerplate
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:eastAsia="微軟正黑體"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`
  );

  // Generate Table of Answers (6 columns wide: 新題號、對應原題號、標準答案、原題答案、選項變動、選項對應)
  let tableRowsXml = `
  <w:tr>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:tcW w:w="1100" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>現題號</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:tcW w:w="1200" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>原卷題號</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:tcW w:w="1400" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>標準答案</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:tcW w:w="1400" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>原題答案</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:tcW w:w="1600" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>選項變動</w:t></w:r></w:p></w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:tcW w:w="2800" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>選項對應 (現 ➔ 原)</w:t></w:r></w:p></w:tc>
  </w:tr>`;

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const isShifted = q.currentAnswer !== q.originalAnswer;
    const shiftBadge = isShifted ? `${q.originalAnswer} ➔ ${q.currentAnswer}` : '未更動';
    const originalNumLabel = q.originalNumber ? `第 ${q.originalNumber} 題` : `第 ${qNum} 題`;
    
    // Detailed mapping: A -> (original label)
    const mapStr = q.options.map((opt) => `${opt.currentLabel}為原${opt.originalLabel}`).join('、');

    tableRowsXml += `
  <w:tr>
    <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>第 ${qNum} 題</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/></w:rPr><w:t>${originalNumLabel}</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="0F172A"/><w:sz w:val="26"/></w:rPr><w:t>${q.currentAnswer}</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="64748B"/></w:rPr><w:t>${q.originalAnswer || '-'}</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="${isShifted ? '2563EB' : '94A3B8'}"/></w:rPr><w:t>${shiftBadge}</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="475569"/></w:rPr><w:t>${mapStr}</w:t></w:r></w:p></w:tc>
  </w:tr>`;
  });

  const docBody = `
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>${escapeXml(examDoc.title)}</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2563EB"/></w:rPr><w:t>標準答案表與題解對照表（${escapeXml(versionLabel)}）</w:t></w:r>
  </w:p>
  
  <w:p>
    <w:pPr><w:spacing w:after="160"/></w:pPr>
    <w:r><w:rPr><w:b/></w:rPr><w:t>【答案分佈統計】　</w:t></w:r>
    <w:r><w:t>A: ${stats.counts.A || 0} (${stats.percentages.A || 0}%)　｜　B: ${stats.counts.B || 0} (${stats.percentages.B || 0}%)　｜　C: ${stats.counts.C || 0} (${stats.percentages.C || 0}%)　｜　D: ${stats.counts.D || 0} (${stats.percentages.D || 0}%)　｜　分佈狀態：${stats.isBalanced ? '完美平均分配' : '自訂分配'}</w:t></w:r>
  </w:p>

  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="9000" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      </w:tblBorders>
    </w:tblPr>
    ${tableRowsXml}
  </w:tbl>`;

  const fullXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docBody}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', fullXml);

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

/**
 * Downloads a Blob directly
 */
export function downloadFile(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
