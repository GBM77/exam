import React, { useState } from 'react';
import JSZip from 'jszip';
import { ExamDocument, QuestionItem } from '../types/exam';
import { exportModifiedDocx, generateAnswerSheetDocx, downloadFile } from '../utils/docxExporter';
import { applyKeepOriginalAnswerShuffle, createRng } from '../utils/shuffler';
import { X, Download, FileText, CheckCircle2, ShieldCheck, Archive, Layers } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  examDoc: ExamDocument;
  questions: QuestionItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  examDoc,
  questions,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessText, setExportSuccessText] = useState<string | null>(null);
  const [highlightTeacher, setHighlightTeacher] = useState(true);
  const [customVersionTag, setCustomVersionTag] = useState('A卷');

  if (!isOpen) return null;

  const baseFileName = examDoc.fileName.replace(/\.[^/.]+$/, '');

  // 1. Export Student Docx
  const handleExportStudent = async () => {
    setIsExporting(true);
    setExportSuccessText(null);
    try {
      const blob = await exportModifiedDocx(examDoc, questions, {
        type: 'student',
        versionLabel: customVersionTag,
        clearAnswerBrackets: true,
      });
      const downloadName = `${baseFileName}_${customVersionTag}_學生試題卷.docx`;
      downloadFile(blob, downloadName);
      setExportSuccessText(`已成功匯出「${downloadName}」！格式與原檔 100% 完全相同。`);
    } catch (err: any) {
      alert('匯出失敗：' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export Teacher Docx
  const handleExportTeacher = async () => {
    setIsExporting(true);
    setExportSuccessText(null);
    try {
      const blob = await exportModifiedDocx(examDoc, questions, {
        type: 'teacher',
        versionLabel: customVersionTag,
        highlightCorrect: highlightTeacher,
      });
      const downloadName = `${baseFileName}_${customVersionTag}_教師解答卷.docx`;
      downloadFile(blob, downloadName);
      setExportSuccessText(`已成功匯出「${downloadName}」！答案已標記並保留所有排版。`);
    } catch (err: any) {
      alert('匯出失敗：' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Export Answer Sheet
  const handleExportAnswerSheet = async () => {
    setIsExporting(true);
    setExportSuccessText(null);
    try {
      const blob = await generateAnswerSheetDocx(examDoc, questions, customVersionTag);
      const downloadName = `${baseFileName}_${customVersionTag}_標準答案對照表.docx`;
      downloadFile(blob, downloadName);
      setExportSuccessText(`已成功匯出「${downloadName}」Word 簡表！`);
    } catch (err: any) {
      alert('匯出失敗：' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 4. Batch Export A/B Package (Zip)
  const handleExportABPackage = async () => {
    setIsExporting(true);
    setExportSuccessText(null);
    try {
      const zip = new JSZip();

      // Version A (current questions)
      const studentABlob = await exportModifiedDocx(examDoc, questions, {
        type: 'student',
        versionLabel: 'A卷',
        clearAnswerBrackets: true,
      });
      zip.file(`${baseFileName}_A卷_學生試題卷.docx`, studentABlob);

      const teacherABlob = await exportModifiedDocx(examDoc, questions, {
        type: 'teacher',
        versionLabel: 'A卷',
        highlightCorrect: true,
      });
      zip.file(`${baseFileName}_A卷_教師解答卷.docx`, teacherABlob);

      const answerSheetA = await generateAnswerSheetDocx(examDoc, questions, 'A卷');
      zip.file(`${baseFileName}_A卷_標準答案表.docx`, answerSheetA);

      // Version B (distractor shuffle: options scrambled, but correct answers 100% matched to original key)
      const rngB = createRng(998244353);
      const questionsB = applyKeepOriginalAnswerShuffle(questions, rngB);

      const studentBBlob = await exportModifiedDocx(examDoc, questionsB, {
        type: 'student',
        versionLabel: 'B卷',
        clearAnswerBrackets: true,
      });
      zip.file(`${baseFileName}_B卷_學生試題卷.docx`, studentBBlob);

      const teacherBBlob = await exportModifiedDocx(examDoc, questionsB, {
        type: 'teacher',
        versionLabel: 'B卷',
        highlightCorrect: true,
      });
      zip.file(`${baseFileName}_B卷_教師解答卷.docx`, teacherBBlob);

      const answerSheetB = await generateAnswerSheetDocx(examDoc, questionsB, 'B卷');
      zip.file(`${baseFileName}_B卷_標準答案表.docx`, answerSheetB);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadName = `${baseFileName}_防作弊AB卷全套包裹.zip`;
      downloadFile(zipBlob, downloadName);

      setExportSuccessText(`已成功打包匯出「${downloadName}」！內含 A 卷與 B 卷之完整試卷與解答。`);
    } catch (err: any) {
      alert('打包匯出失敗：' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">匯出 Word 試題卷</h3>
              <p className="text-xs text-slate-500">100% 保留原檔格式、字體與行距</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Question order change notification */}
          {questions.some((q, idx) => (q.originalNumber || idx + 1) !== idx + 1) && (
            <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2 font-medium">
              <span>🔀 目前全卷題目順序已打亂重編（新編號 1~{questions.length}），匯出之 Word 檔案將完全依照新題目順序排列並自動更新題號！</span>
            </div>
          )}

          {/* Version tag setting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-700">試卷版本標籤：</span>
              <p className="text-[11px] text-slate-500">將自動附加於匯出檔名與標題副標</p>
            </div>
            <div className="flex items-center gap-1.5">
              {['A卷', 'B卷', 'C卷', '無標記'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setCustomVersionTag(tag === '無標記' ? '' : tag)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    (tag === '無標記' && customVersionTag === '') || customVersionTag === tag
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher options */}
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={highlightTeacher}
              onChange={(e) => setHighlightTeacher(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span>教師解答卷中，將正確答案選項以<strong>粗體深紅</strong>標示</span>
          </label>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Student Paper */}
            <button
              disabled={isExporting}
              onClick={handleExportStudent}
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 text-left transition-all group flex flex-col justify-between h-32"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    學生考試專用
                  </span>
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">匯出學生試題卷 (.docx)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  題號前括號清空 ( &nbsp; )，選項已重排，可直接印刷發卷
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                下載 Word 試卷 →
              </span>
            </button>

            {/* Teacher Paper */}
            <button
              disabled={isExporting}
              onClick={handleExportTeacher}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 text-left transition-all group flex flex-col justify-between h-32"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    教師批改專用
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">匯出教師解答卷 (.docx)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  題號前填入正解 ( C )，原檔格式 100% 相容
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                下載解答卷 →
              </span>
            </button>

            {/* Answer Key Table */}
            <button
              disabled={isExporting}
              onClick={handleExportAnswerSheet}
              className="p-4 rounded-xl border border-slate-200 hover:border-purple-400 bg-white hover:bg-purple-50/20 text-left transition-all group flex flex-col justify-between h-32"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                    快速對答案
                  </span>
                  <Layers className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">標準答案對照表 (.docx)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  純表格版答案卡，含原選項對照與統計佔比
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                下載答案表 →
              </span>
            </button>

            {/* A/B Version Zip */}
            <button
              disabled={isExporting}
              onClick={handleExportABPackage}
              className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 text-left transition-all group flex flex-col justify-between h-32"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    防作弊神器
                  </span>
                  <Archive className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">打包 A/B 雙版本 (.zip)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  一鍵生成 A 卷 + B 卷（含兩卷試卷、解答卷與答案表）
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                一鍵打包下載 →
              </span>
            </button>
          </div>

          {/* Feedback banner */}
          {exportSuccessText && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{exportSuccessText}</span>
            </div>
          )}

          {/* Guarantee Note */}
          <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-[11px] space-y-1">
            <div className="flex items-center gap-1 text-slate-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              100% 原檔格式保留技術說明
            </div>
            <p>
              系統直接操作 Word 的 OpenXML 結構，僅智慧置換選項與題號括號，原考卷之<strong>邊界、標題、頁碼、頁首、數學公式、表格與圖檔</strong>將分毫不差完全保留。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
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
