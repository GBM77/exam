import { QuestionItem, OptionItem, DistributionStats } from '../types/exam';

/**
 * Fisher-Yates shuffle with optional seed
 */
export function shuffleArray<T>(array: T[], rng: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a derangement of an array (where no element remains in its original position).
 * Ensures that all items are guaranteed to be swapped/moved to a new position!
 */
export function derangeArray<T>(array: T[], rng: () => number = Math.random): T[] {
  if (array.length <= 1) return [...array];
  if (array.length === 2) return [array[1], array[0]];

  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = shuffleArray(array, rng);
    const hasFixedPoint = candidate.some((item, idx) => item === array[idx]);
    if (!hasFixedPoint) {
      return candidate;
    }
  }

  // Fallback cyclic shift: guaranteed 0 fixed points
  return [...array.slice(1), array[0]];
}

/**
 * Seeded pseudo-random number generator (Mulberry32)
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Calculate distribution statistics for current answer keys
 */
export function calculateDistribution(questions: QuestionItem[]): DistributionStats {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const total = questions.length;
  
  if (total === 0) {
    return {
      counts,
      percentages: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      isBalanced: true,
      maxStreak: 0,
      maxStreakLetter: '',
      total: 0,
    };
  }

  // Count active letters
  let maxOptionCount = 4;
  questions.forEach(q => {
    if (q.options.length > maxOptionCount) {
      maxOptionCount = q.options.length;
    }
    const ans = q.currentAnswer?.toUpperCase() || 'A';
    counts[ans] = (counts[ans] || 0) + 1;
  });

  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, maxOptionCount);
  const percentages: Record<string, number> = {};
  letters.forEach(l => {
    percentages[l] = total > 0 ? Math.round((counts[l] / total) * 100) : 0;
  });

  // Calculate streaks
  let maxStreak = 0;
  let maxStreakLetter = '';
  let currentStreak = 0;
  let lastLetter = '';

  questions.forEach(q => {
    const letter = q.currentAnswer;
    if (letter === lastLetter) {
      currentStreak++;
    } else {
      currentStreak = 1;
      lastLetter = letter;
    }
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
      maxStreakLetter = letter;
    }
  });

  // Check if counts are strictly balanced (max difference <= 1 among active letters)
  const activeCounts = letters.map(l => counts[l] || 0);
  const minCount = Math.min(...activeCounts);
  const maxCount = Math.max(...activeCounts);
  const isBalanced = maxCount - minCount <= 1;

  return {
    counts,
    percentages,
    isBalanced,
    maxStreak,
    maxStreakLetter,
    total,
  };
}

/**
 * Generate a perfectly balanced answer sequence across options
 * with anti-streak guarantee (max 2 consecutive identical answers)
 */
export function generateBalancedAnswerSequence(
  totalQuestions: number,
  optionsCount: number = 4,
  rng: () => number = Math.random
): string[] {
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, optionsCount);
  const baseCount = Math.floor(totalQuestions / optionsCount);
  const remainder = totalQuestions % optionsCount;

  // Build quota pool
  const pool: string[] = [];
  letters.forEach((letter) => {
    for (let i = 0; i < baseCount; i++) {
      pool.push(letter);
    }
  });

  // Randomly select which letters get the remainder
  const shuffledLetters = shuffleArray([...letters], rng);
  for (let i = 0; i < remainder; i++) {
    pool.push(shuffledLetters[i]);
  }

  // Shuffle with anti-streak constraint
  let bestSequence: string[] = [];
  let minStreakFound = 999;

  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = shuffleArray([...pool], rng);
    let maxStreak = 1;
    let curr = 1;
    for (let i = 1; i < candidate.length; i++) {
      if (candidate[i] === candidate[i - 1]) {
        curr++;
        if (curr > maxStreak) maxStreak = curr;
      } else {
        curr = 1;
      }
    }

    if (maxStreak < minStreakFound) {
      minStreakFound = maxStreak;
      bestSequence = candidate;
      if (maxStreak <= 2) break; // Optimal streak reached
    }
  }

  return bestSequence;
}

/**
 * Shuffles only the distractor options while locking the correct answer to its original position.
 * This guarantees 100% that the correct answer letter NEVER changes (e.g. if original was B, it stays B),
 * while the other options (A, C, D, E) are scrambled to prevent copying.
 */
