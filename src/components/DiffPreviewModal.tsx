import React from 'react';
import { QuestionItem } from '../types/exam';
import { X, ArrowRight, CheckCircle2, SplitSquareVertical } from 'lucide-react';

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
}

export const DiffPreviewModal: React.FC<DiffPreviewModalProps> = ({
  isOpen,
  onClose,
  questions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <SplitSquareVertical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">原檔 ＆ 重排版 選項對照檢視</h3>
              <p className="text-xs text-slate-500">逐題比對選項位置遷移與答案走向</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {questions.map((q) => {
            const isAnswerShifted = q.currentAnswer !== q.originalAnswer;
            const letters = ['A', 'B', 'C', 'D', 'E'];

            // Sort by original index to recreate original option view
            const originalSorted = [...q.options].sort((a, b) => a.originalIndex - b.originalIndex);

            return (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3"
              >
                {/* Question title & status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-800 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {q.number}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700">第 {q.number} 題</span>
                        {q.originalNumber && q.originalNumber !== q.number && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                            🔀 來自原卷第 {q.originalNumber} 題
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2 mt-0.5">
                        {q.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-slate-500">
                      正解：
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-xs text-slate-700">
                      原 {q.originalAnswer}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                      isAnswerShifted ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      現 {q.currentAnswer} {isAnswerShifted ? '(換位)' : '(同原卷)'}
                    </span>
                  </div>
                </div>

                {/* Side-by-side Options Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Left: Original options */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      【上傳原檔選項順序】
                    </div>
                    {originalSorted.map((opt, idx) => (
                      <div
                        key={opt.id}
                        className={`text-xs p-1.5 rounded flex items-center gap-2 ${
                          letters[idx] === q.originalAnswer
                            ? 'bg-amber-100/70 text-amber-900 font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        <span className="w-5 h-5 rounded bg-white font-bold flex items-center justify-center text-[11px] shadow-2xs">
                          {letters[idx]}
                        </span>
                        <span className="truncate flex-1">{opt.text}</span>
                        {letters[idx] === q.originalAnswer && (
                          <span className="text-[10px] bg-amber-200/80 px-1 rounded text-amber-800">
                            原正解
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right: Current shuffled options */}
                  <div className="p-2.5 rounded-lg bg-indigo-50/40 border border-indigo-200/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1">
                      【重排後選項順序】
                    </div>
                    {q.options.map((opt, idx) => (
                      <div
                        key={opt.id}
                        className={`text-xs p-1.5 rounded flex items-center gap-2 ${
                          opt.currentLabel === q.currentAnswer
                            ? 'bg-indigo-100 text-indigo-900 font-semibold'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="w-5 h-5 rounded bg-white font-bold flex items-center justify-center text-[11px] shadow-2xs">
                          {opt.currentLabel}
                        </span>
                        <span className="truncate flex-1">{opt.text}</span>
                        <span className="text-[10px] text-slate-400 bg-white/70 px-1 rounded">
                          (來自原 {opt.originalLabel})
                        </span>
                        {opt.currentLabel === q.currentAnswer && (
                          <span className="text-[10px] bg-indigo-600 px-1 rounded text-white font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> 正解
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            關閉檢視
          </button>
        </div>
      </div>
    </div>
  );
};
