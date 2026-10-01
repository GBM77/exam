import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, BookOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { generateSampleDocxBlob } from '../utils/sampleGenerator';

interface FileUploadProps {
  onFileSelect: (file: File | Blob, fileName: string) => Promise<void>;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMessage(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processSelectedFile(files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processSelectedFile(files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setErrorMessage('請上傳 .docx 格式的 Word 試題卷檔案（若為舊版 .doc，請先在 Word 另存為 .docx）。');
      return;
    }

    try {
      await onFileSelect(file, file.name);
    } catch (err: any) {
      setErrorMessage(err.message || '檔案解析失敗，請確認檔案格式是否正確。');
    }
  };

  const handleLoadSample = async (key: 'redMark' | 'comprehensive' | 'english') => {
    setErrorMessage(null);
    try {
      const { blob, fileName } = await generateSampleDocxBlob(key);
      await onFileSelect(blob, fileName);
    } catch (err: any) {
      setErrorMessage(err.message || '載入範例失敗。');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="text-center space-y-3 py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          業界唯一：100% 完美相容 Word 原始樣式、排版與公式字型
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          試題卷 Word 讀取 ＆ 答案順序重排編輯器
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          上傳段考或模擬考 Word 試題卷，預設採用<strong>亂數平均分配</strong>或隨心對調 ABCDE
          選項，並自動匯出與原檔<strong>格式完全相同</strong>的學生考卷與教師解答卷。
        </p>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/80 shadow-xs'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              點擊此處或拖曳 Word (.docx) 試卷檔案至此
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              支援段考、學測、會考、證照檢定等各類選擇題考卷
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs">
            <FileText className="w-4 h-4" />
            選擇本機檔案 (.docx)
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-2">
            <span className="text-rose-600 font-semibold">🔴 智慧相容：原卷選項標示紅字直接判讀正解</span>
            <span>✓ 支援 (A)(B)(C)(D) 與單行/多行選項排列</span>
            <span>✓ 自動辨識題號前答案括號 ( )</span>
            <span>✓ 原汁原味保留頁首頁尾與字體</span>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-700">正在解析 Word 試題架構與選項紅字樣式...</p>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">上傳提示</p>
            <p className="text-xs sm:text-sm mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Quick Test with Pre-built Sample Exams */}
      <div className="bg-slate-100/70 rounded-2xl p-5 sm:p-6 border border-slate-200/80">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-800">手邊沒有檔案？立即一鍵載入標準範例卷體驗：</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => handleLoadSample('redMark')}
            className="flex items-start justify-between p-4 rounded-xl bg-white border border-rose-200 hover:border-rose-400 hover:shadow-xs text-left transition-all group"
          >
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                🔴 紅字正解標記卷
              </span>
              <p className="text-sm font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                自然科技出題卷 (紅字選項)
              </p>
              <p className="text-xs text-slate-500">
                題前為空白括號 ( )，出題教師直接以紅字標示正確選項
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
          </button>

          <button
            onClick={() => handleLoadSample('comprehensive')}
            className="flex items-start justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs text-left transition-all group"
          >
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                範例二 · 素養題型
              </span>
              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                國文與社會綜合素養試卷 (12 題)
              </p>
              <p className="text-xs text-slate-500">
                含標題、考試資訊方塊、題號前答案括號、多行與單行選項
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
          </button>

          <button
            onClick={() => handleLoadSample('english')}
            className="flex items-start justify-between p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs text-left transition-all group"
          >
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                範例三 · 語文英檢
              </span>
              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                高中英文閱讀測驗模擬試卷 (8 題)
              </p>
              <p className="text-xs text-slate-500">
                四選一單選題、單行連續排列、題幹完整
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
