'use client';

import React, { useState, useMemo } from 'react';
import { BookOpen, Sparkles, Edit3, Trash2, Search } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Note } from '@/lib/types';
import { ModalWrapper } from '@/components/ui/ModalWrapper';

interface NoteSummarizerTabProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (n: Note | null) => void;
  onAddNote: (note: Omit<Note, 'id' | 'created_at'>) => Promise<Note>;
  onUpdateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onConvertToFlashcards: (note: Note) => Promise<void>;
}

export const NoteSummarizerTab: React.FC<NoteSummarizerTabProps> = ({
  notes,
  selectedNote,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onConvertToFlashcards,
}) => {
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('Machine Learning');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [noteSubjectFilter, setNoteSubjectFilter] = useState('all');

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteSubject, setEditNoteSubject] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');

  const noteSubjects = useMemo(() => {
    return Array.from(new Set(notes.map((n) => n.subject).filter(Boolean)));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    // `q` and the subject key were re-lowercased for every note on every
    // keystroke. Hoisting them makes this a single allocation-free pass, and
    // the unfiltered case now returns the original array so downstream memos
    // keep their identity.
    const q = noteSearchQuery.trim().toLowerCase();
    const subjectKey = noteSubjectFilter.toLowerCase();
    const allSubjects = noteSubjectFilter === 'all';

    if (!q && allSubjects) return notes;

    return notes.filter((n) => {
      if (!allSubjects && n.subject.toLowerCase() !== subjectKey) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        (n.summary?.toLowerCase().includes(q) ?? false) ||
        n.raw_content.toLowerCase().includes(q)
      );
    });
  }, [notes, noteSubjectFilter, noteSearchQuery]);

  const handleCreateAndSummarizeNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteContent) return;

    setIsSummarizing(true);
    setTimeout(async () => {
      const sentences = newNoteContent
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);

      const summary = sentences.slice(0, 2).join(' ') + (sentences.length > 2 ? ' ...' : '');
      const keyPoints = sentences.slice(0, 4).map((s) => s.replace(/[.?!]$/, ''));

      const created = await onAddNote({
        title: newNoteTitle,
        subject: newNoteSubject,
        raw_content: newNoteContent,
        summary,
        key_points: keyPoints,
        tags: [newNoteSubject.toLowerCase().replace(/\s+/g, '-')],
      });

      onSelectNote(created);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsSummarizing(false);
      confetti({ particleCount: 50, spread: 45 });
    }, 300);
  };

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

    await onUpdateNote(editingNote.id, {
      title: editNoteTitle,
      subject: editNoteSubject,
      raw_content: editNoteContent,
      summary,
      key_points: keyPoints,
    });

    if (selectedNote?.id === editingNote.id) {
      onSelectNote({
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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Row: Input Editor & Summary Detail */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Note Editor */}
        <div className="lg:col-span-7 card-base flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#E4FF6B] text-[#111111]">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h3 className="heading-sm">Input Catatan & Auto-Summarizer</h3>
              </div>
              <span className="badge badge-dark">Extractive Engine</span>
            </div>

            <form onSubmit={handleCreateAndSummarizeNote} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Judul Topik / Paper</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gradient Descent & Learning Rates"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    placeholder="Machine Learning, Linear Algebra..."
                    value={newNoteSubject}
                    onChange={(e) => setNewNoteSubject(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-field">Konten Catatan Mentah (Raw Notes)</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste atau ketik materi kuliah di sini. Sistem akan otomatis mengekstrak ringkasan dan poin-poin intinya..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="input-field leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSummarizing}
                className="w-full btn-primary justify-center py-3 text-xs"
              >
                <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-spin' : ''}`} />
                <span>{isSummarizing ? 'Menganalisis & Meringkas...' : 'Simpan & Generate Ringkasan Cerdas'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Note Preview & Key Points Result */}
        <div className="lg:col-span-5 card-base flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="heading-sm">Detail Ringkasan Terpilih</h3>
              {selectedNote && (
                <span className="badge badge-neutral">{selectedNote.subject}</span>
              )}
            </div>

            {selectedNote ? (
              <div className="space-y-4">
                <div className="card-muted">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-extrabold">{selectedNote.title}</h4>
                    <button
                      onClick={() => handleOpenEditNote(selectedNote)}
                      className="btn-icon !p-1"
                      title="Edit Catatan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed italic">
                    "{selectedNote.summary || 'Ringkasan otomatis...'}"
                  </p>
                </div>

                <div>
                  <h5 className="label-field mb-2">Key Takeaway Points:</h5>
                  {selectedNote.key_points && selectedNote.key_points.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedNote.key_points.map((pt, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs p-2.5 rounded-xl surface-chip"
                        >
                          <span className="w-5 h-5 rounded-full bg-[#E4FF6B] text-[#111111] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="section-subtitle italic">Tidak ada poin kunci spesifik.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center section-subtitle">
                Belum ada catatan terpilih. Buat catatan baru di sebelah kiri atau pilih dari daftar riwayat di bawah.
              </div>
            )}
          </div>

          {selectedNote && (
            <div className="mt-6 pt-4 border-t border-subtle flex items-center justify-between gap-2">
              <button
                onClick={() => onConvertToFlashcards(selectedNote)}
                className="flex-1 btn-primary justify-center py-2.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Flashcards</span>
              </button>
              <button
                onClick={() => onDeleteNote(selectedNote.id)}
                className="btn-icon-danger p-2.5"
                title="Hapus Catatan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Recent Summaries */}
      <section className="card-base space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="section-title">Recent Summaries & Catatan Tersimpan</h3>
            <p className="section-subtitle">
              Total {filteredNotes.length} rangkuman materi kuliah tersimpan
            </p>
          </div>

          <div className="filter-bar">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari rangkuman..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                className="input-filter pl-8 w-48 sm:w-60"
              />
            </div>

            <select
              value={noteSubjectFilter}
              onChange={(e) => setNoteSubjectFilter(e.target.value)}
              className="input-filter"
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
                  onClick={() => onSelectNote(n)}
                  className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    isSelected ? 'tile-selected' : 'card-muted tile-selectable'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-black line-clamp-1">{n.title}</h4>
                      <span
                        className={`badge shrink-0 ${
                          isSelected ? 'badge-lime' : 'badge-neutral'
                        }`}
                      >
                        {n.subject}
                      </span>
                    </div>

                    <p
                      className={`text-[11px] line-clamp-3 leading-relaxed mb-3 ${
                        isSelected ? 'opacity-80' : 'text-muted'
                      }`}
                    >
                      {n.summary || n.raw_content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-current/15 flex items-center justify-between text-[10px]">
                    <span className={isSelected ? 'opacity-70' : 'text-muted'}>
                      {n.created_at || 'Baru'}
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onConvertToFlashcards(n)}
                        title="Generate Flashcards"
                        className={`p-1 rounded-md transition-colors ${
                          isSelected ? 'hover:bg-white/20 text-[#E4FF6B]' : 'hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditNote(n)}
                        title="Edit Catatan"
                        className={`p-1 rounded-md transition-colors ${
                          isSelected ? 'hover:bg-white/20' : 'hover:bg-black/10 dark:hover:bg-white/10 text-muted'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(n.id)}
                        title="Hapus Catatan"
                        className="btn-icon-danger p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center section-subtitle">
              {noteSearchQuery || noteSubjectFilter !== 'all'
                ? 'Tidak ada rangkuman yang cocok dengan pencarian.'
                : 'Belum ada rangkuman tersimpan. Masukkan catatan pertama kamu di atas.'}
            </div>
          )}
        </div>
      </section>

      {/* Edit Note Modal */}
      <ModalWrapper
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        title="Edit Catatan & Rangkuman"
        icon={<Edit3 className="w-4 h-4" />}
        size="lg"
      >
        <form onSubmit={handleSaveEditNote} className="space-y-4">
          <div>
            <label className="label-field">Judul Catatan</label>
            <input
              type="text"
              required
              value={editNoteTitle}
              onChange={(e) => setEditNoteTitle(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Mata Kuliah / Subjek</label>
            <input
              type="text"
              required
              value={editNoteSubject}
              onChange={(e) => setEditNoteSubject(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Konten Catatan</label>
            <textarea
              required
              rows={6}
              value={editNoteContent}
              onChange={(e) => setEditNoteContent(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={() => setEditingNote(null)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
};
