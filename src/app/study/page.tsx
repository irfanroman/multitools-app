'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Flame,
  ArrowRight,
  Check,
  Search,
  Edit3,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { QuickAddModal } from '@/components/ui/QuickAddModal';
import { Note, Flashcard } from '@/lib/types';

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
    addAssignment,
    toggleAssignment,
    deleteAssignment,
    logStudySession,
    streaks,
  } = useDashboard();

  const [activeSubTab, setActiveSubTab] = useState<'summarizer' | 'flashcards' | 'pomodoro' | 'assignments'>('summarizer');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Note Summarizer state
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0] || null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('Machine Learning');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Note search & filter
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteSubjectFilter, setNoteSubjectFilter] = useState('all');

  // Flashcards state
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [flashcardSearchQuery, setFlashcardSearchQuery] = useState('');

  // Flashcard Edit Modal state
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [editFcSubject, setEditFcSubject] = useState('');
  const [editFcQuestion, setEditFcQuestion] = useState('');
  const [editFcAnswer, setEditFcAnswer] = useState('');

  // Note Edit Modal state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteSubject, setEditNoteSubject] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');

  // Pomodoro timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState('Machine Learning');
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');

  // Study streak
  const studyStreak = streaks.find((s) => s.module === 'study')?.current_streak || 0;

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSubject = noteSubjectFilter === 'all' || n.subject.toLowerCase() === noteSubjectFilter.toLowerCase();
      const matchesSearch =
        n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        n.subject.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
        (n.summary && n.summary.toLowerCase().includes(noteSearchQuery.toLowerCase())) ||
        n.raw_content.toLowerCase().includes(noteSearchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [notes, noteSubjectFilter, noteSearchQuery]);

  // Unique subjects for notes
  const noteSubjects = useMemo(() => {
    return Array.from(new Set(notes.map((n) => n.subject).filter(Boolean)));
  }, [notes]);

  // Filtered flashcards
  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((fc) => {
      const matchesSubject = selectedSubjectFilter === 'all' || fc.subject.toLowerCase() === selectedSubjectFilter.toLowerCase();
      const matchesSearch =
        fc.question.toLowerCase().includes(flashcardSearchQuery.toLowerCase()) ||
        fc.answer.toLowerCase().includes(flashcardSearchQuery.toLowerCase()) ||
        fc.subject.toLowerCase().includes(flashcardSearchQuery.toLowerCase());
      return matchesSubject && matchesSearch;
    });
  }, [flashcards, selectedSubjectFilter, flashcardSearchQuery]);

  // Ensure activeCardIndex is in bounds
  useEffect(() => {
    if (activeCardIndex >= filteredFlashcards.length && filteredFlashcards.length > 0) {
      setActiveCardIndex(filteredFlashcards.length - 1);
    }
  }, [filteredFlashcards.length, activeCardIndex]);

  // Pomodoro effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      if (timerMode === 'work') {
        logStudySession({
          subject: timerSubject,
          duration_minutes: 25,
          date: new Date().toISOString().split('T')[0],
          notes: 'Pomodoro focus session completed',
        });
        alert('Sesi Pomodoro 25 Menit Selesai! Waktunya istirahat sejenak.');
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        alert('Istirahat selesai! Siap untuk sesi belajar berikutnya?');
        setTimerMode('work');
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode, timerSubject, logStudySession]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Generate Smart Summary & Key Points
  const handleCreateAndSummarizeNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteContent) return;

    setIsSummarizing(true);

    // AI smart extractive logic
    setTimeout(async () => {
      const sentences = newNoteContent
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);

      const summary =
        sentences.slice(0, 2).join(' ') + (sentences.length > 2 ? ' ...' : '');
      const keyPoints = sentences.slice(0, 4).map((s) => s.replace(/[.?!]$/, ''));

      const created = await addNote({
        title: newNoteTitle,
        subject: newNoteSubject,
        raw_content: newNoteContent,
        summary,
        key_points: keyPoints,
        tags: [newNoteSubject.toLowerCase().replace(/\s+/g, '-')],
      });

      setSelectedNote(created);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsSummarizing(false);
      confetti({ particleCount: 50, spread: 45 });
    }, 300);
  };

  // Convert Note key points to Flashcard
  const handleConvertNoteToFlashcards = async (note: Note) => {
    if (!note.key_points || note.key_points.length === 0) {
      // If no key points, create 1 flashcard from summary or title
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

  // Flashcard rating & spaced repetition update
  const handleRateFlashcard = async (performance: 'easy' | 'medium' | 'hard') => {
    const currentCard = filteredFlashcards[activeCardIndex];
    if (currentCard) {
      await reviewFlashcard(currentCard.id, performance);
    }
    setIsFlipped(false);
    if (activeCardIndex < filteredFlashcards.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
    } else {
      confetti({ particleCount: 100, spread: 70 });
      alert('Hebat! Kamu telah menyelesaikan semua flashcard di deck ini!');
      setActiveCardIndex(0);
    }
  };

  // Flashcard Navigation
  const handleNextCard = () => {
    setIsFlipped(false);
    if (activeCardIndex < filteredFlashcards.length - 1) {
      setActiveCardIndex((prev) => prev + 1);
    } else {
      setActiveCardIndex(0);
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (activeCardIndex > 0) {
      setActiveCardIndex((prev) => prev - 1);
    } else {
      setActiveCardIndex(filteredFlashcards.length - 1);
    }
  };

  // Edit Note
  const handleOpenEditNote = (note: Note) => {
    setEditingNote(note);
    setEditNoteTitle(note.title);
    setEditNoteSubject(note.subject);
    setEditNoteContent(note.raw_content);
  };

  const handleSaveEditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;

    const sentences = editNoteContent
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    const summary = sentences.slice(0, 2).join(' ') + (sentences.length > 2 ? ' ...' : '');
    const keyPoints = sentences.slice(0, 4).map((s) => s.replace(/[.?!]$/, ''));

    await updateNote(editingNote.id, {
      title: editNoteTitle,
      subject: editNoteSubject,
      raw_content: editNoteContent,
      summary,
      key_points: keyPoints,
    });

    if (selectedNote?.id === editingNote.id) {
      setSelectedNote({
        ...selectedNote,
        title: editNoteTitle,
        subject: editNoteSubject,
        raw_content: editNoteContent,
        summary,
        key_points: keyPoints,
      });
    }

    setEditingNote(null);
  };

  // Edit Flashcard
  const handleOpenEditFlashcard = (fc: Flashcard) => {
    setEditingFlashcard(fc);
    setEditFcSubject(fc.subject);
    setEditFcQuestion(fc.question);
    setEditFcAnswer(fc.answer);
  };

  const handleSaveEditFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlashcard) return;

    await updateFlashcard(editingFlashcard.id, {
      subject: editFcSubject,
      question: editFcQuestion,
      answer: editFcAnswer,
    });

    setEditingFlashcard(null);
  };

  const currentFlashcard = filteredFlashcards[activeCardIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <TopHeader
        title="Study Tools & Learning Hub"
        subtitle="Note Summarizer, flashcard spaced repetition, timer fokus, & manajemen tugas kuliah."
        badgeText="Study Engine"
      />

      {/* Row 1: Stat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all text-center ${
              activeSubTab === tab.key
                ? 'bg-[#111111] text-[#E4FF6B] shadow-md shadow-black/10'
                : 'text-[#7F847C] hover:text-[#111111] hover:bg-[#EDEFEB]'
            }`}
          >
            <div>{tab.label}</div>
          </button>
        ))}
      </div>

      {/* SUBTAB 1: NOTE SUMMARIZER */}
      {activeSubTab === 'summarizer' && (
        <div className="space-y-8">
          {/* Top Row: Input Editor & Summary Detail */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Note Editor & Auto Summarizer (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-2xl bg-[#E4FF6B] text-[#111111]">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-extrabold text-[#111111]">
                      Input Catatan & Auto-Summarizer
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#111111] text-[#E4FF6B]">
                    Extractive Engine
                  </span>
                </div>

                <form onSubmit={handleCreateAndSummarizeNote} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">
                        Judul Topik / Paper
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Gradient Descent & Learning Rates"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">
                        Mata Kuliah
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Machine Learning, Linear Algebra..."
                        value={newNoteSubject}
                        onChange={(e) => setNewNoteSubject(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">
                      Konten Catatan Mentah (Raw Notes)
                    </label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Paste atau ketik materi kuliah di sini. Sistem akan otomatis mengekstrak ringkasan dan poin-poin intinya..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#111111]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSummarizing}
                    className="w-full py-3 rounded-2xl bg-[#111111] text-[#E4FF6B] font-extrabold text-xs hover:bg-[#222222] transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-spin' : ''}`} />
                    <span>{isSummarizing ? 'Menganalisis & Meringkas...' : 'Simpan & Generate Ringkasan Cerdas'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Note Preview & Key Points Result (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-[#111111]">Detail Ringkasan Terpilih</h3>
                  {selectedNote && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDEFEB] text-[#111111]">
                      {selectedNote.subject}
                    </span>
                  )}
                </div>

                {selectedNote ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#EDEFEB]/60 border border-black/5">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-extrabold text-[#111111]">{selectedNote.title}</h4>
                        <button
                          onClick={() => handleOpenEditNote(selectedNote)}
                          className="p-1 text-[#7F847C] hover:text-[#111111] transition-colors"
                          title="Edit Catatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-[#111111]/80 leading-relaxed italic">
                        "{selectedNote.summary || 'Ringkasan otomatis...'}"
                      </p>
                    </div>

                    <div>
                      <h5 className="text-xs font-extrabold text-[#7F847C] uppercase tracking-wider mb-2">
                        Key Takeaway Points:
                      </h5>
                      {selectedNote.key_points && selectedNote.key_points.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedNote.key_points.map((pt, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-[#111111] p-2.5 rounded-xl bg-white border border-black/5 shadow-2xs"
                            >
                              <span className="w-5 h-5 rounded-full bg-[#E4FF6B] text-[#111111] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-snug">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-[#7F847C] italic">Tidak ada poin kunci spesifik.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#7F847C]">
                    Belum ada catatan terpilih. Buat catatan baru di sebelah kiri atau pilih dari daftar riwayat di bawah.
                  </div>
                )}
              </div>

              {selectedNote && (
                <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleConvertNoteToFlashcards(selectedNote)}
                    className="flex-1 py-2.5 rounded-xl bg-[#111111] text-[#E4FF6B] font-bold text-xs hover:bg-[#222222] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Flashcards</span>
                  </button>
                  <button
                    onClick={() => deleteNote(selectedNote.id)}
                    className="p-2.5 rounded-xl text-[#7F847C] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Recent Summaries & Search Filter (Live Supabase Connected) */}
          <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#111111]">Recent Summaries & Catatan Tersimpan</h3>
                <p className="text-xs text-[#7F847C]">
                  Total {filteredNotes.length} rangkuman materi kuliah tersimpan di database
                </p>
              </div>

              {/* Search & Subject Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#7F847C] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari rangkuman..."
                    value={noteSearchQuery}
                    onChange={(e) => setNoteSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-full bg-[#EDEFEB] text-xs border border-black/5 focus:outline-none focus:ring-1 focus:ring-[#111111] w-48 sm:w-60"
                  />
                </div>

                {/* Subject Filter */}
                <select
                  value={noteSubjectFilter}
                  onChange={(e) => setNoteSubjectFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-full bg-[#EDEFEB] text-xs font-semibold border border-black/5 focus:outline-none"
                >
                  <option value="all">Semua Subjek</option>
                  {noteSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summaries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((n) => {
                  const isSelected = selectedNote?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNote(n)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#111111] text-white border-black shadow-md'
                          : 'bg-[#EDEFEB]/50 text-[#111111] border-black/5 hover:border-black/20 hover:bg-[#EDEFEB]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-xs font-black line-clamp-1">{n.title}</h4>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isSelected ? 'bg-[#E4FF6B] text-[#111111]' : 'bg-white text-[#111111]'
                            }`}
                          >
                            {n.subject}
                          </span>
                        </div>

                        <p
                          className={`text-[11px] line-clamp-3 leading-relaxed mb-3 ${
                            isSelected ? 'text-white/80' : 'text-[#7F847C]'
                          }`}
                        >
                          {n.summary || n.raw_content}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[10px]">
                        <span className={isSelected ? 'text-white/60' : 'text-[#7F847C]'}>
                          {n.created_at || 'Baru'}
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleConvertNoteToFlashcards(n)}
                            title="Generate Flashcards"
                            className={`p-1 rounded-md transition-colors ${
                              isSelected
                                ? 'hover:bg-white/20 text-[#E4FF6B]'
                                : 'hover:bg-black/10 text-[#111111]'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditNote(n)}
                            title="Edit Catatan"
                            className={`p-1 rounded-md transition-colors ${
                              isSelected
                                ? 'hover:bg-white/20 text-white'
                                : 'hover:bg-black/10 text-[#7F847C]'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteNote(n.id)}
                            title="Hapus Catatan"
                            className="p-1 rounded-md hover:bg-rose-500/20 text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center text-xs text-[#7F847C]">
                  {noteSearchQuery || noteSubjectFilter !== 'all'
                    ? 'Tidak ada rangkuman yang cocok dengan pencarian.'
                    : 'Belum ada rangkuman tersimpan. Masukkan catatan pertama kamu di atas.'}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* SUBTAB 2: FLASHCARD SPACED REPETITION PLAYER & DECK MANAGER */}
      {activeSubTab === 'flashcards' && (
        <section className="space-y-8 max-w-4xl mx-auto">
          {/* Deck Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-black/5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#7F847C]">Subjek:</span>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => {
                  setSelectedSubjectFilter(e.target.value);
                  setActiveCardIndex(0);
                  setIsFlipped(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#EDEFEB] text-xs font-bold border border-black/5"
              >
                <option value="all">Semua Subjek ({flashcards.length})</option>
                {Array.from(new Set(flashcards.map((f) => f.subject))).map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7F847C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari soal..."
                  value={flashcardSearchQuery}
                  onChange={(e) => {
                    setFlashcardSearchQuery(e.target.value);
                    setActiveCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-full bg-[#EDEFEB] text-xs border border-black/5 focus:outline-none w-36 sm:w-48"
                />
              </div>

              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-extrabold hover:bg-[#222222] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Baru</span>
              </button>
            </div>
          </div>

          {/* Interactive Flashcard Player with Next/Back Navigation & Actions */}
          {filteredFlashcards.length > 0 && currentFlashcard ? (
            <div className="space-y-4">
              {/* Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative min-h-[320px] p-8 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between border shadow-xl select-none ${
                  isFlipped
                    ? 'bg-[#111111] text-white border-black/80'
                    : 'bg-white text-[#111111] border-black/10 hover:shadow-2xl'
                }`}
              >
                {/* Card Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        isFlipped ? 'bg-[#E4FF6B] text-[#111111]' : 'bg-[#EDEFEB] text-[#7F847C]'
                      }`}
                    >
                      {currentFlashcard.subject}
                    </span>
                    <span className="text-[11px] font-semibold opacity-60">
                      Kartu {activeCardIndex + 1} dari {filteredFlashcards.length}
                    </span>
                  </div>

                  {/* Actions on Card: Edit & Delete */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditFlashcard(currentFlashcard)}
                      title="Edit Flashcard"
                      className={`p-1.5 rounded-xl transition-colors ${
                        isFlipped ? 'hover:bg-white/20 text-white' : 'hover:bg-black/10 text-[#7F847C]'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFlashcard(currentFlashcard.id)}
                      title="Hapus Flashcard"
                      className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Main Content */}
                <div className="my-auto py-6 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-2 block">
                    {isFlipped ? 'Jawaban / Penjelasan' : 'Pertanyaan (Front Side)'}
                  </span>
                  <h3
                    className={`text-lg sm:text-xl font-extrabold leading-relaxed ${
                      isFlipped ? 'text-white' : 'text-[#111111]'
                    }`}
                  >
                    {isFlipped ? currentFlashcard.answer : currentFlashcard.question}
                  </h3>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-xs opacity-50 font-medium">
                  <span>Klik kartu untuk membalik</span>
                  <span>Repetisi: {currentFlashcard.repetition_count || 0}x</span>
                </div>
              </div>

              {/* Navigation Back & Next Buttons + Spaced Repetition Rating */}
              <div className="flex items-center justify-between gap-3">
                {/* Back Button */}
                <button
                  onClick={handlePrevCard}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-white border border-black/10 text-xs font-extrabold text-[#111111] hover:bg-[#EDEFEB] transition-all shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                {/* Spaced Repetition Confidence Buttons (Shown when flipped) */}
                {isFlipped ? (
                  <div className="flex-1 flex justify-center gap-2 animate-in fade-in">
                    <button
                      onClick={() => handleRateFlashcard('hard')}
                      className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
                    >
                      Susah (1 Hari)
                    </button>
                    <button
                      onClick={() => handleRateFlashcard('medium')}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#111111] font-extrabold text-xs shadow-md transition-all active:scale-95"
                    >
                      Sedang (2 Hari)
                    </button>
                    <button
                      onClick={() => handleRateFlashcard('easy')}
                      className="px-3.5 py-2 rounded-xl bg-[#E4FF6B] hover:bg-[#d2f347] text-[#111111] font-extrabold text-xs shadow-md transition-all active:scale-95"
                    >
                      Mudah (4 Hari)
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-[#7F847C] font-semibold text-center hidden sm:block">
                    Balik kartu untuk memberi rating pemahaman
                  </div>
                )}

                {/* Next Button */}
                <button
                  onClick={handleNextCard}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold hover:bg-[#222222] transition-all shadow-xs"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl text-center border border-black/5 shadow-xs">
              <BookOpen className="w-8 h-8 text-[#7F847C] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#111111]">
                {flashcardSearchQuery ? 'Tidak ada flashcard yang cocok dengan pencarian.' : 'Belum ada flashcard di database.'}
              </p>
              <button
                onClick={() => setIsQuickAddOpen(true)}
                className="mt-4 px-4 py-2 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-bold"
              >
                + Buat Flashcard Baru
              </button>
            </div>
          )}

          {/* All Flashcards Deck Table / List */}
          <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-[#111111]">
              Daftar Semua Flashcard ({filteredFlashcards.length})
            </h3>

            <div className="divide-y divide-black/5">
              {filteredFlashcards.map((fc, idx) => (
                <div
                  key={fc.id}
                  className={`py-3.5 px-3 rounded-2xl flex items-center justify-between gap-3 hover:bg-[#EDEFEB]/40 transition-colors ${
                    activeCardIndex === idx ? 'bg-[#EDEFEB]/60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setActiveCardIndex(idx)}>
                    <span className="w-6 h-6 rounded-full bg-[#EDEFEB] text-[#111111] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111111] truncate">{fc.question}</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#EDEFEB] text-[#7F847C]">
                          {fc.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7F847C] truncate mt-0.5">{fc.answer}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditFlashcard(fc)}
                      className="p-1.5 text-[#7F847C] hover:text-[#111111] hover:bg-[#EDEFEB] rounded-xl transition-colors"
                      title="Edit Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteFlashcard(fc.id)}
                      className="p-1.5 text-[#7F847C] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      )}

      {/* SUBTAB 3: POMODORO FOCUS TIMER */}
      {activeSubTab === 'pomodoro' && (
        <section className="max-w-md mx-auto bg-[#111111] text-white rounded-3xl p-8 border border-black/20 shadow-2xl text-center space-y-6">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-2xl bg-white/10 text-[#E4FF6B]">
              <Clock className="w-5 h-5" />
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                timerMode === 'work' ? 'bg-[#E4FF6B] text-[#111111]' : 'bg-emerald-400 text-[#111111]'
              }`}
            >
              {timerMode === 'work' ? 'Focus Sprint (25m)' : 'Break (5m)'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/50 uppercase mb-2">
              Subjek Belajar Saat Ini:
            </label>
            <select
              value={timerSubject}
              onChange={(e) => setTimerSubject(e.target.value)}
              className="px-4 py-2 rounded-2xl bg-white/10 text-white font-bold text-xs border border-white/10 focus:outline-none"
            >
              <option value="Machine Learning" className="bg-[#111111]">Machine Learning</option>
              <option value="Linear Algebra" className="bg-[#111111]">Linear Algebra</option>
              <option value="Data Mining & EDA" className="bg-[#111111]">Data Mining & EDA</option>
              <option value="Deep Learning & PyTorch" className="bg-[#111111]">Deep Learning & PyTorch</option>
            </select>
          </div>

          {/* Big Digital Timer Display */}
          <div className="py-4">
            <div className="text-6xl sm:text-7xl font-black tracking-tighter text-[#E4FF6B] font-mono">
              {formatTime(timerSeconds)}
            </div>
            <p className="text-xs text-white/60 mt-2">
              {isTimerRunning ? 'Fokus berjalan... Tetap semangat!' : 'Tekan tombol play untuk mulai'}
            </p>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="w-14 h-14 rounded-full bg-[#E4FF6B] text-[#111111] flex items-center justify-center font-black shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95 transition-transform"
            >
              {isTimerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(timerMode === 'work' ? 25 * 60 : 5 * 60);
              }}
              title="Reset Timer"
              className="p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Recent study logs */}
          <div className="pt-4 border-t border-white/10 text-left">
            <span className="text-[11px] font-bold text-white/60 uppercase">Riwayat Sesi Terakhir:</span>
            <div className="space-y-1.5 mt-2">
              {studySessions.length > 0 ? (
                studySessions.slice(0, 2).map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center text-xs p-2 rounded-xl bg-white/5 text-white/80"
                  >
                    <span className="font-semibold">{s.subject}</span>
                    <span className="text-white/50">{s.duration_minutes} menit • {s.date}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/40">Belum ada riwayat sesi hari ini.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SUBTAB 4: ASSIGNMENTS TRACKER */}
      {activeSubTab === 'assignments' && (
        <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111]">Daftar Tugas & Deadline Kuliah</h3>
              <p className="text-xs text-[#7F847C]">Pantau progress tugas dan tenggat waktu mata kuliah</p>
            </div>
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-bold hover:bg-[#222222] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tugas</span>
            </button>
          </div>

          <div className="divide-y divide-black/5">
            {assignments.length > 0 ? (
              assignments.map((a) => (
                <div
                  key={a.id}
                  className="py-4 flex items-center justify-between hover:bg-[#EDEFEB]/30 px-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAssignment(a.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        a.status === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : 'border-2 border-black/20 hover:border-black'
                      }`}
                    >
                      {a.status === 'completed' && <Check className="w-4 h-4" />}
                    </button>

                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          a.status === 'completed' ? 'line-through text-[#7F847C]' : 'text-[#111111]'
                        }`}
                      >
                        {a.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#7F847C] mt-0.5">
                        <span className="font-semibold text-[#111111]">{a.subject}</span>
                        <span>•</span>
                        <span>Due: {new Date(a.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        a.priority === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : a.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {a.priority.toUpperCase()}
                    </span>

                    <button
                      onClick={() => deleteAssignment(a.id)}
                      className="p-2 text-[#7F847C] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#7F847C]">
                Belum ada tugas tercatat. Klik tombol Tambah Tugas di atas.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <h3 className="text-base font-extrabold text-[#111111]">Edit Catatan & Rangkuman</h3>
              <button onClick={() => setEditingNote(null)} className="p-1 rounded-full hover:bg-[#EDEFEB]">
                <X className="w-4 h-4 text-[#7F847C]" />
              </button>
            </div>
            <form onSubmit={handleSaveEditNote} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">Judul</label>
                <input
                  type="text"
                  required
                  value={editNoteTitle}
                  onChange={(e) => setEditNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">Mata Kuliah</label>
                <input
                  type="text"
                  required
                  value={editNoteSubject}
                  onChange={(e) => setEditNoteSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">Konten Catatan</label>
                <textarea
                  required
                  rows={5}
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Flashcard Modal */}
      {editingFlashcard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <h3 className="text-base font-extrabold text-[#111111]">Edit Flashcard</h3>
              <button onClick={() => setEditingFlashcard(null)} className="p-1 rounded-full hover:bg-[#EDEFEB]">
                <X className="w-4 h-4 text-[#7F847C]" />
              </button>
            </div>
            <form onSubmit={handleSaveEditFlashcard} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">Subjek</label>
                <input
                  type="text"
                  required
                  value={editFcSubject}
                  onChange={(e) => setEditFcSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">Pertanyaan (Front)</label>
                <input
                  type="text"
                  required
                  value={editFcQuestion}
                  onChange={(e) => setEditFcQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">Jawaban (Back)</label>
                <textarea
                  required
                  rows={4}
                  value={editFcAnswer}
                  onChange={(e) => setEditFcAnswer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFlashcard(null)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold"
                >
                  Simpan Soal
                </button>
              </div>
            </form>
          </div>
        </div>
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
