import JSZip from 'jszip';
import { QuestionItem, OptionItem, ExamDocument, OptionLayoutType } from '../types/exam';

// Standard letter identifiers
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// Regex patterns for question detection
const QUESTION_PATTERNS = [
  // 1. Bracket with optional answer, then number: e.g. "( ) 1. ", "( A ) 1、", "（ C ）1."
  /^\s*[\(（\[【]\s*([A-Ea-e\s]?)\s*[\)）\]】]\s*([0-9０-９]+)[\.、．:：\s\t]/,
  // 2. Number at start: e.g. "1. ", "2、", "10．"
  /^\s*([0-9０-９]+)[\.、．:：\s\t]/,
  // 3. "第 X 題" or "Q1:"
  /^\s*(?:第\s*([0-9０-９]+)\s*題|Q\s*([0-9]+))[\.、．:：\s\t]?/,
];

// Regex patterns for option markers
const OPTION_START_PATTERN = /^\s*(?:[\(（\[【]\s*([A-Ea-e])\s*[\)）\]】]|([A-Ea-e])[\.、．:：])\s*(.*)$/;
const INLINE_OPTION_REGEX = /(?:[\(（\[【]\s*([A-Ea-e])\s*[\)）\]】]|(?:\b|^)([A-Ea-e])[\.、．:：])\s*([^()（）\[\]【】A-Ea-e]+?(?=(?:[\(（\[【]\s*[A-Ea-e]\s*[\)）\]】]|(?:\b|^)[A-Ea-e][\.、．:：]|$)))/g;

/**
 * Detects if a color string (hex, named, or theme) represents RED
 */
export function isRedColor(val: string | null | undefined): boolean {
  if (!val) return false;
  let clean = val.trim().replace(/^#/, '').toLowerCase();
  if (
    [
      'red',
      'darkred',
      'crimson',
      'firebrick',
      'indianred',
      'tomato',
      'maroon',
      'magenta',
      'salmon',
      'ruby',
    ].includes(clean)
  ) {
    return true;
  }
  // Expand 3-digit hex like #f00 -> ff0000
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  // Strip alpha channel if 8-digit hex
  if (clean.length === 8) {
    clean = clean.substring(2);
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    // Dominant red component checks covering Word palette red, darkred, accents
    if (r >= 115 && r > g * 1.25 && r > b * 1.25) return true;
    if (r >= 140 && g <= 125 && b <= 125) return true;
    if (r >= 170 && g <= 145 && b <= 145) return true;
  }
  return false;
}

/**
 * Checks if an element or its styling nodes (color, highlight, shd, u) indicate RED
 */
export function isRunOrElementRed(el: Element): boolean {
  const checkNode = (node: Element): boolean => {
    const name = (node.localName || node.nodeName || '').toLowerCase();
    if (name === 'color' || name.endsWith(':color')) {
      const val = node.getAttribute('w:val') || node.getAttribute('val');
      if (isRedColor(val)) return true;
      const themeColor = node.getAttribute('w:themeColor') || node.getAttribute('themeColor');
      if (themeColor && ['accent2', 'danger', 'alert', 'red'].includes(themeColor.toLowerCase())) {
        return true;
      }
    }
    if (name === 'highlight' || name.endsWith(':highlight')) {
      const val = node.getAttribute('w:val') || node.getAttribute('val');
      if (val && (isRedColor(val) || ['red', 'darkred', 'magenta'].includes(val.toLowerCase()))) {
        return true;
      }
    }
    if (name === 'shd' || name.endsWith(':shd')) {
      const fill = node.getAttribute('w:fill') || node.getAttribute('fill');
      if (isRedColor(fill)) return true;
    }
    if (name === 'u' || name.endsWith(':u')) {
      const color = node.getAttribute('w:color') || node.getAttribute('color');
      if (isRedColor(color)) return true;
    }
    return false;
  };

  if (checkNode(el)) return true;

  const allDescendants = el.getElementsByTagName('*');
  for (let i = 0; i < allDescendants.length; i++) {
    if (checkNode(allDescendants[i])) return true;
  }
  return false;
}

export interface RunDetail {
  element: Element;
  text: string;
  isRed: boolean;
  startIndex: number;
  endIndex: number;
}

export interface ParagraphRunsInfo {
  fullText: string;
  runs: RunDetail[];
  hasAnyRed: boolean;
  redText: string;
  redCharCount: number;
}

/**
 * Extracts all runs and character-level red status inside a paragraph
 */
export function getParagraphRunsInfo(para: Element): ParagraphRunsInfo {
  let paraDefaultRed = false;
  const pPr = Array.from(para.childNodes).find(
    (n) => n.nodeType === 1 && ((n as Element).localName === 'pPr' || (n as Element).nodeName.endsWith(':pPr'))
  ) as Element | undefined;
  if (pPr) {
    paraDefaultRed = isRunOrElementRed(pPr);
  }

  const runs: RunDetail[] = [];
  let fullText = '';
  let redText = '';
  let redCharCount = 0;

  const allNodes = para.getElementsByTagName('*');
  const runElements: Element[] = [];
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const name = (node.localName || node.nodeName || '').toLowerCase();
    if (name === 'r' || name.endsWith(':r')) {
      runElements.push(node);
    }
  }

  for (const r of runElements) {
    const isRed = isRunOrElementRed(r) || paraDefaultRed;

    const tNodes: Element[] = [];
    const rChildren = r.getElementsByTagName('*');
    for (let j = 0; j < rChildren.length; j++) {
      const c = rChildren[j];
      const cName = (c.localName || c.nodeName || '').toLowerCase();
      if (cName === 't' || cName.endsWith(':t')) {
        tNodes.push(c);
      }
    }

    const runText = tNodes.map((t) => t.textContent || '').join('');
    if (runText.length > 0) {
      const startIndex = fullText.length;
      fullText += runText;
      const endIndex = fullText.length;

      if (isRed) {
        redText += runText;
        redCharCount += runText.trim().length;
      }

      runs.push({
        element: r,
        text: runText,
        isRed,
        startIndex,
        endIndex,
      });
    }
  }

  if (!fullText) {
    fullText = para.textContent || '';
  }

  return {
    fullText,
    runs,
    hasAnyRed: redCharCount > 0,
    redText: redText.trim(),
    redCharCount,
  };
}

