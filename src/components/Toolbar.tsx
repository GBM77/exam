import React from 'react';
import { Search, Sparkles, Shuffle, RotateCcw, KeyRound, Download, SplitSquareVertical, Table, Lock, Unlock } from 'lucide-react';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: 'all' | 'changed' | 'unchanged';
  onStatusFilterChange: (status: 'all' | 'changed' | 'unchanged') => void;
  isLockOriginalAnswer: boolean;
  onToggleLockOriginalAnswer: (locked: boolean) => void;
  onApplyDistractorShuffle: () => void;
  onApplyBalanced: () => void;
  onApplyRandom: () => void;
  onResetAll: () => void;
  onResetOptionsOnly?: () => void;
  onShuffleAllQuestions: () => void;
  onShuffleAllQuestionsAndOptions?: () => void;
  onResetQuestionsOrder: () => void;
  isQuestionOrderChanged: boolean;
  isOptionsChanged?: boolean;
  hasChanges?: boolean;
  onOpenAnswerKeyModal: () => void;
  onOpenAnswerSummary: () => void;
  onOpenExportModal: () => void;
  onOpenDiffModal: () => void;
  onReDetectRedAnswers: () => void;
  redMarksDetectedCount?: number;
  totalQuestions: number;
  filteredCount: number;
  hasDetectedAnswers: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLockOriginalAnswer,
  onToggleLockOriginalAnswer,
  onApplyDistractorShuffle,
  onApplyBalanced,
  onApplyRandom,
  onResetAll,
  onResetOptionsOnly,
  onShuffleAllQuestions,
  onShuffleAllQuestionsAndOptions,
  onResetQuestionsOrder,
  isQuestionOrderChanged,
  isOptionsChanged = false,
  hasChanges = false,
  onOpenAnswerKeyModal,
  onOpenAnswerSummary,
  onOpenExportModal,
  onOpenDiffModal,
  onReDetectRedAnswers,
  redMarksDetectedCount = 0,
  totalQuestions,
  filteredCount,
  hasDetectedAnswers,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4 space-y-3">
      {/* Top row: Answer lock protection & quick key setup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onToggleLockOriginalAnswer(!isLockOriginalAnswer)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
              isLockOriginalAnswer
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
            title="開啟時，保證每題正解字母與原卷 100% 相同，重排時僅會對調其餘干擾選項！"
          >
            {isLockOriginalAnswer ? (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>🔒 正確答案與原卷相同 (已鎖定答案卡)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-500" />
                <span>⚪ 正解隨選項移動 (未鎖定)</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-slate-500 hidden md:inline">
            {isLockOriginalAnswer
              ? '✨ 核心保障：正解字母絕不變動，答案卡完全相容原卷，僅干擾選項位置洗牌'
              : '注意：選項換位時，正解字母會隨之變更'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Re-detect from red marks button */}
          <button
            onClick={onReDetectRedAnswers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 shadow-2xs"
            title="重新掃描 Word 試卷檔中所有標記為紅色字體的選項或括號，自動設定為正確答案！"
          >
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span>🔴 依原卷紅字重新判讀</span>
            {redMarksDetectedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-200/80 text-[10px] font-extrabold text-rose-900">
                已識別 {redMarksDetectedCount} 題
              </span>
            )}
          </button>

          <button
            onClick={onOpenAnswerKeyModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              !hasDetectedAnswers
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs'
            }`}
            title="檢視或批次貼上輸入原卷標準答案"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>校對 / 批次貼上答案</span>
            {!hasDetectedAnswers && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>
      </div>

      {/* Second row: Search & Action buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋題幹關鍵字、選項或題號 (例如: 淨零、2、南轅北轍)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({totalQuestions})
            </button>
            <button
              onClick={() => onStatusFilterChange('changed')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'changed'
                  ? 'bg-white text-amber-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              正解已換位
            </button>
            <button
              onClick={() => onStatusFilterChange('unchanged')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'unchanged'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              正解同原卷
            </button>
          </div>
        </div>

        {/* Global Action CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Question Sequence Shuffle Button Group */}
          <div className="inline-flex rounded-lg shadow-xs">
            <button
              onClick={onShuffleAllQuestions}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-l-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold transition-all"
              title="隨機洗牌打亂所有題目的出題順序，並自動重新編號 1, 2, 3... N（每題仍保有各自的正確答案）"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>打亂全部題號與順序</span>
            </button>
            {onShuffleAllQuestionsAndOptions && (
              <button
                onClick={onShuffleAllQuestionsAndOptions}
                className="inline-flex items-center px-2 py-2 rounded-r-lg bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white text-xs font-semibold border-l border-purple-500/50 transition-all"
                title="高階防作弊：同時打亂全卷題目順序，並且連同每題的干擾選項也一起調換！正解依設定鎖定"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden lg:inline ml-1">＋選項全打亂</span>
              </button>
            )}
          </div>

          {/* Main Option Shuffle Button */}
          {isLockOriginalAnswer ? (
            <button
              onClick={onApplyDistractorShuffle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
              title="將所有干擾選項調換順序，保證不留在原位，且正確答案 100% 保持與原卷完全相同！"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>將所有選項調換順序 (正解和原卷相同)</span>
            </button>
          ) : (
            <button
              onClick={onApplyBalanced}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-xs"
              title="將正解選項平均分配至 ABCD (會變更答案卡)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>亂數平均分配 (會換位正解)</span>
            </button>
          )}

          {/* Restore Actions Group */}
          {/* Master One-Click Restore Button */}
          <button
            onClick={onResetAll}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
              hasChanges
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title="一鍵全卷還原：同時恢復原卷原始題目順序、題號（1~N）與所有選項順序！"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${hasChanges ? 'text-amber-800' : 'text-slate-500'}`} />
            <span>⏪ 一鍵全卷還原</span>
            {hasChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="目前有變更，點擊可立即還原" />
            )}
          </button>

          {/* Granular Restores when active */}
          {isQuestionOrderChanged && (
            <button
              onClick={onResetQuestionsOrder}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 text-xs font-semibold transition-colors"
              title="僅還原為原卷原始題號與出題順序（保留目前選項調換狀態）"
            >
              <RotateCcw className="w-3 h-3 text-purple-600" />
              <span>還原題號</span>
            </button>
          )}

          {isOptionsChanged && onResetOptionsOnly && (
            <button
              onClick={onResetOptionsOnly}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors"
              title="僅還原所有題目的選項順序（保留目前題號順序）"
            >
              <RotateCcw className="w-3 h-3 text-emerald-600" />
              <span>還原選項</span>
            </button>
          )}

          <div className="h-5 w-[1px] bg-slate-200 hidden xl:block mx-0.5" />

          <button
            onClick={onOpenAnswerSummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            title="查看完整題號答案對照與複製答案卡"
          >
            <Table className="w-3.5 h-3.5" />
            <span>答案簡表</span>
          </button>

          <button
            onClick={onOpenDiffModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            title="對照原檔與重排後版本差異"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>原檔對照</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow"
          >
            <Download className="w-4 h-4" />
            <span>匯出 Word 檔</span>
          </button>
        </div>
      </div>

      {searchQuery && (
        <div className="text-xs text-slate-500">
          搜尋結果：符合條件共 <strong>{filteredCount}</strong> / {totalQuestions} 題
        </div>
      )}
    </div>
  );
};