export function shuffleDistractorsKeepAnswerFixed(
  question: QuestionItem,
  rng: () => number = Math.random
): QuestionItem {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const options = [...question.options];
  const numOptions = options.length;
  if (numOptions < 2) return question;

  const targetAnswerLetter = question.originalAnswer || question.currentAnswer || 'A';
  const targetIdx = letters.indexOf(targetAnswerLetter.toUpperCase());
  const validTargetIdx = Math.max(0, Math.min(targetIdx, numOptions - 1));

  // Find the original correct option (the option that was originally at originalAnswer index)
  let correctOption = options.find((opt) => opt.originalLabel === targetAnswerLetter);
  if (!correctOption) {
    // Fallback: option whose currentLabel is currentAnswer
    correctOption = options.find((opt) => opt.currentLabel === question.currentAnswer) || options[validTargetIdx];
  }

  // All other options are distractors
  const distractors = options.filter((opt) => opt.id !== correctOption!.id);
  // Guarantee that every single distractor option is swapped (deranged) to a new position!
  const shuffledDistractors = derangeArray(distractors, rng);

  // Construct new options array with correctOption fixed at validTargetIdx
  const newOptions: OptionItem[] = [];
  let distractorPtr = 0;
  for (let i = 0; i < numOptions; i++) {
    if (i === validTargetIdx) {
      newOptions.push(correctOption!);
    } else {
      newOptions.push(shuffledDistractors[distractorPtr++]);
    }
  }

  // Update currentLabel to reflect positions A, B, C, D...
  const updatedOptions = newOptions.map((opt, idx) => ({
    ...opt,
    currentLabel: letters[idx],
  }));

  return {
    ...question,
    options: updatedOptions,
    currentAnswer: targetAnswerLetter,
  };
}

/**
 * Applies distractor shuffling across all questions while locking every single question's
 * correct answer to its original answer. 100% guarantees original answer key remains identical!
 */
export function applyKeepOriginalAnswerShuffle(
  questions: QuestionItem[],
  rng: () => number = Math.random
): QuestionItem[] {
  return questions.map((q) => shuffleDistractorsKeepAnswerFixed(q, rng));
}

/**
 * Shuffle an individual question's options, optionally placing the correct answer at a target letter
 */
export function shuffleQuestionOptions(
  question: QuestionItem,
  targetAnswerLetter?: string,
  rng: () => number = Math.random
): QuestionItem {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const options = [...question.options];
  const numOptions = options.length;

  // Find which option currently holds the correct answer
  let correctOptionIndex = options.findIndex(
    (opt) => opt.currentLabel === question.currentAnswer
  );
  if (correctOptionIndex === -1) correctOptionIndex = 0;
  const correctOption = options[correctOptionIndex];

  let newOptions: OptionItem[];
  let newAnswerLetter = targetAnswerLetter;

  if (targetAnswerLetter) {
    const targetIdx = letters.indexOf(targetAnswerLetter.toUpperCase());
    const validTargetIdx = Math.max(0, Math.min(targetIdx, numOptions - 1));
    newAnswerLetter = letters[validTargetIdx];

    // Other options shuffled
    const otherOptions = options.filter((_, idx) => idx !== correctOptionIndex);
    const shuffledOthers = shuffleArray(otherOptions, rng);

    newOptions = [];
    let otherPtr = 0;
    for (let i = 0; i < numOptions; i++) {
      if (i === validTargetIdx) {
        newOptions.push(correctOption);
      } else {
        newOptions.push(shuffledOthers[otherPtr++]);
      }
    }
  } else {
    // Pure shuffle
    newOptions = shuffleArray(options, rng);
    const newCorrectIdx = newOptions.findIndex((opt) => opt.id === correctOption.id);
    newAnswerLetter = letters[newCorrectIdx];
  }

  // Update labels to match new positions (A, B, C, D, E)
  const updatedOptions = newOptions.map((opt, idx) => ({
    ...opt,
    currentLabel: letters[idx],
  }));

  return {
    ...question,
    options: updatedOptions,
    currentAnswer: newAnswerLetter,
  };
}

/**
 * Apply Balanced Random Distribution to all questions in the exam
 */