/**
 * Parses a .docx File or Blob into an ExamDocument
 */
export async function parseDocxFile(file: File | Blob, fileName: string): Promise<ExamDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) {
    throw new Error('無效的 Word 檔：找不到 word/document.xml，請確認檔案是否為標準 .docx 格式。');
  }

  const xmlText = await documentXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  // Check for XML parse errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('解析 Word XML 發生錯誤：' + parseError.textContent);
  }

  // Get all paragraphs inside the document body
  const body = xmlDoc.querySelector('w\\:body, body');
  if (!body) {
    throw new Error('找不到 Word 文件的 body 節點。');
  }

  const paragraphs = Array.from(body.querySelectorAll('w\\:p, p'));
  const questions: QuestionItem[] = [];

  const getParaText = (p: Element): string => {
    const textNodes = Array.from(p.querySelectorAll('w\\:t, t'));
    return textNodes.map((t) => t.textContent || '').join('');
  };

  let currentQuestion: Partial<QuestionItem> | null = null;
  let qCounter = 0;
  let hasDetectedAnswers = false;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    const runsInfo = getParagraphRunsInfo(para);
    const text = (runsInfo.fullText || getParaText(para)).trim();
    if (!text) continue;

    // Check if this paragraph starts a question
    let matchedQNum: number | null = null;
    let rawQNumStr = '';
    let detectedAnsInBracket: string | null = null;
    let detectedAnsSource: QuestionItem['answerSource'] = undefined;

    // 1. Bracket answer + question number: ( A ) 1. or (   ) 1.
    const m1 = text.match(QUESTION_PATTERNS[0]);
    if (m1) {
      const ansLetter = m1[1].trim().toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(ansLetter)) {
        detectedAnsInBracket = ansLetter;
        detectedAnsSource = 'bracket';
      }
      matchedQNum = parseInt(toHalfWidth(m1[2]), 10);
      rawQNumStr = m1[0];
    } else {
      // 2. Standard number: 1. or 1、
      const m2 = text.match(QUESTION_PATTERNS[1]);
      if (m2) {
        matchedQNum = parseInt(toHalfWidth(m2[1]), 10);
        rawQNumStr = m2[0];
      } else {
        // 3. 第 1 題
        const m3 = text.match(QUESTION_PATTERNS[2]);
        if (m3) {
          matchedQNum = parseInt(toHalfWidth(m3[1] || m3[2]), 10);
          rawQNumStr = m3[0];
        }
      }
    }

    // Check if question stem contains RED text marking the answer e.g. red "( B )" or red "B"
    if (runsInfo.hasAnyRed) {
      const redLetterMatch = runsInfo.redText.match(/(?:^|\s|[\(（\[【])([A-Ea-e])(?:[\)）\]】]|\s|$)/);
      if (redLetterMatch) {
        detectedAnsInBracket = redLetterMatch[1].toUpperCase();
        detectedAnsSource = 'red_mark';
        hasDetectedAnswers = true;
      }
    }

    // Check if question ends with answer bracket: e.g. "題目...（ B ）" or "【答案：C】"
    if (matchedQNum !== null && !detectedAnsInBracket) {
      const endAnsMatch = text.match(/(?:[\(（\[【]\s*([A-Ea-e])\s*[\)）\]】]|【?答案\s*[:：]\s*([A-Ea-e])】?)$/);
      if (endAnsMatch) {
        const letter = (endAnsMatch[1] || endAnsMatch[2]).toUpperCase();
        if (['A', 'B', 'C', 'D', 'E'].includes(letter)) {
          detectedAnsInBracket = letter;
          detectedAnsSource = 'bracket';
        }
      }
    }

    // Check if this paragraph itself is a standalone answer line e.g. "【答案】B" or "答案：(C)"
    const standaloneAnsMatch = text.match(/^\s*【?(?:答案|正解|標準答案|Ans|Answer)\s*[:：]?\s*[\(（\[【]?\s*([A-Ea-e])\s*[\)）\]】]?/i);
    if (standaloneAnsMatch && currentQuestion) {
      const ansLetter = standaloneAnsMatch[1].toUpperCase();
      if (['A', 'B', 'C', 'D', 'E'].includes(ansLetter)) {
        currentQuestion.originalAnswer = ansLetter;
        currentQuestion.currentAnswer = ansLetter;
        currentQuestion.answerSource = runsInfo.hasAnyRed ? 'red_mark' : 'bracket';
        hasDetectedAnswers = true;
        currentQuestion.xmlParagraphIndices!.push(pIdx);
        continue;
      }
    }

    // If a new question starts
    if (matchedQNum !== null) {
      // Commit previous question if exists
      if (currentQuestion && currentQuestion.options && currentQuestion.options.length >= 2) {
        finalizeQuestion(currentQuestion as QuestionItem);
        questions.push(currentQuestion as QuestionItem);
      }

      qCounter++;
      const qNumber = matchedQNum || qCounter;
      let stem = text.replace(rawQNumStr, '').trim();

      // Check if this paragraph itself contains inline options: e.g. "1. 題目? (A) 甲 (B) 乙 (C) 丙 (D) 丁"
      const inlineMatches = extractInlineOptions(stem, para);

      if (inlineMatches.options.length >= 2) {
        stem = inlineMatches.stem;
        let initialAns = detectedAnsInBracket || 'A';
        let ansSource: QuestionItem['answerSource'] = detectedAnsSource || 'default';

        if (inlineMatches.detectedRedAnswer) {
          initialAns = inlineMatches.detectedRedAnswer;
          ansSource = 'red_mark';
          hasDetectedAnswers = true;
        } else if (detectedAnsInBracket) {
          hasDetectedAnswers = true;
        }

        currentQuestion = {
          id: `q-${qNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          number: qNumber,
          originalNumber: qNumber,
          rawQuestionNumberText: rawQNumStr,
          title: stem,
          originalAnswer: initialAns,
          currentAnswer: initialAns,
          options: inlineMatches.options,
          layoutType: 'inline',
          answerSource: ansSource,
          xmlParagraphIndices: [pIdx],
          questionParagraphIndex: pIdx,
        };
        continue;
      }

      // Options will follow in subsequent paragraphs
      const initialAns = detectedAnsInBracket || 'A';
      if (detectedAnsInBracket) hasDetectedAnswers = true;

      currentQuestion = {
        id: `q-${qNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        number: qNumber,
        originalNumber: qNumber,
        rawQuestionNumberText: rawQNumStr,
        title: stem,
        originalAnswer: initialAns,
        currentAnswer: initialAns,
        options: [],
        layoutType: 'paragraph',
        answerSource: detectedAnsSource || 'default',
        xmlParagraphIndices: [pIdx],
        questionParagraphIndex: pIdx,
      };
      continue;
    }

    // If currently inside a question, check if this paragraph is an option
    if (currentQuestion) {
      const optStartMatch = text.match(OPTION_START_PATTERN);
      if (optStartMatch) {
        const label = (optStartMatch[1] || optStartMatch[2]).toUpperCase();
        const optText = optStartMatch[3].trim();
        const optIndex = currentQuestion.options!.length;

        // Check if there are multiple options on this same line: "(A) 玉山 (B) 雪山..."
        const inlineOpts = extractInlineOptions(text, para);
        if (inlineOpts.options.length >= 2) {
          currentQuestion.options = inlineOpts.options;
          currentQuestion.layoutType = 'inline';
          currentQuestion.xmlParagraphIndices!.push(pIdx);
          if (inlineOpts.detectedRedAnswer) {
            currentQuestion.originalAnswer = inlineOpts.detectedRedAnswer;
            currentQuestion.currentAnswer = inlineOpts.detectedRedAnswer;
            currentQuestion.answerSource = 'red_mark';
            hasDetectedAnswers = true;
          }
          continue;
        }

        // Single option paragraph: Check if this option paragraph or its text is colored RED!
        const optLetter = label || LETTERS[optIndex];
        const isOptRed = runsInfo.hasAnyRed;

        if (isOptRed) {
          currentQuestion.originalAnswer = optLetter;
          currentQuestion.currentAnswer = optLetter;
          currentQuestion.answerSource = 'red_mark';
          hasDetectedAnswers = true;
        }

        currentQuestion.options!.push({
          id: `opt-${currentQuestion.id}-${optIndex}`,
          originalIndex: optIndex,
          originalLabel: optLetter,
          currentLabel: optLetter,
          text: optText,
          xmlParagraphIndex: pIdx,
          isRedMarked: isOptRed,
        });
        currentQuestion.xmlParagraphIndices!.push(pIdx);
        continue;
      }

      // Check inline options without leading label
      const inlineOpts = extractInlineOptions(text, para);
      if (inlineOpts.options.length >= 2) {
        currentQuestion.options = inlineOpts.options;
        currentQuestion.layoutType = 'inline';
        currentQuestion.xmlParagraphIndices!.push(pIdx);
        if (inlineOpts.detectedRedAnswer) {
          currentQuestion.originalAnswer = inlineOpts.detectedRedAnswer;
          currentQuestion.currentAnswer = inlineOpts.detectedRedAnswer;
          currentQuestion.answerSource = 'red_mark';
          hasDetectedAnswers = true;
        }
        continue;
      }

      // Continuation of stem or explanation
      if (currentQuestion.options && currentQuestion.options.length >= 4) {
        currentQuestion.xmlParagraphIndices!.push(pIdx);
      } else if (currentQuestion.options && currentQuestion.options.length === 0) {
        currentQuestion.title += '\n' + text;
        currentQuestion.xmlParagraphIndices!.push(pIdx);
      }
    }
  }

  // Finalize last question
  if (currentQuestion && currentQuestion.options && currentQuestion.options.length >= 2) {
    finalizeQuestion(currentQuestion as QuestionItem);
    questions.push(currentQuestion as QuestionItem);
  }

  // Attempt to scan for trailing answer key section
  const trailingAnswers = detectTrailingAnswerKey(paragraphs);
  if (trailingAnswers.size > 0) {
    questions.forEach((q) => {
      // Do not overwrite red marked answer with trailing key unless question had no red answer
      if (trailingAnswers.has(q.number) && q.answerSource !== 'red_mark') {
        const ans = trailingAnswers.get(q.number)!;
        q.originalAnswer = ans;
        q.currentAnswer = ans;
        q.answerSource = 'trailing_key';
        hasDetectedAnswers = true;
      }
    });
  }

  // Count how many questions were accurately detected by red font
  const redMarksDetectedCount = questions.filter((q) => q.answerSource === 'red_mark').length;

  const firstParaText = paragraphs.length > 0 ? getParaText(paragraphs[0]).trim() : '';
  const docTitle = firstParaText || fileName.replace(/\.[^/.]+$/, '');

  return {
    fileName,
    fileSize: file.size,
    rawZip: zip,
    documentXmlDoc: xmlDoc,
    title: docTitle,
    totalQuestions: questions.length,
    questions,
    originalXmlString: xmlText,
    hasDetectedAnswers,
    redMarksDetectedCount,
  };
}

