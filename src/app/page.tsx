'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  GraduationCap,
  LineChart,
  BookHeart,
  TrendingUp,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CapsuleProgress } from '@/components/ui/CapsuleProgress';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ModalWrapper } from '@/components/ui/ModalWrapper';

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

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('makan');
  const [editLimit, setEditLimit] = useState('2000000');

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + (w.balance || 0), 0),
    [wallets]
  );

  /* Single pass over transactions builds the month totals AND the
     per-category spend index.

     The old code scanned the ledger three times up front, then once more per
     budget row inside a reduce (O(budgets x transactions)), then AGAIN inside
     the capsule render loop below — five-plus full scans on every render,
     none of them memoised. */
  const { totalExpenseThisMonth, totalIncomeThisMonth, spentByCategory } = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const byCategory = new Map<string, number>();
    let expense = 0;
    let income = 0;

    for (const t of transactions) {
      if (!t.date.startsWith(month)) continue;
      if (t.type === 'expense') {
        expense += t.amount;
        const key = t.category.toLowerCase();
        byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
      } else if (t.type === 'income') {
        income += t.amount;
      }
    }

    return {
      totalExpenseThisMonth: expense,
      totalIncomeThisMonth: income,
      spentByCategory: byCategory,
    };
  }, [transactions]);

  const { totalBudgetLimit, totalBudgetSpent } = useMemo(() => {
    let limit = 0;
    let spent = 0;
    for (const b of budgets) {
      limit += b.limit_amount;
      spent += b.spent ?? spentByCategory.get(b.category.toLowerCase()) ?? 0;
    }
    return { totalBudgetLimit: limit, totalBudgetSpent: spent };
  }, [budgets, spentByCategory]);

  const pendingAssignments = useMemo(
    () => assignments.filter((a) => a.status !== 'completed'),
    [assignments]
  );

  const overallStreak = useMemo(
    () => streaks.find((s) => s.module === 'overall')?.current_streak || 0,
    [streaks]
  );

  const flashcardsDueToday = flashcards.length;
  const latestExperiment = experiments[0];
  const todayJournal = journalEntries[0];

  // Object.entries() was called three times per render on the same object.
  const metricLabel = useMemo(() => {
    const first = latestExperiment ? Object.entries(latestExperiment.metrics)[0] : undefined;
    return first ? `${first[0]}: ${first[1]}` : '0.942';
  }, [latestExperiment]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLimit) return;
    await updateBudget(editCategory, parseFloat(editLimit));
    setIsBudgetModalOpen(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <TopHeader
        title="Dashboard Overview"
        subtitle="Satu tempat untuk mengatur finansial, belajar data science, eksperimen model, & daily mood."
        badgeText="Active Workspace"
      />

      {/* Row 1: Stat Cards */}
      <section className="stat-grid">
        <StatCard
          variant="dark"
          title="Total Saldo Kas"
          value={`Rp ${totalBalance.toLocaleString('id-ID')}`}
          subtitle={`Tersebar di ${wallets.length} rekening/e-wallet`}
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
              <span>Sisa: Rp {Math.max(totalBudgetLimit - totalBudgetSpent, 0).toLocaleString('id-ID')}</span>
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

        <StatCard
          variant="white"
          title="Daily Study & Target"
          value={`${pendingAssignments.length} Tugas Pending`}
          subtitle={`${flashcardsDueToday} Flashcard siap di-review hari ini`}
          badgeText={`${overallStreak} Hari Streak`}
          badgeType="neutral"
          icon={<GraduationCap className="w-5 h-5" />}
          actionButton={
            <Link
              href="/study"
              className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
            >
              Mulai Sesi Belajar & Flashcard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      </section>

      {/* Row 2: Finance Hub & DS Corner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Finance Budget Capsules */}
        <div className="lg:col-span-7 card-base flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h2 className="heading-sm flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <span>Budget Monitor & Capsule Sliders</span>
              </h2>
              <p className="section-subtitle">
                Visualisasi pemakaian budget per kategori bulan berjalan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="btn-pill btn-pill-neutral"
              >
                Atur Limit
              </button>
              <Link
                href="/finance"
                className="btn-pill btn-pill-neutral"
              >
                Finance Hub
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 py-3 border-y border-subtle">
            {budgets.slice(0, 6).map((b) => (
              <CapsuleProgress
                key={b.id}
                label={b.category}
                spent={b.spent ?? spentByCategory.get(b.category.toLowerCase()) ?? 0}
                limit={b.limit_amount}
                orientation="vertical"
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted flex-wrap gap-2">
            <span>Total Limit: Rp {totalBudgetLimit.toLocaleString('id-ID')}</span>
            <Link href="/finance" className="font-bold hover:underline">
              Kelola Pengeluaran & Transaksi →
            </Link>
          </div>
        </div>

        {/* Machine Learning & DS Corner */}
        <div className="lg:col-span-5 card-base flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                <span>DS & ML Tracker</span>
              </h2>
              <span className="badge badge-dark">Playground</span>
            </div>
            <p className="section-subtitle mb-4">
              Dataset EDA, Python snippet vault, dan histori run model machine learning.
            </p>

            {latestExperiment ? (
              <div className="card-muted space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{latestExperiment.title}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted block">Model</span>
                    <span className="font-semibold">{latestExperiment.model_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">F1-Score / Metric</span>
                    <span className="font-semibold">
                      {metricLabel}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-subtle-soft text-center section-subtitle">
                Belum ada eksperimen ML tercatat.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between">
            <Link
              href="/datascience"
              className="text-xs font-extrabold hover:underline flex items-center gap-1"
            >
              Buka Data Science Corner <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Row 3: Study Task Hub & Daily Mood Log */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Study sprint task preview */}
        <div className="lg:col-span-7 card-base flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                <span>Assignment Board & Deadlines</span>
              </h2>
              <span className="text-xs font-bold text-muted">
                {pendingAssignments.length} Belum Selesai
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingAssignments.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl card-muted tile-selectable flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold">{a.title}</h4>
                    <span className="text-[10px] text-muted">{a.subject} • Due: {a.due_date}</span>
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
                <div className="py-6 text-center section-subtitle">
                  Semua tugas telah diselesaikan! 🎉
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between">
            <Link href="/study" className="text-xs font-extrabold hover:underline flex items-center gap-1">
              Buka Note Summarizer & Flashcards <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Cozy Mood Log preview */}
        <div className="lg:col-span-5 card-base flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-sm flex items-center gap-2">
                <BookHeart className="w-5 h-5" />
                <span>Today's Mindful Reflection</span>
              </h2>
              <span className="badge badge-neutral">Cozy Space</span>
            </div>

            {todayJournal ? (
              <div className="card-muted space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">
                    {todayJournal.mood_score === 5 ? '🔥' : todayJournal.mood_score >= 4 ? '⚡' : '🙂'}
                  </span>
                  <span className="badge badge-dark capitalize">
                    {todayJournal.mood_tag}
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed italic">
                  "{todayJournal.content}"
                </p>
                <div className="text-[10px] text-muted">{todayJournal.date}</div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-subtle-soft text-center section-subtitle">
                Belum ada refleksi yang dicatat hari ini.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between">
            <Link href="/journal" className="text-xs font-extrabold hover:underline flex items-center gap-1">
              Catat Refleksi & Mood Harian <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Edit Budget Modal */}
      <ModalWrapper
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Atur Limit Budget Kategori"
        icon={<Sliders className="w-4 h-4" />}
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="label-field">Pilih Kategori</label>
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
            <label className="label-field">Limit Bulanan (Rp)</label>
            <input
              type="number"
              required
              min="0"
              step="any"
              placeholder="Contoh: 2000000"
              value={editLimit}
              onChange={(e) => setEditLimit(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <span className="label-field mb-1.5">Preset Cepat:</span>
            <div className="flex flex-wrap gap-1.5">
              {['500000', '1000000', '1500000', '2000000', '3000000'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEditLimit(val)}
                  className="btn-pill btn-pill-neutral !text-[11px]"
                >
                  {parseInt(val) >= 1000000 ? `${parseInt(val) / 1000000} Juta` : `${parseInt(val) / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(false)}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Simpan Limit
            </button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}