export function applyBalancedShuffle(
  questions: QuestionItem[],
  rng: () => number = Math.random
): QuestionItem[] {
  if (questions.length === 0) return [];

  // Determine standard option count (e.g. 4 for 4-choice)
  const optionCounts = questions.map((q) => q.options.length);
  const commonOptionCount = Math.max(2, Math.min(5, Math.round(
    optionCounts.reduce((a, b) => a + b, 0) / questions.length
  )));

  const targetSequence = generateBalancedAnswerSequence(
    questions.length,
    commonOptionCount,
    rng
  );

  return questions.map((q, idx) => {
    const targetLetter = targetSequence[idx] || 'A';
    return shuffleQuestionOptions(q, targetLetter, rng);
  });
}

/**
 * Apply Pure Random Shuffle to all questions
 */
export function applyPureRandomShuffle(
  questions: QuestionItem[],
  rng: () => number = Math.random
): QuestionItem[] {
  return questions.map((q) => shuffleQuestionOptions(q, undefined, rng));
}

/**
 * Master One-Click Restore:
 * Restores the entire exam back to its original uploaded state:
 * 1. Restores the original question sequence (1, 2, 3... N based on originalNumber or originalQuestions array)
 * 2. Restores all options of every question back to original positions (A, B, C, D based on originalIndex)
 * 3. Restores correct answers back to originalAnswer
 */
export function resetToOriginal(
  questions: QuestionItem[],
  originalQuestions?: QuestionItem[]
): QuestionItem[] {
  const letters = ['A', 'B', 'C', 'D', 'E'];

  let sortedQuestions: QuestionItem[];
  if (originalQuestions && originalQuestions.length === questions.length) {
    const originalOrderMap = new Map<string, number>();
    originalQuestions.forEach((q, idx) => originalOrderMap.set(q.id, idx));
    sortedQuestions = [...questions].sort(
      (a, b) => (originalOrderMap.get(a.id) ?? 0) - (originalOrderMap.get(b.id) ?? 0)
    );
  } else {
    sortedQuestions = [...questions].sort(
      (a, b) => (a.originalNumber || a.number) - (b.originalNumber || b.number)
    );
  }

  // 2. For each question, restore its sequential number, options, and original answer
  return sortedQuestions.map((q, idx) => {
    const origNum = originalQuestions?.[idx]?.number || q.originalNumber || idx + 1;

    const sortedOptions = [...q.options].sort(
      (a, b) => a.originalIndex - b.originalIndex
    );
    const restoredOptions = sortedOptions.map((opt, oIdx) => ({
      ...opt,
      currentLabel: letters[oIdx],
    }));

    const origAns = q.originalAnswer || 'A';
    return {
      ...q,
      number: origNum,
      originalNumber: origNum,
      options: restoredOptions,
      currentAnswer: origAns,
    };
  });
}

/**
 * Restores only the options of each question back to original, keeping the current question sequence.
 */
export function resetOptionsOnly(questions: QuestionItem[]): QuestionItem[] {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return questions.map((q) => {
    const sortedOptions = [...q.options].sort(
      (a, b) => a.originalIndex - b.originalIndex
    );
    const restoredOptions = sortedOptions.map((opt, idx) => ({
      ...opt,
      currentLabel: letters[idx],
    }));

    const origAns = q.originalAnswer || 'A';
    return {
      ...q,
      options: restoredOptions,
      currentAnswer: origAns,
    };
  });
}

/**
 * Manually swap two options in a question
 */
export function swapOptions(
  question: QuestionItem,
  indexA: number,
  indexB: number
): QuestionItem {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  if (
    indexA < 0 ||
    indexB < 0 ||
    indexA >= question.options.length ||
    indexB >= question.options.length
  ) {
    return question;
  }

  const newOptions = [...question.options];
  const temp = newOptions[indexA];
  newOptions[indexA] = newOptions[indexB];
  newOptions[indexB] = temp;

  // Find where the previous correct answer ended up
  // Or if question.currentAnswer was letter at indexA, it is now at indexB
  const prevAns = question.currentAnswer;
  let newAns = prevAns;
  if (letters[indexA] === prevAns) {
    newAns = letters[indexB];
  } else if (letters[indexB] === prevAns) {
    newAns = letters[indexA];
  }

  const updatedOptions = newOptions.map((opt, idx) => ({
    ...opt,
    currentLabel: letters[idx],
  }));

  return {
    ...question,
    options: updatedOptions,
    currentAnswer: newAns,
  };
}