/**
 * Extracts inline options from text e.g. "(A) 甲 (B) 乙 (C) 丙 (D) 丁"
 */
function extractInlineOptions(
  text: string,
  para?: Element
): { stem: string; options: OptionItem[]; detectedRedAnswer?: string } {
  const matches: { label: string; text: string; fullMatch: string; startIndex: number; endIndex: number }[] = [];
  const regex = new RegExp(INLINE_OPTION_REGEX);
  let m;

  while ((m = regex.exec(text)) !== null) {
    const label = (m[1] || m[2]).toUpperCase();
    const optText = m[3].trim();
    matches.push({
      label,
      text: optText,
      fullMatch: m[0],
      startIndex: m.index,
      endIndex: m.index + m[0].length,
    });
  }

  if (matches.length < 2) {
    return { stem: text, options: [] };
  }

  const optionSpans = matches.map((item, idx) => {
    const start = item.startIndex;
    const end = idx + 1 < matches.length ? matches[idx + 1].startIndex : text.length;
    return { ...item, start, end };
  });

  let detectedRedAnswer: string | undefined;
  let maxRedChars = 0;
  const runsInfo = para ? getParagraphRunsInfo(para) : null;

  const options: OptionItem[] = optionSpans.map((span, idx) => {
    let isRed = false;
    let redCount = 0;

    if (runsInfo && runsInfo.hasAnyRed) {
      for (const run of runsInfo.runs) {
        if (run.isRed && run.text.trim().length > 0) {
          const overlapStart = Math.max(run.startIndex, span.start);
          const overlapEnd = Math.min(run.endIndex, span.end);
          if (overlapEnd > overlapStart) {
            isRed = true;
            redCount += overlapEnd - overlapStart;
          }
        }
      }

      if (!isRed && runsInfo.redText) {
        const cleanRed = runsInfo.redText;
        if (
          cleanRed.includes(span.label) ||
          (span.text && (cleanRed.includes(span.text) || span.text.includes(cleanRed)))
        ) {
          isRed = true;
          redCount += 1;
        }
      }
    }

    if (isRed && redCount > maxRedChars) {
      maxRedChars = redCount;
      detectedRedAnswer = span.label;
    }

    return {
      id: `opt-inline-${idx}`,
      originalIndex: idx,
      originalLabel: span.label || LETTERS[idx],
      currentLabel: span.label || LETTERS[idx],
      text: span.text,
      isRedMarked: isRed,
    };
  });

  const stem = text.substring(0, matches[0].startIndex).trim();
  return { stem, options, detectedRedAnswer };
}

