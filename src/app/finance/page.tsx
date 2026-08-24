'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Calendar,
  Filter,
  PieChart as PieIcon,
  Sparkles,
  CreditCard,
  Building2,
  Banknote,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  X,
} from 'lucide-react';
import { Transaction } from '@/lib/types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CapsuleProgress } from '@/components/ui/CapsuleProgress';
import { QuickAddModal } from '@/components/ui/QuickAddModal';

const CATEGORY_COLORS: Record<string, string> = {
  makan: '#FF8A00',
  kos: '#0060AF',
  transport: '#00AED6',
  kuliah: '#9333EA',
  hiburan: '#EC4899',
  belanja: '#EAB308',
  'uang jajan': '#10B981',
  'gaji/freelance': '#10B981',
  lainnya: '#7F847C',
};

export default function FinancePage() {
  const {
    wallets,
    transactions,
    budgets,
    deleteTransaction,
    updateTransaction,
    addWallet,
    updateWallet,
    deleteWallet,
    updateBudget,
    streaks,
  } = useDashboard();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Transaction modal state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTxTitle, setEditTxTitle] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxType, setEditTxType] = useState<'income' | 'expense'>('expense');
  const [editTxCategory, setEditTxCategory] = useState('makan');
  const [editTxCustomCategory, setEditTxCustomCategory] = useState('');
  const [editTxPaymentMethod, setEditTxPaymentMethod] = useState('');
  const [editTxDate, setEditTxDate] = useState('');
  const [editTxNotes, setEditTxNotes] = useState('');
  const [editTxIsRecurring, setEditTxIsRecurring] = useState(false);

  // Edit Wallet modal state
  const [editingWallet, setEditingWallet] = useState<any | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletBalance, setEditWalletBalance] = useState('');

  // New Wallet form modal toggle
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'bank' | 'ewallet' | 'cash'>('bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newWalletColor, setNewWalletColor] = useState('#FF5E00');

  // Budget edit modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('makan');
  const [editLimit, setEditLimit] = useState('2000000');

  // Calculations
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTx = transactions.filter((t) => t.date.startsWith(currentMonth));

  const totalExpense = currentMonthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = currentMonthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const financeStreak = streaks.find((s) => s.module === 'finance')?.current_streak || 0;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchWallet =
        filterWallet === 'all' || t.payment_method.toLowerCase() === filterWallet.toLowerCase();
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchCategory && matchWallet && matchSearch;
    });
  }, [transactions, filterType, filterCategory, filterWallet, searchQuery]);

  // Donut Chart Data (Expenses by Category)
  const donutData = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name.toLowerCase()] || '#7F847C',
    }));
  }, [currentMonthTx]);

  // Area Chart Data (Daily Cash Flow Trend)
  const areaData = useMemo(() => {
    const daysMap: Record<string, { date: string; income: number; expense: number }> = {};
    
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach((t) => {
      const day = t.date.slice(5); // MM-DD
      if (!daysMap[day]) {
        daysMap[day] = { date: day, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        daysMap[day].income += t.amount;
      } else {
        daysMap[day].expense += t.amount;
      }
    });

    return Object.values(daysMap);
  }, [transactions]);

  // Automated Insight Generator
  const spendingInsight = useMemo(() => {
    if (totalExpense === 0 && totalIncome === 0) {
      return 'Belum ada transaksi yang tercatat bulan ini. Catat transaksi baru untuk melihat analisis kesehatan finansialmu.';
    }
    
    const topCategory = donutData.length > 0
      ? [...donutData].sort((a, b) => b.value - a.value)[0]
      : null;

    const netSavings = totalIncome - totalExpense;
    const savingRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    let text = `Bulan ini kamu mencatat total pengeluaran Rp ${totalExpense.toLocaleString('id-ID')} dengan total pemasukan Rp ${totalIncome.toLocaleString('id-ID')} (Saving Rate: ${savingRate}%). `;
    
    if (topCategory) {
      const topPct = Math.round((topCategory.value / totalExpense) * 100);
      text += `Pos pengeluaran terbesar adalah ${topCategory.name.toUpperCase()} (${topPct}% dari total). `;
    }

    if (savingRate >= 30) {
      text += 'Kesehatan finansial sangat stabil (di atas rekomendasi 20-30% saving rate).';
    } else if (savingRate >= 0) {
      text += 'Arus kas positif. Tetap monitor pengeluaran rutin.';
    } else {
      text += 'Pengeluaran bulan ini melebihi pemasukan. Tinjau pos sekunder untuk menjaga arus kas.';
    }

    return text;
  }, [totalExpense, totalIncome, donutData]);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName) return;
    await addWallet({
      name: newWalletName,
      type: newWalletType,
      balance: parseFloat(newWalletBalance || '0'),
      color: newWalletColor,
      icon: newWalletType === 'bank' ? 'credit-card' : 'wallet',
    });
    setIsWalletModalOpen(false);
    setNewWalletName('');
    setNewWalletBalance('');
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLimit) return;
    await updateBudget(editCategory, parseFloat(editLimit));
    setIsBudgetModalOpen(false);
  };

  const standardExpenseCategories = ['makan', 'kos', 'transport', 'kuliah', 'hiburan', 'belanja'];
  const standardIncomeCategories = ['gaji/freelance', 'uang jajan'];

  const handleOpenEditTx = (t: Transaction) => {
    setEditingTx(t);
    setEditTxTitle(t.title);
    setEditTxAmount(String(t.amount));
    setEditTxType(t.type);

    const isStdExpense = t.type === 'expense' && standardExpenseCategories.includes(t.category.toLowerCase());
    const isStdIncome = t.type === 'income' && standardIncomeCategories.includes(t.category.toLowerCase());

    if (isStdExpense || isStdIncome) {
      setEditTxCategory(t.category.toLowerCase());
      setEditTxCustomCategory('');
    } else {
      setEditTxCategory('lainnya');
      setEditTxCustomCategory(t.category.toLowerCase() === 'lainnya' ? '' : t.category);
    }

    setEditTxPaymentMethod(t.payment_method);
    setEditTxDate(t.date || new Date().toISOString().split('T')[0]);
    setEditTxNotes(t.notes || '');
    setEditTxIsRecurring(!!t.is_recurring);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editTxTitle || !editTxAmount) return;

    let finalCategory = editTxCategory;
    if (editTxCategory === 'lainnya') {
      finalCategory = editTxCustomCategory.trim() || 'lainnya';
    }

    await updateTransaction(editingTx.id, {
      title: editTxTitle,
      amount: parseFloat(editTxAmount),
      type: editTxType,
      category: finalCategory,
      payment_method: editTxPaymentMethod,
      date: editTxDate,
      notes: editTxNotes || undefined,
      is_recurring: editTxIsRecurring,
    });

    setEditingTx(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <TopHeader
        title="Finance & Cashflow"
        subtitle="Manajemen saldo multi-rekening (Jago, BCA, GoPay, Cash), budget capsule, dan riwayat transaksi."
        badgeText="Personal Finance"
      />

      {/* Row 1: Stat Cards Kontras */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          variant="dark"
          title="Total Saldo Tersedia"
          value={`Rp ${totalBalance.toLocaleString('id-ID')}`}
          subtitle="Total akumulasi semua dompet & rekening"
          badgeText="Active Net Worth"
          badgeType="lime"
          icon={<Wallet className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E4FF6B] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Rekening / Dompet Baru
            </button>
          }
        />

        <StatCard
          variant="lime"
          title="Pemasukan Bulan Ini"
          value={`Rp ${totalIncome.toLocaleString('id-ID')}`}
          subtitle={`Selisih Kas: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`}
          badgeText="+ Cash Inflow"
          badgeType="dark"
          icon={<TrendingUp className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-black/80 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Catat Pemasukan / Freelance
            </button>
          }
        />

        <StatCard
          variant="white"
          title="Pengeluaran Bulan Ini"
          value={`Rp ${totalExpense.toLocaleString('id-ID')}`}
          subtitle={`Streak Pencatatan: ${financeStreak} Hari`}
          badgeText={`${financeStreak}d Streak`}
          badgeType="neutral"
          icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
          actionButton={
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1"
            >
              Atur Limit Budget Kategori →
            </button>
          }
        />
      </section>

      {/* Row 2: Multi-Wallet Cards Row */}
      <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#111111]" />
            <h2 className="text-base font-extrabold text-[#111111]">Metode Pembayaran & Saldo Dompet</h2>
          </div>
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#EDEFEB] hover:bg-[#111111] hover:text-[#E4FF6B] text-xs font-bold text-[#111111] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Metode</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-2xl bg-[#EDEFEB]/60 border border-black/5 hover:border-black/20 transition-all flex flex-col justify-between group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#7F847C] uppercase tracking-wider">{w.name}</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/10"
                    style={{ backgroundColor: w.color || '#111111' }}
                  />
                  <button
                    onClick={() => {
                      setEditingWallet(w);
                      setEditWalletName(w.name);
                      setEditWalletBalance(String(w.balance));
                    }}
                    title="Edit Saldo / Dompet"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded-md text-[10px] text-[#111111] transition-all font-bold"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div>
                <div className="text-lg font-black text-[#111111]">
                  Rp {w.balance.toLocaleString('id-ID')}
                </div>
                <div className="text-[10px] text-[#7F847C] capitalize mt-0.5">{w.type}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Row 3: Visual Charts & Budget Capsule Sliders */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                <PieIcon className="w-4 h-4" />
                <span>Breakdown Pengeluaran</span>
              </h3>
              <span className="text-[11px] text-[#7F847C] font-semibold">Bulan Ini</span>
            </div>
            <p className="text-xs text-[#7F847C] mb-4">Proporsi pengeluaran berdasarkan kategori</p>

            {donutData.length > 0 ? (
              <div className="h-60 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`, 'Nominal']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center text-xs text-[#7F847C]">
                Belum ada data pengeluaran bulan ini.
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
            {donutData.map((d) => (
              <span
                key={d.name}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#111111] bg-[#EDEFEB] px-2.5 py-1 rounded-full"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="capitalize">{d.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Capsule Progress & Cash Flow Area Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>Capsule Budget Progress</span>
              </h3>
              <p className="text-xs text-[#7F847C]">Limit & pemakaian per kategori</p>
            </div>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#111111] text-[#E4FF6B] hover:bg-[#222222] transition-colors"
            >
              Edit Budget
            </button>
          </div>

          {/* Horizontal Capsule list */}
          <div className="space-y-3 mb-6">
            {budgets.map((b) => {
              const spent =
                b.spent ||
                currentMonthTx
                  .filter((t) => t.type === 'expense' && t.category.toLowerCase() === b.category.toLowerCase())
                  .reduce((sum, t) => sum + t.amount, 0);
              return (
                <CapsuleProgress
                  key={b.id}
                  label={b.category}
                  spent={spent}
                  limit={b.limit_amount}
                  orientation="horizontal"
                />
              );
            })}
          </div>

          {/* Area Chart: Tren Cash Flow */}
          <div className="pt-4 border-t border-black/5">
            <h4 className="text-xs font-extrabold text-[#111111] mb-2 uppercase tracking-wider">
              Tren Arus Kas (Income vs Expense)
            </h4>
            <div className="h-44 w-full">
              {areaData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaData}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E4FF6B" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#E4FF6B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" stroke="#7F847C" fontSize={10} />
                    <YAxis stroke="#7F847C" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#incomeGrad)"
                      name="Pemasukan"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#111111"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expenseGrad)"
                      name="Pengeluaran"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#7F847C]">
                  Belum ada histori transaksi untuk grafik arus kas.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Row 4: Smart Financial Insight Banner */}
      <section className="p-6 rounded-3xl bg-[#111111] text-white border border-black/10 shadow-xl flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-[#E4FF6B] text-[#111111] shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-extrabold text-white">Smart Financial Insight</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#E4FF6B]">
              Auto-Analyst
            </span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed font-normal">{spendingInsight}</p>
        </div>
      </section>

      {/* Row 5: Transaction History Table & Filters */}
      <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-[#111111]">Riwayat Transaksi</h3>
            <p className="text-xs text-[#7F847C]">Total {filteredTransactions.length} transaksi tercatat</p>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-1.5 rounded-full bg-[#EDEFEB] text-xs border border-black/5 focus:outline-none focus:ring-1 focus:ring-[#111111]"
            />

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 rounded-full bg-[#EDEFEB] text-xs font-semibold border border-black/5 focus:outline-none"
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan (+)</option>
              <option value="expense">Pengeluaran (-)</option>
            </select>

            {/* Wallet Filter */}
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="px-3 py-1.5 rounded-full bg-[#EDEFEB] text-xs font-semibold border border-black/5 focus:outline-none"
            >
              <option value="all">Semua Metode</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>

            {/* CTA Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-bold hover:bg-[#222222] transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Transaksi</span>
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-black/5">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <div
                key={t.id}
                className="py-3.5 flex items-center justify-between hover:bg-[#EDEFEB]/40 px-3 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      t.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#EDEFEB] text-[#111111]'
                    }`}
                  >
                    {t.type === 'income' ? (
                      <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-rose-500" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#111111]">{t.title}</span>
                      {t.is_recurring && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111111] text-[#E4FF6B]">
                          <Repeat className="w-2.5 h-2.5" /> Recurring
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#7F847C] mt-0.5">
                      <span className="capitalize">{t.category}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#111111] bg-[#EDEFEB] px-2 py-0.5 rounded-md text-[10px]">
                        {t.payment_method}
                      </span>
                      <span>•</span>
                      <span>{t.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-[#111111]'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                    </span>
                    {t.notes && <p className="text-[10px] text-[#7F847C] max-w-[150px] truncate">{t.notes}</p>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTx(t)}
                      title="Edit Transaksi"
                      className="p-2 rounded-xl text-[#7F847C] hover:text-[#111111] hover:bg-[#EDEFEB] transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      title="Hapus Transaksi"
                      className="p-2 rounded-xl text-[#7F847C] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-[#7F847C]">
              Belum ada transaksi. Klik Tambah Transaksi untuk mulai mencatat.
            </div>
          )}
        </div>
      </section>

      {/* Quick Add Modal */}
      {isAddModalOpen && (
        <QuickAddModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultTab="finance"
        />
      )}

      {/* Add Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-[#111111] mb-4">Tambah Metode / Rekening Baru</h3>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Nama Rekening / Dompet</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bank Jago, BCA, GoPay, OVO, Cash"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Tipe</label>
                  <select
                    value={newWalletType}
                    onChange={(e) => setNewWalletType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none"
                  >
                    <option value="bank">Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Tunai (Cash)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newWalletBalance}
                    onChange={(e) => setNewWalletBalance(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Warna Label</label>
                <div className="flex gap-2">
                  {['#FF5E00', '#0060AF', '#00AED6', '#10B981', '#9333EA', '#111111'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewWalletColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        newWalletColor === c ? 'scale-110 border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold text-[#111111]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-[#111111] mb-4">Atur Limit Budget Bulanan</h3>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Kategori</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none"
                >
                  <option value="makan">Makan & Minum</option>
                  <option value="kos">Sewa Kos</option>
                  <option value="transport">Transportasi</option>
                  <option value="kuliah">Kuliah & Tools DS</option>
                  <option value="hiburan">Hiburan & Nongkrong</option>
                  <option value="belanja">Belanja</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Limit Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  min="10000"
                  step="50000"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
      {/* Edit Wallet Modal */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-[#111111] mb-4">Edit Rekening / Saldo Dompet</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await updateWallet(editingWallet.id, {
                  name: editWalletName,
                  balance: parseFloat(editWalletBalance || '0'),
                });
                setEditingWallet(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Nama Rekening / Dompet</label>
                <input
                  type="text"
                  required
                  value={editWalletName}
                  onChange={(e) => setEditWalletName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Saldo Saat Ini (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={editWalletBalance}
                  onChange={(e) => setEditWalletBalance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Hapus rekening ${editingWallet.name}?`)) {
                      await deleteWallet(editingWallet.id);
                      setEditingWallet(null);
                    }
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Hapus Rekening
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWallet(null)}
                    className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold text-[#111111]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold"
                  >
                    Simpan Saldo
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#111111] text-[#E4FF6B]">
                  <Pencil className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">Edit Transaksi</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1.5 rounded-full hover:bg-[#EDEFEB] text-[#7F847C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#EDEFEB] rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditTxType('expense');
                    if (['gaji/freelance', 'uang jajan'].includes(editTxCategory)) {
                      setEditTxCategory('makan');
                    }
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    editTxType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-[#7F847C] hover:text-[#111111]'
                  }`}
                >
                  Pengeluaran (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditTxType('income');
                    if (['makan', 'kos', 'transport', 'kuliah', 'hiburan', 'belanja'].includes(editTxCategory)) {
                      setEditTxCategory('gaji/freelance');
                    }
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    editTxType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[#7F847C] hover:text-[#111111]'
                  }`}
                >
                  Pemasukan (Income)
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Deskripsi Transaksi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Belanja Bulanan, Freelance project"
                  value={editTxTitle}
                  onChange={(e) => setEditTxTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Amount & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editTxAmount}
                    onChange={(e) => setEditTxAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Metode Pembayaran</label>
                  <select
                    value={editTxPaymentMethod}
                    onChange={(e) => setEditTxPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                      </option>
                    ))}
                    {!wallets.some((w) => w.name.toLowerCase() === editTxPaymentMethod.toLowerCase()) && (
                      <option value={editTxPaymentMethod}>{editTxPaymentMethod}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Kategori</label>
                  {editTxType === 'expense' ? (
                    <select
                      value={editTxCategory}
                      onChange={(e) => setEditTxCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                    >
                      <option value="makan">🍜 Makanan & Minuman</option>
                      <option value="kos">🏠 Sewa Kos / Tempat</option>
                      <option value="transport">🛵 Transportasi</option>
                      <option value="kuliah">🎓 Kuliah & Tools DS</option>
                      <option value="hiburan">☕ Hiburan & Nongkrong</option>
                      <option value="belanja">🛍️ Belanja</option>
                      <option value="lainnya">📦 Lainnya / Kustom</option>
                    </select>
                  ) : (
                    <select
                      value={editTxCategory}
                      onChange={(e) => setEditTxCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                    >
                      <option value="gaji/freelance">💼 Gaji & Freelance</option>
                      <option value="uang jajan">💰 Uang Jajan / Transfer</option>
                      <option value="lainnya">📦 Lainnya / Kustom</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editTxDate}
                    onChange={(e) => setEditTxDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </div>

              {/* Custom Category Input if 'lainnya' */}
              {editTxCategory === 'lainnya' && (
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Nama Kategori Kustom</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama kategori baru"
                    value={editTxCustomCategory}
                    onChange={(e) => setEditTxCustomCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan"
                  value={editTxNotes}
                  onChange={(e) => setEditTxNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Recurring Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editTxRecurring"
                  checked={editTxIsRecurring}
                  onChange={(e) => setEditTxIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded text-[#111111] focus:ring-[#111111]"
                />
                <label htmlFor="editTxRecurring" className="text-xs font-semibold text-[#111111] cursor-pointer">
                  Tandai sebagai transaksi rutin bulanan (Recurring)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-black/5">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Hapus transaksi "${editingTx.title}"?`)) {
                      await deleteTransaction(editingTx.id);
                      setEditingTx(null);
                    }
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Transaksi
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold text-[#111111]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