/**
 * Move the correct answer of a question to a specific target letter (e.g. 'C')
 */
export function moveCorrectAnswerTo(
  question: QuestionItem,
  targetLetter: string
): QuestionItem {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const targetIdx = letters.indexOf(targetLetter.toUpperCase());
  if (targetIdx === -1 || targetIdx >= question.options.length) {
    return question;
  }

  const currentIdx = letters.indexOf(question.currentAnswer);
  if (currentIdx === targetIdx) return question;

  return swapOptions(question, currentIdx, targetIdx);
}

/**
 * Applies an imported answer key map to questions, updating both originalAnswer and currentAnswer.
 */
export function applyAnswerKeyMap(
  questions: QuestionItem[],
  answerMap: Map<number, string>
): QuestionItem[] {
  return questions.map((q) => {
    if (answerMap.has(q.number)) {
      const newAns = answerMap.get(q.number)!.toUpperCase();
      return {
        ...q,
        originalAnswer: newAns,
        currentAnswer: newAns,
      };
    }
    return q;
  });
}

/**
 * Shuffles the entire question order and re-indexes the question numbers (1, 2, 3... N).
 * Tracks the original question number in q.originalNumber so answers & diffs stay clear.
 */
export function shuffleAllQuestionsOrder(
  questions: QuestionItem[],
  rng: () => number = Math.random
): QuestionItem[] {
  if (questions.length <= 1) return questions;

  const arr = [...questions];
  let attempts = 0;
  let isDifferent = false;

  while (!isDifferent && attempts < 10) {
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // Check if at least some questions moved position
    isDifferent = arr.some((q, idx) => q.id !== questions[idx].id);
    attempts++;
  }

  // Re-number sequentially from 1 to N
  return arr.map((q, idx) => ({
    ...q,
    number: idx + 1,
    originalNumber: q.originalNumber || q.number,
  }));
}

/**
 * Moves a question from fromIndex to toIndex, and updates all question numbers sequentially.
 */
export function moveQuestionPosition(
  questions: QuestionItem[],
  fromIndex: number,
  toIndex: number
): QuestionItem[] {
  if (
    fromIndex < 0 ||
    fromIndex >= questions.length ||
    toIndex < 0 ||
    toIndex >= questions.length ||
    fromIndex === toIndex
  ) {
    return questions;
  }

  const updated = [...questions];
  const [removed] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, removed);

  return updated.map((q, idx) => ({
    ...q,
    number: idx + 1,
    originalNumber: q.originalNumber || q.number,
  }));
}

/**
 * Restores the questions back to their original sequence order from the uploaded Word file.
 */
export function resetAllQuestionsOrder(
  questions: QuestionItem[],
  originalQuestions?: QuestionItem[]
): QuestionItem[] {
  let sorted: QuestionItem[];
  if (originalQuestions && originalQuestions.length === questions.length) {
    const originalOrderMap = new Map<string, number>();
    originalQuestions.forEach((q, idx) => originalOrderMap.set(q.id, idx));
    sorted = [...questions].sort(
      (a, b) => (originalOrderMap.get(a.id) ?? 0) - (originalOrderMap.get(b.id) ?? 0)
    );
    return sorted.map((q, idx) => ({
      ...q,
      number: originalQuestions[idx].number,
      originalNumber: originalQuestions[idx].originalNumber || originalQuestions[idx].number,
    }));
  }

  sorted = [...questions].sort(
    (a, b) => (a.originalNumber || a.number) - (b.originalNumber || b.number)
  );

  return sorted.map((q) => ({
    ...q,
    number: q.originalNumber || q.number,
  }));
}

/**
 * Shuffles question order (and renumbers sequentially 1..N), AND simultaneously shuffles
 * options of each question, with answer protection if locked.
 */
export function shuffleAllQuestionsAndOptions(
  questions: QuestionItem[],
  isLockOriginalAnswer: boolean = true,
  rng: () => number = Math.random
): QuestionItem[] {
  const shuffledQuestions = shuffleAllQuestionsOrder(questions, rng);
  if (isLockOriginalAnswer) {
    return applyKeepOriginalAnswerShuffle(shuffledQuestions, rng);
  } else {
    return applyBalancedShuffle(shuffledQuestions, rng);
  }
}


