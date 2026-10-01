export type AnswerPreserveMode = 'keep_original_answer_fixed' | 'shift_answer_with_option';

export interface OptionItem {
  id: string;
  originalIndex: number; // 0 for A, 1 for B, 2 for C, etc.
  originalLabel: string; // 'A', 'B', 'C', 'D', 'E'
  currentLabel: string; // 'A', 'B', 'C', 'D', 'E' after shuffle
  text: string; // clean text for UI display
  xmlParagraphIndex?: number; // paragraph index in document.xml if paragraph-per-option
  xmlRunRange?: { startRun: number; endRun: number }; // if inline
  isCorrectOriginal?: boolean;
  isRedMarked?: boolean; // Whether this option was marked in RED in the original Word document
}

export type OptionLayoutType = 'paragraph' | 'inline' | 'multi_per_line' | 'mixed';

export interface QuestionItem {
  id: string;
  number: number; // Current sequential number 1, 2, 3...
  originalNumber: number; // Original question number from uploaded exam (e.g. 5)
  rawQuestionNumberText: string; // e.g. "1.", "（1）", "( 1 )"
  title: string; // Question stem/body text
  originalAnswer: string; // e.g. 'A', 'B', 'C', 'D', 'E' detected from file
  currentAnswer: string; // current correct answer letter (e.g. 'B')
  options: OptionItem[];
  layoutType: OptionLayoutType;
  answerSource?: 'red_mark' | 'bracket' | 'trailing_key' | 'manual' | 'default';
  
  // XML document pointers for 100% exact formatting export
  xmlParagraphIndices: number[]; // indices of all paragraphs belonging to this question
  answerBracketParagraphIndex?: number; // paragraph containing answer blank like (   ) or ( B )
  answerBracketRunIndex?: number; // run index in that paragraph
  answerBracketPattern?: string; // e.g. '( %s )' or '【%s】'
  questionParagraphIndex: number; // main question paragraph
}

export interface ExamDocument {
  fileName: string;
  fileSize: number;
  rawZip: any; // JSZip instance of original uploaded docx
  documentXmlDoc: Document; // DOMParser parsed XML document
  title: string;
  totalQuestions: number;
  questions: QuestionItem[];
  originalXmlString: string;
  hasDetectedAnswers: boolean;
  redMarksDetectedCount?: number;
}

export interface ShuffleOptions {
  mode: 'balanced' | 'random' | 'seed';
  seed?: number;
  avoidConsecutive?: boolean; // prevent 3 identical answers in a row
  targetOptionsCount?: number; // e.g. 4 for A-D, 5 for A-E
}

export interface DistributionStats {
  counts: Record<string, number>;
  percentages: Record<string, number>;
  isBalanced: boolean;
  maxStreak: number;
  maxStreakLetter: string;
  total: number;
}
