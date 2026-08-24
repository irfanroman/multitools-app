'use client';

import React, { useState } from 'react';
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

  const [activeSubTab, setActiveSubTab] = useState<'summarizer' | 'flashcards' | 'pomodoro' | 'assignments'>('summarizer');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0] || null);

  const studyStreak = streaks.find((s) => s.module === 'study')?.current_streak || 0;

  const handleConvertNoteToFlashcards = async (note: Note) => {
    if (!note.key_points || note.key_points.length === 0) {
      await addFlashcard({
        note_id: note.id,
        subject: note.subject,
        question: `Jelaskan ringkasan materi: ${note.title}`,
        answer: note.summary || note.raw_content.slice(0, 200),
        difficulty: 1,
        next_review_date: new Date().toISOString().split('T')[0],
        repetition_count: 0,
      });
      confetti({ particleCount: 60, spread: 50 });
      alert(`Berhasil membuat flashcard dari "${note.title}"!`);
      return;
    }

    for (let i = 0; i < Math.min(note.key_points.length, 3); i++) {
      const point = note.key_points[i];
      await addFlashcard({
        note_id: note.id,
        subject: note.subject,
        question: `Jelaskan konsep: ${note.title} (Poin ${i + 1})`,
        answer: point,
        difficulty: 2,
        next_review_date: new Date().toISOString().split('T')[0],
        repetition_count: 0,
      });
    }
    confetti({ particleCount: 70, spread: 60 });
    alert(`Berhasil membuat ${Math.min(note.key_points.length, 3)} flashcard dari materi "${note.title}"!`);
  };

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
          value={`${assignments.filter((a) => a.status !== 'completed').length} Tugas Pending`}
          subtitle={`Total ${assignments.length} tugas terdaftar`}
          badgeText="Urgent Track"
          badgeType="neutral"
          icon={<Calendar className="w-5 h-5 text-[#111111]" />}
          actionButton={
            <button
              onClick={() => setActiveSubTab('assignments')}
              className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1"
            >
              Buka Assignment Board →
            </button>
          }
        />
      </section>

      {/* Sub-Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-black/5 overflow-x-auto shadow-xs">
        {[
          { key: 'summarizer', label: 'Note Summarizer' },
          { key: 'flashcards', label: 'Flashcard Spaced Repetition' },
          { key: 'pomodoro', label: 'Pomodoro Focus Timer' },
          { key: 'assignments', label: 'Assignment Tracker' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as any)}
            className={`flex-1 min-w-[150px] sm:min-w-[170px] py-2.5 px-3 sm:px-4 rounded-xl text-xs font-extrabold transition-all text-center ${
              activeSubTab === tab.key
                ? 'bg-[#111111] text-[#E4FF6B] shadow-md shadow-black/10'
                : 'text-[#7F847C] hover:text-[#111111] hover:bg-[#EDEFEB]'
            }`}
          >
            <div>{tab.label}</div>
          </button>
        ))}
      </div>

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
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
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
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />
      )}

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <QuickAddModal
          isOpen={isQuickAddOpen}
          onClose={() => setIsQuickAddOpen(false)}
          defaultTab="note"
        />
      )}
    </div>
  );
}
