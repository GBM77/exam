/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExamDocument, QuestionItem } from './types/exam';
import { parseDocxFile, reDetectRedAnswersFromDocx } from './utils/docxParser';
import {
  calculateDistribution,
  applyKeepOriginalAnswerShuffle,
  applyBalancedShuffle,
  applyPureRandomShuffle,
  resetToOriginal,
  swapOptions,
  moveCorrectAnswerTo,
  shuffleQuestionOptions,
  shuffleDistractorsKeepAnswerFixed,
  applyAnswerKeyMap,
  shuffleAllQuestionsOrder,
  shuffleAllQuestionsAndOptions,
  moveQuestionPosition,
  resetAllQuestionsOrder,
  resetOptionsOnly,
} from './utils/shuffler';
import { generateSampleDocxBlob } from './utils/sampleGenerator';

import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { DistributionBar } from './components/DistributionBar';
import { Toolbar } from './components/Toolbar';
import { QuestionCard } from './components/QuestionCard';
import { ExportModal } from './components/ExportModal';
import { AnswerSummaryModal } from './components/AnswerSummaryModal';
import { DiffPreviewModal } from './components/DiffPreviewModal';
import { AnswerKeyModal } from './components/AnswerKeyModal';
import { Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export default function App() {
  const [examDoc, setExamDoc] = useState<ExamDocument | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Core requirement: "正確答案要和原卷相同不能改變"
  // Default to TRUE so answers are locked 100% to original exam!
  const [isLockOriginalAnswer, setIsLockOriginalAnswer] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'changed' | 'unchanged'>('all');
  const [selectedLetterFilter, setSelectedLetterFilter] = useState<string | null>(null);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAnswerSummaryOpen, setIsAnswerSummaryOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false);

  // Toast / notification
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionNotification(msg);
    setTimeout(() => setActionNotification(null), 3500);
  };

  // File Loader
  const handleFileSelect = async (file: File | Blob, fileName: string) => {
    setIsLoading(true);
    try {
      const parsedDoc = await parseDocxFile(file, fileName);
      if (parsedDoc.questions.length === 0) {
        throw new Error(
          '未能在此 Word 檔案中辨識出任何選擇題與選項。請確認考卷包含如「1. 題目 (A) ... (B) ...」之格式。'
        );
      }

      // User's explicit requirement: "將所有選項調換順序 , 但正解要和原卷相同"
      // Automatically reorder all options while guaranteeing every question's correct answer is 100% identical to original!
      const reorderedQuestions = applyKeepOriginalAnswerShuffle(parsedDoc.questions);

      setExamDoc(parsedDoc);
      setQuestions(reorderedQuestions);
      setSearchQuery('');
      setStatusFilter('all');
      setSelectedLetterFilter(null);
      setIsLockOriginalAnswer(true);

      if (parsedDoc.redMarksDetectedCount && parsedDoc.redMarksDetectedCount > 0) {
        showToast(
          `🔴 成功依原卷紅字標記識別出 ${parsedDoc.redMarksDetectedCount} 題正解！已自動調換選項順序，正解與原卷相同。`
        );
      } else if (parsedDoc.hasDetectedAnswers) {
        showToast(`已成功讀取並將所有選項調換順序！正解 100% 與原卷完全相同。`);
      } else {
        showToast(`已調換選項順序！可隨時點擊「🔴 依原卷紅字重新判讀」或「校對答案」。`);
      }
    } catch (err: any) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFile = () => {
    setExamDoc(null);
    setQuestions([]);
    setSearchQuery('');
  };

  const handleLoadSample = async (key: 'redMark' | 'comprehensive' | 'english') => {
    setIsLoading(true);
    try {
      const { blob, fileName } = await generateSampleDocxBlob(key);
      await handleFileSelect(blob, fileName);
    } catch (err: any) {
      alert('載入範例失敗：' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-detect from red marked options in Word document
  const handleReDetectRedAnswers = () => {
    if (!examDoc) return;
    const result = reDetectRedAnswersFromDocx(examDoc.documentXmlDoc, questions);
    if (result.detectedCount === 0) {
      showToast('未在原卷 XML 中偵測到紅色字體選項或標記。建議使用「校對答案」手動指定或批次貼上。');
      return;
    }

    const updated = isLockOriginalAnswer
      ? applyKeepOriginalAnswerShuffle(result.updatedQuestions)
      : result.updatedQuestions;

    setQuestions(updated);
    setExamDoc({
      ...examDoc,
      hasDetectedAnswers: true,
      redMarksDetectedCount: result.detectedCount,
      questions: result.updatedQuestions,
    });

    const sampleList = result.details
      .slice(0, 4)
      .map((d) => `第${d.qNum}題:${d.answer}`)
      .join(', ');
    showToast(
      `🔴 已依原卷紅字標記成功判讀 ${result.detectedCount} 題正解 (${sampleList}${
        result.details.length > 4 ? '...' : ''
      })！正解已校準並鎖定。`
    );
  };

  // 1. Shuffling: ONLY change options, keep correct answer identical to original exam!
  const handleApplyDistractorShuffle = () => {
    setQuestions((prev) => applyKeepOriginalAnswerShuffle(prev));
    showToast('已完成選項重排！正確答案 100% 保持與原卷完全相同，答案卡不需修改。');
  };

  // 2. Balanced distribution (shifts answers to balance ABCD evenly across 25%)
  const handleApplyBalanced = () => {
    if (isLockOriginalAnswer) {
      // If locked, do distractor shuffle to protect answers
      handleApplyDistractorShuffle();
      return;
    }
    setQuestions((prev) => applyBalancedShuffle(prev));
    showToast('已重新將選項均勻分配至各字母 (ABCD)。');
  };

  // 3. Pure random shuffle
  const handleApplyRandom = () => {
    if (isLockOriginalAnswer) {
      handleApplyDistractorShuffle();
      return;
    }
    setQuestions((prev) => applyPureRandomShuffle(prev));
    showToast('已隨機打亂所有題目的選項順序。');
  };

  // 4. One-Click Master Restore back to original document order & options
  const handleResetAll = () => {
    setQuestions((prev) => resetToOriginal(prev, examDoc?.questions));
    setIsLockOriginalAnswer(true);
    showToast('⏪ 已一鍵全卷還原！題目順序、題號與所有選項已 100% 恢復為原卷原始狀態。');
  };

  const handleResetOptionsOnly = () => {
    setQuestions((prev) => resetOptionsOnly(prev));
    showToast('已將全卷所有題目的選項順序還原為原卷狀態。');
  };

  // 5. Question order shuffling: "設定可打亂全部題號和順序"
  const handleShuffleAllQuestions = () => {
    const shuffled = shuffleAllQuestionsOrder(questions);
    setQuestions(shuffled);
    showToast('🔀 已打亂全卷題目順序，並重新由 1 至 N 編號！各題內容與正解完整保留。');
  };

  const handleShuffleAllQuestionsAndOptions = () => {
    const shuffled = shuffleAllQuestionsAndOptions(questions, isLockOriginalAnswer);
    setQuestions(shuffled);
    showToast(
      isLockOriginalAnswer
        ? '⚡ 已打亂全卷題號順序與所有選項！正解 100% 保持與原卷完全相同。'
        : '⚡ 已打亂全卷題號順序與所有選項！正解已平均分散至各字母。'
    );
  };

  const handleResetQuestionsOrder = () => {
    const restored = resetAllQuestionsOrder(questions, examDoc?.questions);
    setQuestions(restored);
    showToast('已將全卷題目順序還原為原卷原始題號與順序。');
  };

  const handleMoveQuestionUp = (qId: string) => {
    const idx = questions.findIndex((q) => q.id === qId);
    if (idx > 0) {
      const moved = moveQuestionPosition(questions, idx, idx - 1);
      setQuestions(moved);
    }
  };

  const handleMoveQuestionDown = (qId: string) => {
    const idx = questions.findIndex((q) => q.id === qId);
    if (idx >= 0 && idx < questions.length - 1) {
      const moved = moveQuestionPosition(questions, idx, idx + 1);
      setQuestions(moved);
    }
  };

  const isQuestionOrderChanged = Boolean(
    examDoc &&
    questions.some((q, idx) => q.id !== examDoc.questions[idx]?.id)
  );

  const isOptionsChanged = questions.some(
    (q) =>
      q.options.some((opt, idx) => opt.originalIndex !== idx) ||
      q.currentAnswer !== q.originalAnswer
  );

  const hasChanges = isQuestionOrderChanged || isOptionsChanged;

  // Answer Key actions
  const handleApplyAnswerKeyMap = (map: Map<number, string>) => {
    setQuestions((prev) => applyAnswerKeyMap(prev, map));
    if (examDoc) {
      setExamDoc({
        ...examDoc,
        hasDetectedAnswers: true,
      });
    }
    showToast(`已更新 ${map.size} 道題目的原卷標準答案！`);
  };

  const handleSetSingleAnswer = (qId: string, letter: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              originalAnswer: letter,
              currentAnswer: isLockOriginalAnswer ? letter : q.currentAnswer,
            }
          : q
      )
    );
  };

  // Individual Question actions
  const handleSwapOptions = (qId: string, idxA: number, idxB: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const swapped = swapOptions(q, idxA, idxB);
        if (isLockOriginalAnswer) {
          // Keep correct answer locked to original answer
          return {
            ...swapped,
            currentAnswer: q.originalAnswer,
          };
        }
        return swapped;
      })
    );
  };

  const handleMoveCorrectAnswer = (qId: string, targetLetter: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? moveCorrectAnswerTo(q, targetLetter) : q))
    );
  };

  const handleSetCorrectAnswer = (qId: string, letter: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              currentAnswer: letter,
              originalAnswer: isLockOriginalAnswer ? letter : q.originalAnswer,
            }
          : q
      )
    );
  };

  const handleShuffleQuestion = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (isLockOriginalAnswer) {
          return shuffleDistractorsKeepAnswerFixed(q);
        }
        return shuffleQuestionOptions(q);
      })
    );
  };

  const handleResetQuestion = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const letters = ['A', 'B', 'C', 'D', 'E'];
        const sorted = [...q.options].sort((a, b) => a.originalIndex - b.originalIndex);
        const restored = sorted.map((opt, idx) => ({
          ...opt,
          currentLabel: letters[idx],
        }));
        return {
          ...q,
          options: restored,
          currentAnswer: q.originalAnswer || 'A',
        };
      })
    );
  };

  // Filtered Questions List
  const filteredQuestions = questions.filter((q) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const inTitle = q.title.toLowerCase().includes(query);
      const inNumber = q.number.toString() === query || `第${q.number}題`.includes(query);
      const inOptions = q.options.some((opt) => opt.text.toLowerCase().includes(query));
      if (!inTitle && !inNumber && !inOptions) return false;
    }

    // 2. Status Filter
    if (statusFilter === 'changed') {
      if (q.currentAnswer === q.originalAnswer) return false;
    } else if (statusFilter === 'unchanged') {
      if (q.currentAnswer !== q.originalAnswer) return false;
    }

    // 3. Distribution Letter Filter
    if (selectedLetterFilter) {
      if (q.currentAnswer !== selectedLetterFilter) return false;
    }

    return true;
  });

  const stats = calculateDistribution(questions);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        currentFileName={examDoc?.fileName}
        totalQuestions={questions.length}
        onResetFile={handleResetFile}
        onLoadSample={handleLoadSample}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!examDoc ? (
          // File Upload Screen
          <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
        ) : (
          // Main Editor View
          <div className="space-y-6">
            {/* Action Toast */}
            {actionNotification && (
              <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in slide-in-from-bottom duration-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{actionNotification}</span>
              </div>
            )}

            {/* Exam Banner & Protection Guarantee */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    正在編輯試卷
                  </span>
                  {isLockOriginalAnswer ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      正解鎖定保護：原卷答案卡 100% 相同
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      正解可換位模式
                    </span>
                  )}
                  {isQuestionOrderChanged && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                      🔀 題目順序已打亂 (重編 1~{questions.length} 題)
                    </span>
                  )}
                  {examDoc.redMarksDetectedCount && examDoc.redMarksDetectedCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                      🔴 原卷紅字標記識別：{examDoc.redMarksDetectedCount} 題正解
                    </span>
                  ) : null}
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
                  {examDoc.title || examDoc.fileName}
                </h2>
                <p className="text-xs text-slate-500">
                  來源檔案：{examDoc.fileName} ｜ 共解析出 <strong>{questions.length}</strong> 道選擇題
                  {examDoc.hasDetectedAnswers ? (
                    <span className="text-emerald-700 font-semibold ml-2">
                      （✓ 已成功自動辨識原卷正解）
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsAnswerKeyModalOpen(true)}
                      className="text-amber-700 font-semibold ml-2 hover:underline inline-flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      點此校對或貼上原卷標準答案
                    </button>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleReDetectRedAnswers}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs sm:text-sm font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                  title="重新以高靈敏度掃描 Word 試題中所有紅字選項，校準正確答案！"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  🔴 依原卷紅字重新判讀
                </button>
                <button
                  onClick={() => setIsAnswerKeyModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  校對原卷答案
                </button>
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all"
                >
                  匯出 Word 試題卷 / 解答卷
                </button>
              </div>
            </div>

            {/* Answer Distribution Diagnostic */}
            <DistributionBar
              stats={stats}
              questions={questions}
              isLockOriginalAnswer={isLockOriginalAnswer}
              onApplyDistractorShuffle={handleApplyDistractorShuffle}
              onApplyBalanced={handleApplyBalanced}
              onApplyRandom={handleApplyRandom}
              selectedLetterFilter={selectedLetterFilter}
              onSelectLetterFilter={setSelectedLetterFilter}
            />

            {/* Search, Filter & Quick Shuffle Toolbar */}
            <Toolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              isLockOriginalAnswer={isLockOriginalAnswer}
              onToggleLockOriginalAnswer={setIsLockOriginalAnswer}
              onApplyDistractorShuffle={handleApplyDistractorShuffle}
              onApplyBalanced={handleApplyBalanced}
              onApplyRandom={handleApplyRandom}
              onResetAll={handleResetAll}
              onResetOptionsOnly={handleResetOptionsOnly}
              onShuffleAllQuestions={handleShuffleAllQuestions}
              onShuffleAllQuestionsAndOptions={handleShuffleAllQuestionsAndOptions}
              onResetQuestionsOrder={handleResetQuestionsOrder}
              isQuestionOrderChanged={isQuestionOrderChanged}
              isOptionsChanged={isOptionsChanged}
              hasChanges={hasChanges}
              onOpenAnswerKeyModal={() => setIsAnswerKeyModalOpen(true)}
              onOpenAnswerSummary={() => setIsAnswerSummaryOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onOpenDiffModal={() => setIsDiffModalOpen(true)}
              onReDetectRedAnswers={handleReDetectRedAnswers}
              redMarksDetectedCount={examDoc.redMarksDetectedCount}
              totalQuestions={questions.length}
              filteredCount={filteredQuestions.length}
              hasDetectedAnswers={examDoc.hasDetectedAnswers}
            />

            {/* Question Cards Grid / List */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
                <p className="text-base font-semibold">找不到符合目前條件的題目</p>
                <p className="text-xs">請嘗試清除搜尋關鍵字或重設篩選器。</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSelectedLetterFilter(null);
                  }}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  清除所有篩選條件
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={idx}
                    isLockOriginalAnswer={isLockOriginalAnswer}
                    onSwapOptions={handleSwapOptions}
                    onMoveCorrectAnswer={handleMoveCorrectAnswer}
                    onSetCorrectAnswer={handleSetCorrectAnswer}
                    onShuffleQuestion={handleShuffleQuestion}
                    onResetQuestion={handleResetQuestion}
                    onMoveQuestionUp={handleMoveQuestionUp}
                    onMoveQuestionDown={handleMoveQuestionDown}
                    isFirstQuestion={idx === 0}
                    isLastQuestion={idx === filteredQuestions.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {examDoc && (
        <>
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            examDoc={examDoc}
            questions={questions}
          />
          <AnswerSummaryModal
            isOpen={isAnswerSummaryOpen}
            onClose={() => setIsAnswerSummaryOpen(false)}
            questions={questions}
            title={examDoc.title}
          />
          <DiffPreviewModal
            isOpen={isDiffModalOpen}
            onClose={() => setIsDiffModalOpen(false)}
            questions={questions}
          />
          <AnswerKeyModal
            isOpen={isAnswerKeyModalOpen}
            onClose={() => setIsAnswerKeyModalOpen(false)}
            questions={questions}
            onApplyAnswers={handleApplyAnswerKeyMap}
            onSetSingleAnswer={handleSetSingleAnswer}
            isLockOriginalAnswer={isLockOriginalAnswer}
            onToggleLockOriginalAnswer={setIsLockOriginalAnswer}
            onReDetectRedAnswers={handleReDetectRedAnswers}
          />
        </>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-400 mt-auto">
        <p>Docx Exam Editor · 試題卷 Word 讀取與答案重排器 · 正確答案 100% 保持與原卷相同 · 原檔排版完全相容</p>
      </footer>
    </div>
  );
}
