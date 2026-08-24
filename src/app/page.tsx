'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  GraduationCap,
  LineChart,
  BookHeart,
  TrendingUp,
  ArrowRight,
  Clock,
  Play,
  Plus,
  X,
  Sliders,
} from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CapsuleProgress } from '@/components/ui/CapsuleProgress';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function OverviewPage() {
  const {
    wallets,
    categories,
    transactions,
    budgets,
    updateBudget,
    streaks,
    assignments,
    flashcards,
    experiments,
    journalEntries,
  } = useDashboard();

  // Budget Modal state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('makan');
  const [editLimit, setEditLimit] = useState('2000000');

  // Calculations
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const totalExpenseThisMonth = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncomeThisMonth = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => {
    const spentForCat = currentMonthTransactions
      .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((s, t) => s + t.amount, 0);
    return sum + (b.spent || spentForCat);
  }, 0);

  const pendingAssignments = assignments.filter((a) => a.status !== 'completed');
  const flashcardsDueToday = flashcards.length;
  const latestExperiment = experiments[0];
  const todayJournal = journalEntries[0];
  const overallStreak = streaks.find((s) => s.module === 'overall')?.current_streak || 0;

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLimit) return;
    await updateBudget(editCategory, parseFloat(editLimit));
    setIsBudgetModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <TopHeader
        title="Dashboard Overview"
        subtitle="Satu tempat untuk mengatur finansial, belajar data science, eksperimen model, & daily mood."
        badgeText="Active Workspace"
      />

      {/* Row 1: Hero Contrast Stat Cards (Dark, Lime, White) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Saldo (Dark Surface #111111) */}
        <StatCard
          variant="dark"
          title="Total Saldo Kas"
          value={`Rp ${totalBalance.toLocaleString('id-ID')}`}
          subtitle={`Tersebar di ${wallets.length} rekening/e-wallet (Jago, BCA, GoPay)`}
          badgeText="Active Net Worth"
          badgeType="lime"
          icon={<Wallet className="w-5 h-5" />}
          actionButton={
            <Link
              href="/finance"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E4FF6B] hover:underline"
            >
              Lihat Rincian Dompet & Arus Kas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />

        {/* Card 2: Pengeluaran Bulan Ini (Lime Accent #E4FF6B) */}
        <StatCard
          variant="lime"
          title="Pengeluaran Bulan Ini"
          value={`Rp ${totalExpenseThisMonth.toLocaleString('id-ID')}`}
          subtitle={`Pemasukan: Rp ${totalIncomeThisMonth.toLocaleString('id-ID')}`}
          badgeText="Budgeting"
          badgeType="dark"
          icon={<TrendingUp className="w-5 h-5" />}
          actionButton={
            <div className="flex items-center justify-between text-xs font-bold text-black/80">
              <span>Sisa Budget: Rp {Math.max(totalBudgetLimit - totalBudgetSpent, 0).toLocaleString('id-ID')}</span>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="hover:underline flex items-center gap-1 font-extrabold text-[#111111]"
              >
                Atur <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          }
        />

        {/* Card 3: Study & Focus Metrics (White Surface) */}
        <StatCard
          variant="white"
          title="Daily Study & Target"
          value={`${pendingAssignments.length} Tugas Pending`}
          subtitle={`${flashcardsDueToday} Flashcard siap di-review hari ini`}
          badgeText={`${overallStreak} Hari Streak`}
          badgeType="neutral"
          icon={<GraduationCap className="w-5 h-5 text-[#111111]" />}
          actionButton={
            <Link
              href="/study"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#111111] hover:underline"
            >
              Mulai Sesi Belajar & Flashcard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      </section>

      {/* Row 2: 4-Module Interactive Hub Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col Left (7 cols): Finance Budget Capsules & Quick Summary */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span>Budget Monitor & Capsule Sliders</span>
              </h2>
              <p className="text-xs text-[#7F847C] font-medium">
                Visualisasi pemakaian budget per kategori bulan berjalan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="text-xs font-bold text-[#111111] bg-[#EDEFEB] px-3 py-1.5 rounded-full hover:bg-[#111111] hover:text-[#E4FF6B] transition-colors"
              >
                Atur Limit
              </button>
              <Link
                href="/finance"
                className="text-xs font-bold text-[#111111] bg-[#EDEFEB] px-3 py-1.5 rounded-full hover:bg-[#111111] hover:text-[#E4FF6B] transition-colors"
              >
                Finance Hub
              </Link>
            </div>
          </div>

          {/* Capsule Sliders in a Row */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 py-3 border-y border-black/5">
            {budgets.slice(0, 6).map((b) => {
              const spent =
                b.spent ||
                currentMonthTransactions
                  .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
                  .reduce((sum, t) => sum + t.amount, 0);
              return (
                <CapsuleProgress
                  key={b.id}
                  label={b.category}
                  spent={spent}
                  limit={b.limit_amount}
                  orientation="vertical"
                />
              );
            })}
          </div>

          {/* Bottom Card CTA */}
          <div className="mt-4 flex items-center justify-between text-xs text-[#7F847C]">
            <span>Total Limit: Rp {totalBudgetLimit.toLocaleString('id-ID')}</span>
            <Link href="/finance" className="font-bold text-[#111111] hover:underline">
              Kelola Pengeluaran & Transaksi →
            </Link>
          </div>
        </div>

        {/* Col Right (5 cols): Machine Learning & Data Science Corner Preview */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                <span>DS & ML Tracker</span>
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#111111] text-[#E4FF6B]">
                Playground
              </span>
            </div>
            <p className="text-xs text-[#7F847C] mb-4">
              Dataset EDA, Python snippet vault, dan histori run model machine learning.
            </p>

            {/* Latest Experiment mini card */}
            {latestExperiment ? (
              <div className="p-4 rounded-2xl bg-[#EDEFEB]/60 border border-black/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111111]">{latestExperiment.title}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#7F847C] block">Model</span>
                    <span className="font-semibold text-[#111111]">{latestExperiment.model_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7F847C] block">F1-Score / Metric</span>
                    <span className="font-semibold text-[#111111]">
                      {Object.entries(latestExperiment.metrics)[0]
                        ? `${Object.entries(latestExperiment.metrics)[0][0]}: ${Object.entries(latestExperiment.metrics)[0][1]}`
                        : '0.942'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#EDEFEB]/40 text-center text-xs text-[#7F847C]">
                Belum ada eksperimen ML tercatat.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
            <Link
              href="/datascience"
              className="text-xs font-extrabold text-[#111111] hover:underline flex items-center gap-1"
            >
              Buka Data Science Corner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Row 3: Study Task Hub & Daily Mood Log */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Study sprint task preview (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                <span>Assignment Board & Deadlines</span>
              </h2>
              <span className="text-xs font-bold text-[#7F847C]">
                {pendingAssignments.length} Belum Selesai
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingAssignments.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 flex items-center justify-between hover:bg-[#EDEFEB] transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#111111]">{a.title}</h4>
                    <span className="text-[10px] text-[#7F847C]">{a.subject} • Due: {a.due_date}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.priority === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : a.priority === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {a.priority.toUpperCase()}
                  </span>
                </div>
              ))}

              {pendingAssignments.length === 0 && (
                <div className="py-6 text-center text-xs text-[#7F847C]">
                  Semua tugas telah diselesaikan! 🎉
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
            <Link href="/study" className="text-xs font-extrabold text-[#111111] hover:underline flex items-center gap-1">
              Buka Note Summarizer & Flashcards <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Cozy Mood Log preview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
                <BookHeart className="w-5 h-5" />
                <span>Today's Mindful Reflection</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDEFEB] text-[#111111]">
                Cozy Space
              </span>
            </div>

            {todayJournal ? (
              <div className="p-4 rounded-2xl bg-[#EDEFEB]/60 border border-black/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">
                    {todayJournal.mood_score === 5 ? '🔥' : todayJournal.mood_score >= 4 ? '⚡' : '🙂'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111111] text-[#E4FF6B] capitalize">
                    {todayJournal.mood_tag}
                  </span>
                </div>
                <p className="text-xs text-[#111111]/80 leading-relaxed italic">
                  "{todayJournal.content}"
                </p>
                <div className="text-[10px] text-[#7F847C]">{todayJournal.date}</div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#EDEFEB]/40 text-center text-xs text-[#7F847C]">
                Belum ada refleksi yang dicatat hari ini.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
            <Link href="/journal" className="text-xs font-extrabold text-[#111111] hover:underline flex items-center gap-1">
              Catat Refleksi & Mood Harian <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Edit Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#111111] text-[#E4FF6B]">
                  <Sliders className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">Atur Limit Budget Kategori</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EDEFEB]"
              >
                <X className="w-4 h-4 text-[#7F847C]" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Pilih Kategori</label>
                <CustomSelect
                  value={editCategory}
                  onChange={(selected) => {
                    setEditCategory(selected);
                    const currentBudget = budgets.find((b) => b.category.toLowerCase() === selected.toLowerCase());
                    if (currentBudget) {
                      setEditLimit(String(currentBudget.limit_amount));
                    }
                  }}
                  options={categories
                    .filter((c) => c.type === 'expense' || c.type === 'both')
                    .map((c) => ({
                      value: c.name.toLowerCase(),
                      label: c.name,
                      color: c.color,
                    }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Limit Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="Contoh: 2000000"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="block text-[10px] font-bold text-[#7F847C] uppercase mb-1.5">Preset Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['500000', '1000000', '1500000', '2000000', '3000000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditLimit(val)}
                      className="px-2.5 py-1 rounded-xl bg-[#EDEFEB] hover:bg-[#111111] hover:text-[#E4FF6B] text-[11px] font-bold text-[#111111] transition-all"
                    >
                      {parseInt(val) >= 1000000 ? `${parseInt(val) / 1000000} Juta` : `${parseInt(val) / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold text-[#111111]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold"
                >
                  Simpan Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
