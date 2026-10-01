import React from 'react';
import { DistributionStats, QuestionItem } from '../types/exam';
import { Sparkles, CheckCircle2, AlertTriangle, Shuffle, ArrowRight, Lock } from 'lucide-react';

interface DistributionBarProps {
  stats: DistributionStats;
  questions: QuestionItem[];
  isLockOriginalAnswer: boolean;
  onApplyDistractorShuffle: () => void;
  onApplyBalanced: () => void;
  onApplyRandom: () => void;
  selectedLetterFilter: string | null;
  onSelectLetterFilter: (letter: string | null) => void;
}

const LETTER_COLORS: Record<string, { bg: string; fill: string; text: string; ring: string }> = {
  A: { bg: 'bg-blue-50', fill: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-300' },
  B: { bg: 'bg-emerald-50', fill: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  C: { bg: 'bg-amber-50', fill: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-300' },
  D: { bg: 'bg-purple-50', fill: 'bg-purple-500', text: 'text-purple-700', ring: 'ring-purple-300' },
  E: { bg: 'bg-rose-50', fill: 'bg-rose-500', text: 'text-rose-700', ring: 'ring-rose-300' },
};

export const DistributionBar: React.FC<DistributionBarProps> = ({
  stats,
  questions,
  isLockOriginalAnswer,
  onApplyDistractorShuffle,
  onApplyBalanced,
  onApplyRandom,
  selectedLetterFilter,
  onSelectLetterFilter,
}) => {
  const letters = ['A', 'B', 'C', 'D'];
  const hasE = (stats.counts['E'] || 0) > 0 || questions.some((q) => q.options.length >= 5);
  if (hasE) letters.push('E');

  const idealPercent = Math.round(100 / letters.length);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-semibold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">試卷答案分佈診斷 (Answer Distribution)</h2>
              {isLockOriginalAnswer ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  已鎖定原卷正確答案 (答案卡 100% 相同)
                </span>
              ) : stats.isBalanced ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  已達成均勻分配
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  自訂分佈
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              共 <span className="font-semibold text-slate-700">{stats.total}</span> 題 ｜ 理想佔比約{' '}
              <span className="font-medium text-slate-700">{idealPercent}%</span> ｜ 連續相同答案：{' '}
              <span className="font-medium text-slate-700">{stats.maxStreak} 題</span>
              {isLockOriginalAnswer && (
                <span className="ml-1 text-emerald-700 font-medium">
                  （重排僅對調干擾選項，正確答案絕不變動）
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quick balance actions */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          {isLockOriginalAnswer ? (
            <button
              onClick={onApplyDistractorShuffle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
              title="將所有干擾選項調換順序，且每題正確答案與答案卡 100% 保持與原卷完全相同"
            >
              <Sparkles className="w-3.5 h-3.5" />
              將所有選項調換順序 (正解和原卷相同)
            </button>
          ) : (
            <button
              onClick={onApplyBalanced}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-colors shadow-xs"
              title="將各題正解選項均勻分配至 ABCD (會變更答案卡)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              重新均勻分配 (ABCD)
            </button>
          )}

          <button
            onClick={onApplyRandom}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            title="完全隨機洗牌"
          >
            <Shuffle className="w-3.5 h-3.5" />
            完全隨機
          </button>
        </div>
      </div>

      {/* Distribution Cards & Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-4">
        {letters.map((letter) => {
          const count = stats.counts[letter] || 0;
          const pct = stats.percentages[letter] || 0;
          const theme = LETTER_COLORS[letter] || LETTER_COLORS.A;
          const isSelected = selectedLetterFilter === letter;

          return (
            <button
              key={letter}
              onClick={() => onSelectLetterFilter(isSelected ? null : letter)}
              className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                isSelected
                  ? `border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/40`
                  : `border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm ${theme.bg} ${theme.text} border border-slate-200`}>
                  {letter}
                </span>
                <div className="text-right">
                  <span className="text-base font-extrabold text-slate-800">{count}</span>
                  <span className="text-xs text-slate-400 font-normal ml-0.5">題</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${theme.fill} transition-all duration-300`}
                  style={{ width: `${Math.min(100, (pct / (idealPercent * 1.5)) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                <span>{pct}% 佔比</span>
                <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 flex items-center gap-0.5 transition-colors">
                  篩選 <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedLetterFilter && (
        <div className="mt-3 flex items-center justify-between bg-indigo-50/60 border border-indigo-200/80 px-3 py-1.5 rounded-lg text-xs text-indigo-700">
          <span>目前僅顯示正解為【<strong>{selectedLetterFilter}</strong>】的題目</span>
          <button
            onClick={() => onSelectLetterFilter(null)}
            className="font-medium hover:underline text-indigo-800"
          >
            清除篩選
          </button>
        </div>
      )}
    </div>
  );
};
