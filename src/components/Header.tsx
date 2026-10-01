import React, { useState } from 'react';
import { FileText, HelpCircle, Sparkles, FolderUp, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface HeaderProps {
  currentFileName?: string;
  totalQuestions?: number;
  onResetFile: () => void;
  onLoadSample: (key: 'redMark' | 'comprehensive' | 'english') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFileName,
  totalQuestions,
  onResetFile,
  onLoadSample,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  Docx Exam Editor
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  原檔排版 100% 保留
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                試題卷 Word 讀取 · 亂數平均分配 · 自由更換選項順序
              </p>
            </div>
          </div>

          {/* Current file & actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentFileName && (
              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-700 truncate max-w-[200px]" title={currentFileName}>
                  {currentFileName}
                </span>
                <span className="bg-white px-1.5 py-0.5 rounded text-slate-600 font-semibold border border-slate-200">
                  {totalQuestions} 題
                </span>
              </div>
            )}

            {currentFileName ? (
              <button
                onClick={onResetFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                title="關閉目前試卷並重新上傳"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">更換試卷</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onLoadSample('comprehensive')}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3 h-3" /> 載入示範卷
                </button>
              </div>
            )}

            <button
              onClick={() => setShowHelp(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="使用說明與演算法介紹"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">功能與運作原理說明</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-1">🎯 預設「亂數平均分配」是什麼？</h4>
                <p>
                  傳統隨機排列容易造成某些選項（例如連出五個 C 或 A 選項過少）。本系統演算法會先計算最佳配額（例如 20 題各選項正解剛好各 5 題），並保證無連續 3 題相同答案，再自動將各題選項置換，達成最理想的防作弊測驗品質。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-1">📄 支援與原檔「格式完全相同」匯出</h4>
                <p>
                  我們採用純 XML 節點精準置換技術，不破壞 Word 文檔原有的微軟字型、邊界、段落間距、考卷表頭、頁碼、表格或圖片，匯出時可直接提供學校印刷室列印。
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-1">🛠️ 隨意更改選項與手動調整</h4>
                <p>
                  每道題目右側均有 ↑ / ↓ 箭頭可微調順序，亦可直接點擊「快速將正解對調至 A/B/C/D」或點擊選項代號直接指定正解。
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
