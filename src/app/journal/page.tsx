'use client';

import React, { useState, useMemo } from 'react';
import {
  BookHeart,
  Sparkles,
  Heart,
  Smile,
  Meh,
  Frown,
  Plus,
  Trash2,
  Calendar,
  Coffee,
  SunMedium,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import confetti from 'canvas-confetti';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { QuickAddModal } from '@/components/ui/QuickAddModal';

const MOOD_OPTIONS = [
  { score: 1, emoji: '😫', label: 'Lelah / Burnout', tag: 'tired', color: '#F43F5E' },
  { score: 2, emoji: '😕', label: 'Kurang Fokus', tag: 'overwhelmed', color: '#FB923C' },
  { score: 3, emoji: '🙂', label: 'Tenang & Santai', tag: 'chill', color: '#FBBF24' },
  { score: 4, emoji: '⚡', label: 'Berenergi & Positif', tag: 'energized', color: '#34D399' },
  { score: 5, emoji: '🔥', label: 'Super Produktif', tag: 'productive', color: '#E4FF6B' },
];

export default function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry, streaks } = useDashboard();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [journalContent, setJournalContent] = useState('');
  const [selectedScore, setSelectedScore] = useState(5);
  const [selectedTag, setSelectedTag] = useState('productive');
  const [customTags, setCustomTags] = useState('coding, ml-study');

  const journalStreak = streaks.find((s) => s.module === 'journal')?.current_streak || 0;

  // Calculate Average Mood Score
  const avgMood = useMemo(() => {
    if (journalEntries.length === 0) return 0;
    const sum = journalEntries.reduce((s, j) => s + j.mood_score, 0);
    return (sum / journalEntries.length).toFixed(1);
  }, [journalEntries]);

  // Mood Trend Chart Data
  const moodChartData = useMemo(() => {
    const sorted = [...journalEntries].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((j) => ({
      date: j.date.slice(5), // MM-DD
      score: j.mood_score,
      tag: j.mood_tag,
    }));
  }, [journalEntries]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent) return;

    await addJournalEntry({
      content: journalContent,
      mood_score: selectedScore,
      mood_tag: selectedTag,
      tags: customTags.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
      date: new Date().toISOString().split('T')[0],
    });

    setJournalContent('');
    confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <TopHeader
        title="Mood & Cozy Journal Space"
        subtitle="Ruang refleksi harian, pemantauan energi belajar, mood tracker, dan mindfulness student."
        badgeText="Mindful Corner"
      />

      {/* Row 1: Stat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          variant="dark"
          title="Mindful Journal Streak"
          value={`${journalStreak} Hari Refleksi`}
          subtitle="Konsistensi mencatat perasaan & energi harian"
          badgeText="Mindful Habit"
          badgeType="lime"
          icon={<Heart className="w-5 h-5 text-rose-400" />}
        />

        <StatCard
          variant="lime"
          title="Rata-rata Skor Mood"
          value={journalEntries.length > 0 ? `${avgMood} / 5.0` : '0.0 / 5.0'}
          subtitle="Berdasarkan histori catatan bulan berjalan"
          badgeText="Energy State"
          badgeType="dark"
          icon={<SunMedium className="w-5 h-5 text-black" />}
        />

        <StatCard
          variant="white"
          title="Total Refleksi Tercatat"
          value={`${journalEntries.length} Entri`}
          subtitle="Dokumentasi perjalanan & pertumbuhan diri"
          badgeText="Memories"
          badgeType="neutral"
          icon={<BookHeart className="w-5 h-5 text-[#111111]" />}
        />
      </section>

      {/* Row 2: Cozy Daily Journaling Form & Mood Trend */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Cozy Journal Editor */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#EDEFEB] text-[#111111]">
                  <Coffee className="w-5 h-5" />
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">Tulis Refleksi Hari Ini</h3>
              </div>
              <span className="text-xs font-semibold text-[#7F847C]">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              {/* Mood Scale selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-2">
                  Bagaimana Mood & Energi Belajarmu?
                </label>
                <div className="grid grid-cols-5 gap-2 bg-[#EDEFEB] p-2 rounded-2xl">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.score}
                      type="button"
                      onClick={() => {
                        setSelectedScore(m.score);
                        setSelectedTag(m.tag);
                      }}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                        selectedScore === m.score
                          ? 'bg-[#111111] text-white scale-105 shadow-xs'
                          : 'opacity-70 hover:opacity-100 hover:bg-black/5'
                      }`}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[9px] font-bold mt-1 text-center truncate w-full">
                        {m.label.split('/')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">
                  Cerita / Refleksi Belajar & Hari Ini
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Apa yang berhasil kamu capai hari ini? Apa tantangan yang kamu hadapi atau hal yang kamu syukuri?"
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7F847C] uppercase mb-1">
                  Tags (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  placeholder="study, coding, college, coffee"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#111111] text-[#E4FF6B] font-extrabold text-xs hover:bg-[#222222] transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simpan Catatan Harian</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (6 cols): Mood Fluctuation Area Graph */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Fluktuasi Mood & Energi</span>
              </h3>
              <span className="text-[11px] text-[#7F847C] font-semibold">Skala 1 - 5</span>
            </div>
            <p className="text-xs text-[#7F847C] mb-4">
              Visualisasi tren kestabilan emosi & energi produktivitas
            </p>

            <div className="h-64 w-full">
              {moodChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodChartData}>
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E4FF6B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#E4FF6B" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" stroke="#7F847C" fontSize={11} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#7F847C" fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => [`Skor: ${val} / 5`, 'Mood Level']}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#111111"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#moodGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#7F847C]">
                  Belum ada catatan mood. Isi refleksi untuk melihat grafik.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between text-xs text-[#7F847C]">
            <span>1 = Lelah / 3 = Tenang / 5 = Super Produktif</span>
            <span className="font-bold text-[#111111]">Daily Tracker</span>
          </div>
        </div>
      </section>

      {/* Row 3: Journal Entries Timeline Feed */}
      <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs space-y-4">
        <h3 className="text-lg font-extrabold text-[#111111]">Timeline Refleksi & Catatan Harian</h3>

        <div className="divide-y divide-black/5">
          {journalEntries.length > 0 ? (
            journalEntries.map((j) => (
              <div
                key={j.id}
                className="py-4 hover:bg-[#EDEFEB]/40 px-3 rounded-2xl transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <span className="text-3xl p-2 rounded-2xl bg-[#EDEFEB] shrink-0">
                    {j.mood_score === 5
                      ? '🔥'
                      : j.mood_score === 4
                      ? '⚡'
                      : j.mood_score === 3
                      ? '🙂'
                      : j.mood_score === 2
                      ? '😕'
                      : '😫'}
                  </span>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-[#111111] capitalize">
                        Mood: {j.mood_tag}
                      </span>
                      <span className="text-[10px] text-[#7F847C]">• {j.date}</span>
                    </div>

                    <p className="text-xs text-[#111111]/85 leading-relaxed mb-2">{j.content}</p>

                    <div className="flex gap-1.5 flex-wrap">
                      {j.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EDEFEB] text-[#7F847C]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteJournalEntry(j.id)}
                  className="p-2 text-[#7F847C] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-[#7F847C]">
              Belum ada refleksi tersimpan. Tulis refleksi pertamamu di atas.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