/**
 * Standardize full-width digits to half-width (e.g. １ -> 1)
 */
function toHalfWidth(str: string): string {
  return str.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

/**
 * Finalizes question data structure and ensures correct answer from red mark
 */
function finalizeQuestion(q: QuestionItem) {
  // Check if any option is red marked
  const redOpt = q.options.find((opt) => opt.isRedMarked);
  if (redOpt) {
    q.originalAnswer = redOpt.originalLabel;
    q.currentAnswer = redOpt.originalLabel;
    q.answerSource = 'red_mark';
  }

  q.options.forEach((opt, idx) => {
    opt.originalIndex = idx;
    if (!opt.originalLabel) {
      opt.originalLabel = LETTERS[idx] || `${idx + 1}`;
    }
    opt.currentLabel = opt.originalLabel;
    if (opt.originalLabel === q.currentAnswer) {
      opt.isCorrectOriginal = true;
    }
  });

  if (!q.currentAnswer && q.options.length > 0) {
    q.currentAnswer = q.options[0].currentLabel;
  }
}

/**
 * Re-analyzes all questions from the loaded document XML specifically to detect RED-marked answers.
 * Implements "原卷的正確答案會標記成紅色 重新判讀"
 */
export function reDetectRedAnswersFromDocx(
  xmlDoc: Document,
  questions: QuestionItem[]
): {
  updatedQuestions: QuestionItem[];
  detectedCount: number;
  details: Array<{ qNum: number; answer: string; reason: string }>;
} {
  const body = xmlDoc.querySelector('w\\:body, body');
  if (!body) {
    return { updatedQuestions: questions, detectedCount: 0, details: [] };
  }

  const paragraphs = Array.from(body.querySelectorAll('w\\:p, p'));
  const details: Array<{ qNum: number; answer: string; reason: string }> = [];
  let detectedCount = 0;

  const updatedQuestions = questions.map((q) => {
    const updated = { ...q, options: q.options.map((opt) => ({ ...opt })) };
    let foundRedAns: string | null = null;
    let detectionReason = '';

    // Check 1: Inline options in question paragraph or option paragraph
    if (updated.layoutType === 'inline' || updated.xmlParagraphIndices.length === 1) {
      const qPara = paragraphs[updated.questionParagraphIndex];
      if (qPara) {
        const runsInfo = getParagraphRunsInfo(qPara);
        if (runsInfo.hasAnyRed) {
          const inlineResult = extractInlineOptions(runsInfo.fullText, qPara);
          if (inlineResult.detectedRedAnswer) {
            foundRedAns = inlineResult.detectedRedAnswer;
            detectionReason = `單行選項中檢測到紅字選項 (${foundRedAns})`;
            // Sync isRedMarked to options
            updated.options.forEach((opt) => {
              opt.isRedMarked = (opt.originalLabel === foundRedAns);
            });
          }
        }
      }
    }

    // Check 2: Paragraph-per-option
    if (!foundRedAns && updated.options.some((opt) => opt.xmlParagraphIndex !== undefined)) {
      for (const opt of updated.options) {
        if (opt.xmlParagraphIndex !== undefined && opt.xmlParagraphIndex < paragraphs.length) {
          const optPara = paragraphs[opt.xmlParagraphIndex];
          const runsInfo = getParagraphRunsInfo(optPara);
          if (runsInfo.hasAnyRed) {
            foundRedAns = opt.originalLabel;
            opt.isRedMarked = true;
            detectionReason = `選項段落 (${opt.originalLabel}) 中檢測到紅字文字/標記`;
            break;
          }
        }
      }
    }

    // Check 3: Red letter inside question stem bracket e.g. "( C ) 1. 題目"
    if (!foundRedAns && updated.questionParagraphIndex < paragraphs.length) {
      const qPara = paragraphs[updated.questionParagraphIndex];
      const runsInfo = getParagraphRunsInfo(qPara);
      if (runsInfo.hasAnyRed) {
        const match = runsInfo.redText.match(/(?:^|\s|[\(（\[【])([A-Ea-e])(?:[\)）\]】]|\s|$)/);
        if (match) {
          const letter = match[1].toUpperCase();
          if (['A', 'B', 'C', 'D', 'E'].includes(letter)) {
            foundRedAns = letter;
            detectionReason = `題號前括弧內檢測到紅字正解 (${foundRedAns})`;
            updated.options.forEach((opt) => {
              opt.isRedMarked = (opt.originalLabel === foundRedAns);
            });
          }
        }
      }
    }

    if (foundRedAns) {
      updated.originalAnswer = foundRedAns;
      updated.currentAnswer = foundRedAns;
      updated.answerSource = 'red_mark';
      detectedCount++;
      details.push({
        qNum: updated.number,
        answer: foundRedAns,
        reason: detectionReason,
      });
    }

    return updated;
  });

  return {
    updatedQuestions,
    detectedCount,
    details,
  };
}

/**
 * Detects answer keys from trailing paragraphs e.g. "解答：1. B 2. C 3. A" or "1-5: B C A D A"
 */
function detectTrailingAnswerKey(paragraphs: Element[]): Map<number, string> {
  const map = new Map<number, string>();
  const fullTexts = paragraphs.map((p) => {
    const tNodes = Array.from(p.querySelectorAll('w\\:t, t'));
    return tNodes.map((t) => t.textContent || '').join('').trim();
  });

  let inAnswerSection = false;
  for (let i = 0; i < fullTexts.length; i++) {
    const line = fullTexts[i];
    if (!line) continue;

    if (/^(?:【?\s*(?:參考解答|解答|標準答案|Answer\s*Key|答案)\s*】?|【答案表】)/i.test(line)) {
      inAnswerSection = true;
    }

    if (inAnswerSection) {
      const pairRegex = /(?:^|\s|，|,|、)([0-9]{1,3})[\.、．:：\s\t]*[\(（\[【]?\s*([A-Ea-e])\s*[\)）\]】]?/g;
      let m;
      while ((m = pairRegex.exec(line)) !== null) {
        const qNum = parseInt(m[1], 10);
        const ans = m[2].toUpperCase();
        if (qNum > 0 && ['A', 'B', 'C', 'D', 'E'].includes(ans)) {
          map.set(qNum, ans);
        }
      }

      const rangeMatch = line.match(/([0-9]{1,3})\s*[-~～至到]\s*([0-9]{1,3})\s*[:：\s]\s*([A-Ea-e\s,]+)/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const lettersOnly = rangeMatch[3].replace(/[^A-Ea-e]/g, '').toUpperCase().split('');
        lettersOnly.forEach((ch, idx) => {
          map.set(start + idx, ch);
        });
      }
    }
  }

  return map;
}

/**
 * Parses user-pasted answer text e.g. "1. B 2. C" or "BCADB" or "1-5: B C A D A"
 */
export function parseUserAnswerInput(rawText: string): Map<number, string> {
  const map = new Map<number, string>();
  if (!rawText.trim()) return map;

  const pairRegex = /(?:^|\s|，|,|、|;)([0-9]{1,3})[\.、．:：\s\t]*[\(（\[【]?\s*([A-Ea-e])\s*[\)）\]】]?(?=\s|$|，|,|、|;)/g;
  let m;
  let pairCount = 0;
  while ((m = pairRegex.exec(rawText)) !== null) {
    const qNum = parseInt(m[1], 10);
    const ans = m[2].toUpperCase();
    if (qNum > 0 && ['A', 'B', 'C', 'D', 'E'].includes(ans)) {
      map.set(qNum, ans);
      pairCount++;
    }
  }

  if (pairCount >= 2) {
    return map;
  }

  const lines = rawText.split('\n');
  for (const line of lines) {
    const rangeMatch = line.match(/([0-9]{1,3})\s*[-~～至到]\s*([0-9]{1,3})\s*[:：\s]\s*([A-Ea-e\s,]+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const lettersOnly = rangeMatch[3].replace(/[^A-Ea-e]/g, '').toUpperCase().split('');
      lettersOnly.forEach((ch, idx) => {
        map.set(start + idx, ch);
      });
    }
  }

  if (map.size >= 2) {
    return map;
  }

  const cleanLetters = rawText.replace(/[^A-Ea-e]/g, '').toUpperCase().split('');
  cleanLetters.forEach((ch, idx) => {
    map.set(idx + 1, ch);
  });

  return map;
}
