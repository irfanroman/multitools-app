'use client';

import React, { useState } from 'react';
import { X, Wallet, GraduationCap, LineChart, BookHeart, Sparkles } from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'finance' | 'note' | 'flashcard' | 'assignment' | 'journal';
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'finance',
}) => {
  const {
    wallets,
    addTransaction,
    addNote,
    addFlashcard,
    addAssignment,
    addJournalEntry,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<'finance' | 'note' | 'flashcard' | 'assignment' | 'journal'>(
    defaultTab
  );

  // Finance form state
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('makan');
  const [txPaymentMethod, setTxPaymentMethod] = useState(wallets[0]?.name || 'Bank Jago');
  const [txNotes, setTxNotes] = useState('');

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('Machine Learning');
  const [noteContent, setNoteContent] = useState('');

  // Flashcard form state
  const [fcQuestion, setFcQuestion] = useState('');
  const [fcAnswer, setFcAnswer] = useState('');
  const [fcSubject, setFcSubject] = useState('Machine Learning');

  // Assignment form state
  const [assTitle, setAssTitle] = useState('');
  const [assSubject, setAssSubject] = useState('Data Mining');
  const [assDueDate, setAssDueDate] = useState('');
  const [assPriority, setAssPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Journal form state
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState(5);
  const [journalMoodTag, setJournalMoodTag] = useState('productive');

  if (!isOpen) return null;

  const handleFinanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle || !txAmount) return;
    await addTransaction({
      title: txTitle,
      amount: parseFloat(txAmount),
      type: txType,
      category: txType === 'income' ? (txCategory || 'gaji/freelance') : txCategory,
      payment_method: txPaymentMethod,
      date: new Date().toISOString().split('T')[0],
      notes: txNotes || undefined,
    });
    onClose();
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteContent) return;

    // Extractive summary generator
    const sentences = noteContent.split('. ').filter((s) => s.trim().length > 0);
    const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
    const keyPoints = sentences.slice(0, 4).map((s) => s.replace(/\.$/, ''));

    await addNote({
      title: noteTitle,
      subject: noteSubject,
      raw_content: noteContent,
      summary,
      key_points: keyPoints,
      tags: [noteSubject.toLowerCase().replace(/\s+/g, '-')],
    });
    onClose();
  };

  const handleFlashcardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcQuestion || !fcAnswer) return;
    await addFlashcard({
      question: fcQuestion,
      answer: fcAnswer,
      subject: fcSubject,
      difficulty: 1,
      next_review_date: new Date().toISOString().split('T')[0],
      repetition_count: 0,
    });
    onClose();
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assTitle || !assDueDate) return;
    await addAssignment({
      title: assTitle,
      subject: assSubject,
      due_date: new Date(assDueDate).toISOString(),
      status: 'pending',
      priority: assPriority,
    });
    onClose();
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent) return;
    await addJournalEntry({
      content: journalContent,
      mood_score: journalMood,
      mood_tag: journalMoodTag,
      tags: [journalMoodTag],
      date: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#E4FF6B] text-[#111111]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-[#111111]">Quick Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#EDEFEB] text-[#7F847C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-1.5 p-1 bg-[#EDEFEB] rounded-2xl my-4 overflow-x-auto">
          {[
            { key: 'finance', label: 'Transaksi', icon: Wallet },
            { key: 'note', label: 'Catatan', icon: GraduationCap },
            { key: 'flashcard', label: 'Flashcard', icon: Sparkles },
            { key: 'assignment', label: 'Tugas', icon: GraduationCap },
            { key: 'journal', label: 'Journal', icon: BookHeart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isTabActive
                    ? 'bg-[#111111] text-[#E4FF6B] shadow-xs'
                    : 'text-[#7F847C] hover:text-[#111111]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Finance Form */}
        {activeTab === 'finance' && (
          <form onSubmit={handleFinanceSubmit} className="space-y-4">
            {/* Income vs Expense Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#EDEFEB] rounded-2xl">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  txType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-[#7F847C] hover:text-[#111111]'
                }`}
              >
                Pengeluaran (Expense)
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  txType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[#7F847C] hover:text-[#111111]'
                }`}
              >
                Pemasukan (Income)
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Deskripsi Transaksi</label>
              <input
                type="text"
                required
                placeholder="Contoh: Belanja Bulanan, Freelance project"
                value={txTitle}
                onChange={(e) => setTxTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="50000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Metode Pembayaran</label>
                <select
                  value={txPaymentMethod}
                  onChange={(e) => setTxPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {txType === 'expense' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Kategori</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  >
                    <option value="makan">🍜 Makanan & Minuman</option>
                    <option value="kos">🏠 Sewa Kos / Tempat</option>
                    <option value="transport">🛵 Transportasi</option>
                    <option value="kuliah">🎓 Kuliah & Tools DS</option>
                    <option value="hiburan">☕ Hiburan & Nongkrong</option>
                    <option value="belanja">🛍️ Belanja</option>
                    <option value="lainnya">📦 Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Catatan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Catatan tambahan"
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Catatan / Sumber (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Gaji freelance, transfer orang tua, beasiswa"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#111111] text-[#E4FF6B] font-extrabold text-sm hover:bg-[#222222] transition-colors shadow-md"
            >
              Simpan Transaksi
            </button>
          </form>
        )}

        {/* Tab 2: Note Form with Auto-Summarizer */}
        {activeTab === 'note' && (
          <form onSubmit={handleNoteSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Judul Materi / Paper</label>
              <input
                type="text"
                required
                placeholder="Contoh: Gradient Boosting & CatBoost"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Mata Kuliah / Subjek</label>
              <input
                type="text"
                required
                placeholder="Machine Learning, Linear Algebra, dll"
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">
                Konten Catatan Mentah (Akan diringkas otomatis)
              </label>
              <textarea
                required
                rows={4}
                placeholder="Tulis atau paste catatan kuliah di sini..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#111111] text-[#E4FF6B] font-extrabold text-sm hover:bg-[#222222] transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simpan & Auto-Summarize</span>
            </button>
          </form>
        )}

        {/* Tab 3: Flashcard Form */}
        {activeTab === 'flashcard' && (
          <form onSubmit={handleFlashcardSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Subjek / Topik</label>
              <input
                type="text"
                required
                placeholder="Machine Learning / Statistik"
                value={fcSubject}
                onChange={(e) => setFcSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Pertanyaan (Front)</label>
              <input
                type="text"
                required
                placeholder="Apa perbedaan L1 vs L2 Regularization?"
                value={fcQuestion}
                onChange={(e) => setFcQuestion(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Jawaban (Back)</label>
              <textarea
                required
                rows={3}
                placeholder="L1 (Lasso) menghasilkan sparse weights..."
                value={fcAnswer}
                onChange={(e) => setFcAnswer(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#111111] text-[#E4FF6B] font-extrabold text-sm hover:bg-[#222222] transition-colors shadow-md"
            >
              Tambah Flashcard
            </button>
          </form>
        )}

        {/* Tab 4: Assignment Form */}
        {activeTab === 'assignment' && (
          <form onSubmit={handleAssignmentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Judul Tugas / Deadline</label>
              <input
                type="text"
                required
                placeholder="Tugas Praktikum Deep Learning"
                value={assTitle}
                onChange={(e) => setAssTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Mata Kuliah</label>
                <input
                  type="text"
                  required
                  placeholder="Data Mining"
                  value={assSubject}
                  onChange={(e) => setAssSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Prioritas</label>
                <select
                  value={assPriority}
                  onChange={(e) => setAssPriority(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                >
                  <option value="low">Rendah (Low)</option>
                  <option value="medium">Sedang (Medium)</option>
                  <option value="high">Tinggi (High / Urgent)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Tenggat Waktu (Due Date)</label>
              <input
                type="datetime-local"
                required
                value={assDueDate}
                onChange={(e) => setAssDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#111111] text-[#E4FF6B] font-extrabold text-sm hover:bg-[#222222] transition-colors shadow-md"
            >
              Simpan Tugas
            </button>
          </form>
        )}

        {/* Tab 5: Journal Form */}
        {activeTab === 'journal' && (
          <form onSubmit={handleJournalSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-2 uppercase">
                Bagaimana Mood & Energi Hari Ini?
              </label>
              <div className="flex justify-between items-center bg-[#EDEFEB] p-2 rounded-2xl">
                {[
                  { score: 1, emoji: '😫', label: 'Lelah' },
                  { score: 2, emoji: '😕', label: 'Biasa' },
                  { score: 3, emoji: '🙂', label: 'Tenang' },
                  { score: 4, emoji: '⚡', label: 'Semangat' },
                  { score: 5, emoji: '🔥', label: 'Produktif' },
                ].map((m) => (
                  <button
                    key={m.score}
                    type="button"
                    onClick={() => setJournalMood(m.score)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                      journalMood === m.score
                        ? 'bg-[#111111] text-white scale-110 shadow-sm'
                        : 'text-2xl hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[10px] font-semibold mt-1">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Mood Tag</label>
              <select
                value={journalMoodTag}
                onChange={(e) => setJournalMoodTag(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              >
                <option value="productive">🔥 Sangat Produktif</option>
                <option value="energized">⚡ Berenergi</option>
                <option value="chill">🌿 Santai & Cozy</option>
                <option value="tired">😴 Lelah / Butuh Istirahat</option>
                <option value="overwhelmed">🤯 Overwhelmed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Refleksi Hari Ini</label>
              <textarea
                required
                rows={3}
                placeholder="Tuliskan apa yang kamu pelajari atau rasakan hari ini..."
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#111111] text-[#E4FF6B] font-extrabold text-sm hover:bg-[#222222] transition-colors shadow-md"
            >
              Simpan Journal Entry
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
