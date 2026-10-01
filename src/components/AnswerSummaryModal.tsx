import React, { useState } from 'react';
import { QuestionItem } from '../types/exam';
import { calculateDistribution } from '../utils/shuffler';
import { X, Copy, Check, Table, Download } from 'lucide-react';

interface AnswerSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  title: string;
}

export const AnswerSummaryModal: React.FC<AnswerSummaryModalProps> = ({
  isOpen,
  onClose,
  questions,
  title,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const stats = calculateDistribution(questions);

  // Copy standard line: 1. C   2. A   3. D...
  const handleCopyCompact = () => {
    const text = questions
      .map((q) => `${q.number}. ${q.currentAnswer}`)
      .join('    ');
    navigator.clipboard.writeText(text);
    setCopiedFormat('compact');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Copy column / Excel TSV
  const handleCopyTsv = () => {
    const header = '現題號\t原卷題號\t重排後解答\t原檔答案\t變動狀態\n';
    const rows = questions
      .map(
        (q) =>
          `${q.number}\t${q.originalNumber || q.number}\t${q.currentAnswer}\t${q.originalAnswer || '-'}\t${
            q.currentAnswer !== q.originalAnswer ? '已換位' : '相同'
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(header + rows);
    setCopiedFormat('tsv');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">全卷答案簡表與速查卡</h3>
              <p className="text-xs text-slate-500">
                共 {questions.length} 題 ｜ 完美平均度：{stats.isBalanced ? '100% 理想' : '自訂分配'}
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

        {/* Copy Tools */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-indigo-900">快速複製答案：</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCompact}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-all shadow-2xs"
            >
              {copiedFormat === 'compact' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedFormat === 'compact' ? '已複製行內文字！' : '複製橫向文字 (1. C  2. B)'}
            </button>
            <button
              onClick={handleCopyTsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-all shadow-2xs"
            >
              {copiedFormat === 'tsv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedFormat === 'tsv' ? '已複製 Excel 表格！' : '複製 Excel 表格貼上'}
            </button>
          </div>
        </div>

        {/* Answer Grid Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {questions.map((q) => {
              const isChanged = q.currentAnswer !== q.originalAnswer;
              return (
                <div
                  key={q.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    isChanged
                      ? 'bg-indigo-50/40 border-indigo-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">第 {q.number} 題</span>
                    {q.originalNumber && q.originalNumber !== q.number && (
                      <span className="text-[10px] text-purple-600 font-semibold">
                        (原第 {q.originalNumber} 題)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                      {q.currentAnswer}
                    </span>
                    {isChanged && (
                      <span className="text-[10px] text-slate-400">
                        (原 {q.originalAnswer})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
