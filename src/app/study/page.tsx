'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Clock,
  BookOpen,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { QuickAddModal } from '@/components/ui/QuickAddModal';
import { Note } from '@/lib/types';
import { NoteSummarizerTab } from '@/components/study/NoteSummarizerTab';
import { FlashcardsTab } from '@/components/study/FlashcardsTab';
import { PomodoroTab } from '@/components/study/PomodoroTab';
import { AssignmentTrackerTab } from '@/components/study/AssignmentTrackerTab';

type SubTab = 'summarizer' | 'flashcards' | 'pomodoro' | 'assignments';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'summarizer', label: 'Note Summarizer' },
  { key: 'flashcards', label: 'Flashcard Spaced Repetition' },
  { key: 'pomodoro', label: 'Pomodoro Focus Timer' },
  { key: 'assignments', label: 'Assignment Tracker' },
];

export default function StudyPage() {
  const {
    notes,
    flashcards,
    assignments,
    studySessions,
    addNote,
    updateNote,
    deleteNote,
    addFlashcard,
    updateFlashcard,
    reviewFlashcard,
    deleteFlashcard,
    toggleAssignment,
    deleteAssignment,
    logStudySession,
    streaks,
  } = useDashboard();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('summarizer');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0] || null);
  const [toast, setToast] = useState<string | null>(null);

  const studyStreak = useMemo(
    () => streaks.find((s) => s.module === 'study')?.current_streak || 0,
    [streaks]
  );

  const pendingAssignments = useMemo(
    () => assignments.reduce((n, a) => (a.status !== 'completed' ? n + 1 : n), 0),
    [assignments]
  );

  // Stable identity so the tab panels below are not forced to re-render.
  const openQuickAdd = useCallback(() => setIsQuickAddOpen(true), []);
  const closeQuickAdd = useCallback(() => setIsQuickAddOpen(false), []);

  const handleConvertNoteToFlashcards = useCallback(async (note: Note) => {
    if (!note.key_points || note.key_points.length === 0) {
      await addFlashcard({
        note_id: note.id,
        subject: note.subject,
        question: `Jelaskan ringkasan materi: ${note.title}`,
        answer: note.summary || note.raw_content.slice(0, 200),
        difficulty: 1,
        next_review_date: new Date().toISOString().slice(0, 10),
        repetition_count: 0,
      });
      confetti({ particleCount: 60, spread: 50 });
      setToast(`Berhasil membuat flashcard dari "${note.title}".`);
      return;
    }

    const count = Math.min(note.key_points.length, 3);
    const today = new Date().toISOString().slice(0, 10);

    // Fire the inserts together instead of awaiting each round-trip in turn.
    await Promise.all(
      note.key_points.slice(0, count).map((point, i) =>
        addFlashcard({
          note_id: note.id,
          subject: note.subject,
          question: `Jelaskan konsep: ${note.title} (Poin ${i + 1})`,
          answer: point,
          difficulty: 2,
          next_review_date: today,
          repetition_count: 0,
        })
      )
    );

    confetti({ particleCount: 70, spread: 60 });
    setToast(`Berhasil membuat ${count} flashcard dari materi "${note.title}".`);
  }, [addFlashcard]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <TopHeader
        title="Study Tools & Learning Hub"
        subtitle="Note Summarizer, flashcard spaced repetition, timer fokus, & manajemen tugas kuliah."
        badgeText="Study Engine"
      />

      {/* Row 1: Stat Cards */}
      <section className="stat-grid">
        <StatCard
          variant="dark"
          title="Daily Study Streak"
          value={`${studyStreak} Hari Berturut-turut`}
          subtitle="Konsistensi belajar Machine Learning & Data Science"
          badgeText="Active Track"
          badgeType="lime"
          icon={<Clock className="w-5 h-5 text-[#E4FF6B]" />}
          actionButton={
            <button
              onClick={() => setActiveSubTab('pomodoro')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E4FF6B] hover:underline"
            >
              Mulai Timer Pomodoro <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        <StatCard
          variant="lime"
          title="Flashcards Ready"
          value={`${flashcards.length} Kartu Aktif`}
          subtitle="Spaced repetition untuk memperkuat ingatan konsep"
          badgeText="Active Deck"
          badgeType="dark"
          icon={<BookOpen className="w-5 h-5 text-black" />}
          actionButton={
            <button
              onClick={() => setActiveSubTab('flashcards')}
              className="text-xs font-bold text-black/80 hover:underline flex items-center gap-1"
            >
              Review Kartu Sekarang <ArrowRight className="w-3 h-3" />
            </button>
          }
        />

        <StatCard
          variant="white"
          title="Assignments & Deadlines"
          value={`${pendingAssignments} Tugas Pending`}
          subtitle={`Total ${assignments.length} tugas terdaftar`}
          badgeText="Urgent Track"
          badgeType="neutral"
          icon={<Calendar className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setActiveSubTab('assignments')}
              className="text-xs font-bold hover:underline flex items-center gap-1"
            >
              Buka Assignment Board →
            </button>
          }
        />
      </section>

      {/* Sub-Navigation Tabs */}
      <div className="tab-strip" role="tablist" aria-label="Study tools">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeSubTab === tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`tab-item ${activeSubTab === tab.key ? 'tab-item-active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {toast && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 p-3 rounded-2xl card-muted"
        >
          <span className="text-xs font-bold">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[10px] font-black text-muted hover:text-current shrink-0"
          >
            TUTUP
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {activeSubTab === 'summarizer' && (
        <NoteSummarizerTab
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onConvertToFlashcards={handleConvertNoteToFlashcards}
        />
      )}

      {activeSubTab === 'flashcards' && (
        <FlashcardsTab
          flashcards={flashcards}
          onReviewFlashcard={reviewFlashcard}
          onUpdateFlashcard={updateFlashcard}
          onDeleteFlashcard={deleteFlashcard}
          onOpenQuickAdd={openQuickAdd}
        />
      )}

      {activeSubTab === 'pomodoro' && (
        <PomodoroTab
          studySessions={studySessions}
          onLogStudySession={logStudySession}
        />
      )}

      {activeSubTab === 'assignments' && (
        <AssignmentTrackerTab
          assignments={assignments}
          onToggleAssignment={toggleAssignment}
          onDeleteAssignment={deleteAssignment}
          onOpenQuickAdd={openQuickAdd}
        />
      )}

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={closeQuickAdd}
          defaultTab="note"
        />
      )}
    </div>
  );
}
