'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard } from '@/lib/types';
import { ModalWrapper } from '@/components/ui/ModalWrapper';

interface FlashcardsTabProps {
  flashcards: Flashcard[];
  onReviewFlashcard: (id: string, performance: 'easy' | 'medium' | 'hard') => Promise<void>;
  onUpdateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  onDeleteFlashcard: (id: string) => Promise<void>;
  onOpenQuickAdd: () => void;
}

export const FlashcardsTab: React.FC<FlashcardsTabProps> = ({
  flashcards,
  onReviewFlashcard,
  onUpdateFlashcard,
  onDeleteFlashcard,
  onOpenQuickAdd,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');
  const [flashcardSearchQuery, setFlashcardSearchQuery] = useState('');

  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [editFcSubject, setEditFcSubject] = useState('');
  const [editFcQuestion, setEditFcQuestion] = useState('');
  const [editFcAnswer, setEditFcAnswer] = useState('');

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((fc) => {
      const matchesSubject = selectedSubjectFilter === 'all' || fc.subject.toLowerCase() === selectedSubjectFilter.toLowerCase();
      const q = flashcardSearchQuery.toLowerCase();
      const matchesSearch =
        fc.question.toLowerCase().includes(q) ||
        fc.answer.toLowerCase().includes(q) ||
        fc.subject.toLowerCase().includes(q);
      return matchesSubject && matchesSearch;
    });
  }, [flashcards, selectedSubjectFilter, flashcardSearchQuery]);

  useEffect(() => {
    if (activeCardIndex >= filteredFlashcards.length && filteredFlashcards.length > 0) {
      setActiveCardIndex(filteredFlashcards.length - 1);
    }
  }, [filteredFlashcards.length, activeCardIndex]);

  const currentFlashcard = filteredFlashcards[activeCardIndex];

  const handleRateFlashcard = async (performance: 'easy' | 'medium' | 'hard') => {
    if (currentFlashcard) {
      await onReviewFlashcard(currentFlashcard.id, performance);
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

  const handleNextCard = () => {
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev < filteredFlashcards.length - 1 ? prev + 1 : 0));
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : filteredFlashcards.length - 1));
  };

  const handleOpenEditFlashcard = (fc: Flashcard) => {
    setEditingFlashcard(fc);
    setEditFcSubject(fc.subject);
    setEditFcQuestion(fc.question);
    setEditFcAnswer(fc.answer);
  };

  const handleSaveEditFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlashcard) return;

    await onUpdateFlashcard(editingFlashcard.id, {
      subject: editFcSubject,
      question: editFcQuestion,
      answer: editFcAnswer,
    });

    setEditingFlashcard(null);
  };

  return (
    <section className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Deck Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 card-base p-4">
        <div className="flex items-center gap-2">
          <span className="label-field !mb-0">Subjek:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => {
              setSelectedSubjectFilter(e.target.value);
              setActiveCardIndex(0);
              setIsFlipped(false);
            }}
            className="input-filter"
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
              className="input-filter pl-8 w-36 sm:w-48"
            />
          </div>

          <button onClick={onOpenQuickAdd} className="btn-primary">
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Baru</span>
          </button>
        </div>
      </div>

      {/* Interactive Flashcard Player */}
      {filteredFlashcards.length > 0 && currentFlashcard ? (
        <div className="space-y-4">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`relative min-h-[320px] p-6 sm:p-8 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col justify-between border shadow-xl select-none ${
              isFlipped
                ? 'bg-[#111111] text-white border-black/80'
                : 'bg-white text-[#111111] border-black/10 hover:shadow-2xl'
            }`}
          >
            {/* Card Top Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`badge font-black uppercase ${
                    isFlipped ? 'badge-lime' : 'badge-neutral'
                  }`}
                >
                  {currentFlashcard.subject}
                </span>
                <span className="text-[11px] font-semibold opacity-60">
                  Kartu {activeCardIndex + 1} dari {filteredFlashcards.length}
                </span>
              </div>

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
                  onClick={() => onDeleteFlashcard(currentFlashcard.id)}
                  title="Hapus Flashcard"
                  className="btn-icon-danger p-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card Main Content */}
            <div className="my-auto py-6 text-center">
              <span className="label-field opacity-60 mb-2 block">
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
            <button
              onClick={handlePrevCard}
              className="btn-secondary py-2.5 px-4"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {isFlipped ? (
              <div className="flex-1 flex justify-center gap-2 animate-fade-in flex-wrap">
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

            <button
              onClick={handleNextCard}
              className="btn-primary py-2.5 px-4"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="card-base p-12 text-center">
          <BookOpen className="w-8 h-8 text-[#7F847C] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#111111]">
            {flashcardSearchQuery ? 'Tidak ada flashcard yang cocok dengan pencarian.' : 'Belum ada flashcard di database.'}
          </p>
          <button onClick={onOpenQuickAdd} className="btn-primary mt-4 mx-auto">
            + Buat Flashcard Baru
          </button>
        </div>
      )}

      {/* All Flashcards Deck Table / List */}
      <section className="card-base space-y-4">
        <h3 className="heading-sm">
          Daftar Semua Flashcard ({filteredFlashcards.length})
        </h3>

        <div className="item-list">
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
                    <span className="badge badge-neutral text-[9px]">
                      {fc.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7F847C] truncate mt-0.5">{fc.answer}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEditFlashcard(fc)}
                  className="btn-icon p-1.5"
                  title="Edit Soal"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteFlashcard(fc.id)}
                  className="btn-icon-danger p-1.5"
                  title="Hapus Soal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit Flashcard Modal */}
      <ModalWrapper
        isOpen={!!editingFlashcard}
        onClose={() => setEditingFlashcard(null)}
        title="Edit Flashcard Soal & Jawaban"
        icon={<Edit3 className="w-4 h-4" />}
      >
        <form onSubmit={handleSaveEditFlashcard} className="space-y-4">
          <div>
            <label className="label-field">Mata Kuliah / Subjek</label>
            <input
              type="text"
              required
              value={editFcSubject}
              onChange={(e) => setEditFcSubject(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Pertanyaan (Front Side)</label>
            <input
              type="text"
              required
              value={editFcQuestion}
              onChange={(e) => setEditFcQuestion(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Jawaban / Konsep Kunci (Back Side)</label>
            <textarea
              required
              rows={4}
              value={editFcAnswer}
              onChange={(e) => setEditFcAnswer(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
            <button
              type="button"
              onClick={() => setEditingFlashcard(null)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Simpan Soal
            </button>
          </div>
        </form>
      </ModalWrapper>
    </section>
  );
};
