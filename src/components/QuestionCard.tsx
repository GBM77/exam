import React from 'react';
import { QuestionItem } from '../types/exam';
import { ArrowUp, ArrowDown, Shuffle, CheckCircle, RotateCcw, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionItem;
  index: number;
  isLockOriginalAnswer?: boolean;
  onSwapOptions: (qId: string, indexA: number, indexB: number) => void;
  onMoveCorrectAnswer: (qId: string, targetLetter: string) => void;
  onSetCorrectAnswer: (qId: string, letter: string) => void;
  onShuffleQuestion: (qId: string) => void;
  onResetQuestion: (qId: string) => void;
  onMoveQuestionUp?: (qId: string) => void;
  onMoveQuestionDown?: (qId: string) => void;
  isFirstQuestion?: boolean;
  isLastQuestion?: boolean;
}

const LETTER_BADGES: Record<string, { bg: string; text: string; activeBg: string; activeBorder: string }> = {
  A: { bg: 'bg-blue-100 text-blue-800', text: 'text-blue-600', activeBg: 'bg-blue-50/80', activeBorder: 'border-blue-400' },
  B: { bg: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-600', activeBg: 'bg-emerald-50/80', activeBorder: 'border-emerald-400' },
  C: { bg: 'bg-amber-100 text-amber-800', text: 'text-amber-600', activeBg: 'bg-amber-50/80', activeBorder: 'border-amber-400' },
  D: { bg: 'bg-purple-100 text-purple-800', text: 'text-purple-600', activeBg: 'bg-purple-50/80', activeBorder: 'border-purple-400' },
  E: { bg: 'bg-rose-100 text-rose-800', text: 'text-rose-600', activeBg: 'bg-rose-50/80', activeBorder: 'border-rose-400' },
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isLockOriginalAnswer = true,
  onSwapOptions,
  onMoveCorrectAnswer,
  onSetCorrectAnswer,
  onShuffleQuestion,
  onResetQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown,
  isFirstQuestion = false,
  isLastQuestion = false,
}) => {
  const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, question.options.length);
  const isAnswerShifted = question.currentAnswer !== question.originalAnswer;
  const isOptionsReordered = question.options.some((opt, idx) => opt.originalIndex !== idx);
  const isNumberChanged = Boolean(question.originalNumber && question.originalNumber !== question.number);

  return (
    <div
      id={`q-card-${question.id}`}
      className={`bg-white rounded-xl border transition-all ${
        isAnswerShifted
          ? 'border-amber-300 shadow-sm'
          : isOptionsReordered
          ? 'border-emerald-200 shadow-sm hover:border-emerald-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 bg-slate-50/60 rounded-t-xl border-b border-slate-100">
        <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {question.number}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                第 {question.number} 題
              </span>
              {isNumberChanged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                  🔀 原第 {question.originalNumber} 題
                </span>
              )}
              {question.answerSource === 'red_mark' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                  🔴 原卷紅字正解 ({question.originalAnswer})
                </span>
              )}
              {isAnswerShifted ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  ⚠️ 正解已換位：原 ({question.originalAnswer}) ➔ 現 ({question.currentAnswer})
                </span>
              ) : isOptionsReordered ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  正解與原卷相同 ({question.currentAnswer}) · 僅選項順序更動
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                  原卷預設狀態 (正解: {question.originalAnswer})
                </span>
              )}
              {question.layoutType === 'inline' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                  單行排列
                </span>
              )}
            </div>
            {/* Question Stem Text */}
            <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line">
              {question.title}
            </p>
          </div>
        </div>

        {/* Action icons: Move Question Up/Down & Option Shuffle */}
        <div className="flex items-center gap-1 self-start bg-white border border-slate-200 p-0.5 rounded-lg shadow-2xs">
          {onMoveQuestionUp && (
            <button
              disabled={isFirstQuestion}
              onClick={() => onMoveQuestionUp(question.id)}
              className="p-1.5 rounded-md text-slate-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-25 transition-colors"
              title="將整題順序往上移動（題號前移）"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveQuestionDown && (
            <button
              disabled={isLastQuestion}
              onClick={() => onMoveQuestionDown(question.id)}
              className="p-1.5 rounded-md text-slate-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-25 transition-colors"
              title="將整題順序往下移動（題號後移）"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
          <button
            onClick={() => onShuffleQuestion(question.id)}
            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="單獨隨機打亂此題干擾選項"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onResetQuestion(question.id)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="還原為原題順序"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Options List */}
      <div className="p-4 space-y-2.5">
        {question.options.map((opt, optIdx) => {
          const isCurrentAnswer = opt.currentLabel === question.currentAnswer;
          const isOriginalMoved = opt.originalIndex !== optIdx;
          const badgeStyle = LETTER_BADGES[opt.currentLabel] || LETTER_BADGES.A;

          return (
            <div
              key={opt.id}
              className={`flex items-start sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                isCurrentAnswer
                  ? `${badgeStyle.activeBg} ${badgeStyle.activeBorder} ring-1 ring-offset-0`
                  : 'bg-white border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                {/* Option Label Badge (Click to set as answer) */}
                <button
                  onClick={() => onSetCorrectAnswer(question.id, opt.currentLabel)}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center transition-all ${
                    isCurrentAnswer
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="點擊將此選項設為正解"
                >
                  {opt.currentLabel}
                </button>

                {/* Option Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-normal break-words">
                    {opt.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    {opt.isRedMarked && (
                      <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1 shadow-2xs">
                        🔴 原卷紅字標記
                      </span>
                    )}
                    {isOriginalMoved ? (
                      <span className="text-indigo-600 font-medium bg-indigo-50/80 px-1.5 py-0.2 rounded">
                        來自原檔選項 ({opt.originalLabel})
                      </span>
                    ) : (
                      <span>原檔即為 ({opt.originalLabel})</span>
                    )}
                    {isCurrentAnswer && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" />
                        標準答案
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Swap Controls (Up / Down) */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  disabled={optIdx === 0}
                  onClick={() => onSwapOptions(question.id, optIdx, optIdx - 1)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  title="將此選項往上移"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={optIdx === question.options.length - 1}
                  onClick={() => onSwapOptions(question.id, optIdx, optIdx + 1)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                  title="將此選項往下移"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Move Answer Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 rounded-b-xl border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-medium text-slate-700">快速將正解對調至：</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            {letters.map((targetLetter) => {
              const isTargetCurrent = question.currentAnswer === targetLetter;
              return (
                <button
                  key={targetLetter}
                  onClick={() => onMoveCorrectAnswer(question.id, targetLetter)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    isTargetCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title={`直接將正解換位到 ${targetLetter}`}
                >
                  {targetLetter}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-400">
          原題答案：<span className="font-semibold text-slate-600">{question.originalAnswer}</span>
        </div>
      </div>
    </div>
  );
};
