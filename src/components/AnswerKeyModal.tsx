import React, { useState } from 'react';
import { QuestionItem } from '../types/exam';
import { parseUserAnswerInput } from '../utils/docxParser';
import { X, KeyRound, CheckCircle2, AlertTriangle, ClipboardPaste, ArrowRight, Lock } from 'lucide-react';

interface AnswerKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  onApplyAnswers: (answerMap: Map<number, string>) => void;
  onSetSingleAnswer: (qId: string, answer: string) => void;
  isLockOriginalAnswer: boolean;
  onToggleLockOriginalAnswer: (locked: boolean) => void;
  onReDetectRedAnswers?: () => void;
}

export const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({
  isOpen,
  onClose,
  questions,
  onApplyAnswers,
  onSetSingleAnswer,
  isLockOriginalAnswer,
  onToggleLockOriginalAnswer,
  onReDetectRedAnswers,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [parseStatus, setParseStatus] = useState<{ count: number; text: string } | null>(null);

  if (!isOpen) return null;

  const handleParseAndApply = () => {
    if (!pasteText.trim()) return;
    const map = parseUserAnswerInput(pasteText);
    if (map.size === 0) {
      setParseStatus({
        count: 0,
        text: '未能解析出任何答案，請確認輸入格式（例如：BCADB 或 1.B 2.A 3.C 或 1-5: B C A D A）',
      });
      return;
    }

    onApplyAnswers(map);
    setParseStatus({
      count: map.size,
      text: `已成功將 ${map.size} 道題目的原卷標準答案校正完成！`,
    });
  };

  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                原卷標準答案校對 ＆ 批次貼上輸入
              </h3>
              <p className="text-xs text-slate-500">
                精準校對每題原卷正解，確保重排時正解 100% 準確無誤
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Switch Banner */}
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 mt-0.5 sm:mt-0 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-900">
                【重要】正確答案保持與原卷完全相同（答案卡 100% 不變）
              </span>
              <p className="text-[11px] text-amber-700">
                開啟時，重排僅會對調其餘干擾項，正解字母（如第1題是B）永遠固定為原卷答案！
              </p>
            </div>
          </div>
          <button
            onClick={() => onToggleLockOriginalAnswer(!isLockOriginalAnswer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
              isLockOriginalAnswer
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isLockOriginalAnswer ? '🟢 已鎖定原卷正解' : '⚪ 未鎖定 (正解可換位)'}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Batch paste area */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                批次貼上原卷解答（支援多種常見格式）：
              </label>
              <div className="flex items-center gap-2">
                {onReDetectRedAnswers && (
                  <button
                    onClick={onReDetectRedAnswers}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
                  >
                    🔴 依原卷紅字重新判讀
                  </button>
                )}
                <span className="text-[11px] text-slate-400">
                  例如：<code>BCADB ACBD</code> 或 <code>1.B 2.A 3.C</code>
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="在此貼上答案字串，如：B C A D B A D C B A 或 1.B 2.C 3.A..."
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
              <button
                onClick={handleParseAndApply}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
              >
                套用答案
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {parseStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  parseStatus.count > 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {parseStatus.count > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{parseStatus.text}</span>
              </div>
            )}
          </div>

          {/* Quick Click Editor Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                逐題指定 / 檢視原卷正解（共 {questions.length} 題）：
              </h4>
              <span className="text-[11px] text-slate-400">
                點擊字母直接修改該題原卷正解
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {questions.map((q) => {
                const optCount = q.options.length || 4;
                const activeLetters = letters.slice(0, optCount);

                return (
                  <div
                    key={q.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {q.number}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[80px]" title={q.title}>
                          第 {q.number} 題
                        </span>
                        {q.answerSource === 'red_mark' && (
                          <span className="text-[10px] text-rose-600 font-bold leading-tight">
                            🔴 紅字正解
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {activeLetters.map((l) => {
                        const isSelected = q.originalAnswer === l;
                        return (
                          <button
                            key={l}
                            onClick={() => onSetSingleAnswer(q.id, l)}
                            className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={`將第 ${q.number} 題正解設為 (${l})`}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            原卷答案已全數鎖定，重排時將嚴格遵照上述答案。
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            完成設定
          </button>
        </div>
      </div>
    </div>
  );
};
