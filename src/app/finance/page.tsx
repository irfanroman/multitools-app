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
  ArrowRightLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  Tag,
} from 'lucide-react';
import { Transaction, CategoryItem } from '@/lib/types';
import { CustomSelect } from '@/components/ui/CustomSelect';
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
    categories,
    transactions,
    budgets,
    deleteTransaction,
    updateTransaction,
    addWallet,
    updateWallet,
    deleteWallet,
    updateBudget,
    addCategory,
    deleteCategory,
    streaks,
  } = useDashboard();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_desc' | 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('created_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset pagination to page 1 on filter or sort change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterCategory, filterWallet, filterDate, sortBy, searchQuery]);

  // Add Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income' | 'both'>('expense');
  const [newCatColor, setNewCatColor] = useState('#FF8A00');

  // Edit Transaction modal state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editTxTitle, setEditTxTitle] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxType, setEditTxType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [editTxCategory, setEditTxCategory] = useState('makan');
  const [editTxCustomCategory, setEditTxCustomCategory] = useState('');
  const [editTxPaymentMethod, setEditTxPaymentMethod] = useState('');
  const [editTxToPaymentMethod, setEditTxToPaymentMethod] = useState('');
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

  // Filtered & Sorted transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchWallet =
        filterWallet === 'all' ||
        t.payment_method.toLowerCase() === filterWallet.toLowerCase() ||
        (t.type === 'transfer' && t.to_payment_method?.toLowerCase() === filterWallet.toLowerCase());
      const matchDate = !filterDate || t.date === filterDate;
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.to_payment_method && t.to_payment_method.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchCategory && matchWallet && matchDate && matchSearch;
    });

    // Sorting logic
    return [...result].sort((a, b) => {
      if (sortBy === 'created_desc') {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || '').localeCompare(a.id || '');
      }
      if (sortBy === 'date_desc') {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'date_asc') {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [transactions, filterType, filterCategory, filterWallet, filterDate, searchQuery, sortBy]);

  // Paginated transactions
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Donut Chart Data (Expenses by Category)
  const donutData = useMemo(() => {
    const map: Record<string, number> = {};
    currentMonthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });

    return Object.entries(map).map(([name, value]) => {
      const foundCat = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
      return {
        name,
        value,
        color: foundCat?.color || CATEGORY_COLORS[name.toLowerCase()] || '#7F847C',
      };
    });
  }, [currentMonthTx, categories]);

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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
    });
    setIsCategoryModalOpen(false);
    setNewCatName('');
  };

  const handleOpenEditTx = (t: Transaction) => {
    setEditingTx(t);
    setEditTxTitle(t.title);
    setEditTxAmount(String(t.amount));
    setEditTxType(t.type);
    setEditTxCategory(t.category.toLowerCase());
    setEditTxCustomCategory('');
    setEditTxPaymentMethod(t.payment_method);
    setEditTxToPaymentMethod(t.to_payment_method || wallets.find((w) => w.name.toLowerCase() !== t.payment_method.toLowerCase())?.name || 'BCA');
    setEditTxDate(t.date || new Date().toISOString().split('T')[0]);
    setEditTxNotes(t.notes || '');
    setEditTxIsRecurring(!!t.is_recurring);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editTxTitle || !editTxAmount) return;

    let finalCategory = editTxCategory;
    if (editTxType === 'transfer') {
      finalCategory = 'pemindahan dana';
    } else if (editTxCategory === 'lainnya' && editTxCustomCategory.trim()) {
      finalCategory = editTxCustomCategory.trim();
    }

    await updateTransaction(editingTx.id, {
      title: editTxTitle,
      amount: parseFloat(editTxAmount),
      type: editTxType,
      category: finalCategory,
      payment_method: editTxPaymentMethod,
      to_payment_method: editTxType === 'transfer' ? editTxToPaymentMethod : undefined,
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#EDEFEB] text-[#111111] hover:bg-[#111111] hover:text-[#E4FF6B] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Kategori
              </button>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#111111] text-[#E4FF6B] hover:bg-[#222222] transition-colors"
              >
                Edit Budget
              </button>
            </div>
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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-[#111111]">Riwayat Transaksi</h3>
            <p className="text-xs text-[#7F847C]">
              Total {filteredTransactions.length} transaksi tercatat • Halaman {currentPage} dari {totalPages}
            </p>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/60 text-xs font-semibold border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#111111] w-32 sm:w-40"
            />

            {/* Date Filter (Cari Tanggal) */}
            <div className="relative flex items-center">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-[#EDEFEB]/60 text-xs font-semibold border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#111111] text-[#111111] cursor-pointer"
                title="Filter berdasarkan tanggal"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  title="Hapus filter tanggal"
                  className="absolute right-2 p-0.5 rounded-full hover:bg-black/10 text-[#7F847C]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <CustomSelect
              value={filterType}
              onChange={(v) => setFilterType(v as any)}
              className="w-32"
              options={[
                { value: 'all', label: 'Semua Tipe' },
                { value: 'income', label: 'Pemasukan (+)' },
                { value: 'expense', label: 'Pengeluaran (-)' },
                { value: 'transfer', label: 'Pemindahan (↔)' },
              ]}
            />

            {/* Category Filter */}
            <CustomSelect
              value={filterCategory}
              onChange={(v) => setFilterCategory(v)}
              className="w-36"
              placeholder="Semua Kategori"
              options={[
                { value: 'all', label: 'Semua Kategori' },
                ...categories.map((c) => ({
                  value: c.name.toLowerCase(),
                  label: c.name,
                  color: c.color,
                })),
              ]}
            />

            {/* Wallet Filter */}
            <CustomSelect
              value={filterWallet}
              onChange={(v) => setFilterWallet(v)}
              className="w-36"
              placeholder="Semua Rekening"
              options={[
                { value: 'all', label: 'Semua Metode' },
                ...wallets.map((w) => ({
                  value: w.name,
                  label: w.name,
                  color: w.color,
                })),
              ]}
            />

            {/* Sort Dropdown */}
            <CustomSelect
              value={sortBy}
              onChange={(v) => setSortBy(v as any)}
              className="w-44"
              options={[
                { value: 'created_desc', label: 'Terbaru Ditambahkan' },
                { value: 'date_desc', label: 'Tanggal Terbaru' },
                { value: 'date_asc', label: 'Tanggal Terlama' },
                { value: 'amount_desc', label: 'Nominal Terbesar' },
                { value: 'amount_asc', label: 'Nominal Terkecil' },
              ]}
            />

            {/* CTA Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold hover:bg-[#222222] transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-black/5">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((t) => (
              <div
                key={t.id}
                className="py-3.5 flex items-center justify-between hover:bg-[#EDEFEB]/40 px-3 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                      t.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.type === 'transfer'
                        ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'bg-[#EDEFEB] text-[#111111]'
                    }`}
                  >
                    {t.type === 'income' ? (
                      <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    ) : t.type === 'transfer' ? (
                      <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                      {t.type === 'transfer' ? (
                        <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md text-[10px]">
                          {t.payment_method} → {t.to_payment_method || 'Dompet Lain'}
                        </span>
                      ) : (
                        <span className="font-semibold text-[#111111] bg-[#EDEFEB] px-2 py-0.5 rounded-md text-[10px]">
                          {t.payment_method}
                        </span>
                      )}
                      <span>•</span>
                      <span>{t.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        t.type === 'income'
                          ? 'text-emerald-600'
                          : t.type === 'transfer'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-[#111111]'
                      }`}
                    >
                      {t.type === 'income' ? '+' : t.type === 'transfer' ? '↔' : '-'} Rp {t.amount.toLocaleString('id-ID')}
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
              {searchQuery || filterDate || filterType !== 'all' || filterCategory !== 'all' || filterWallet !== 'all'
                ? 'Tidak ada transaksi yang cocok dengan filter yang dipilih.'
                : 'Belum ada transaksi. Klik Tambah untuk mulai mencatat.'}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-3 border-t border-black/5">
            <span className="text-xs font-medium text-[#7F847C]">
              Menampilkan <b className="text-[#111111]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</b> -{' '}
              <b className="text-[#111111]">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}
              </b>{' '}
              dari <b className="text-[#111111]">{filteredTransactions.length}</b> transaksi
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-black/10 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#EDEFEB] transition-colors flex items-center gap-1 text-[#111111]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all ${
                      currentPage === page
                        ? 'bg-[#111111] text-[#E4FF6B] shadow-xs'
                        : 'hover:bg-[#EDEFEB] text-[#111111]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-black/10 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#EDEFEB] transition-colors flex items-center gap-1 text-[#111111]"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#111111] text-[#E4FF6B]">
                  <CreditCard className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">Tambah Rekening / Dompet Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EDEFEB] text-[#7F847C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                  <CustomSelect
                    value={newWalletType}
                    onChange={(v) => setNewWalletType(v as any)}
                    options={[
                      { value: 'bank', label: 'Bank' },
                      { value: 'ewallet', label: 'E-Wallet' },
                      { value: 'cash', label: 'Tunai (Cash)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newWalletBalance}
                    onChange={(e) => setNewWalletBalance(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Warna Label</label>
                <div className="flex gap-2 flex-wrap pt-1">
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

              <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsWalletModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold text-[#111111]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold shadow-sm hover:opacity-90"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#111111] text-[#E4FF6B]">
                  <Tag className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">Tambah Kategori Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EDEFEB] text-[#7F847C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Investasi, Listrik, Donasi, Skin Care"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Tipe Kategori</label>
                <CustomSelect
                  value={newCatType}
                  onChange={(v) => setNewCatType(v as any)}
                  options={[
                    { value: 'expense', label: 'Pengeluaran (Expense)' },
                    { value: 'income', label: 'Pemasukan (Income)' },
                    { value: 'both', label: 'Keduanya (Pengeluaran & Pemasukan)' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Warna Label</label>
                <div className="flex gap-2 flex-wrap pt-1">
                  {['#FF8A00', '#0060AF', '#00AED6', '#10B981', '#9333EA', '#EC4899', '#EAB308', '#111111', '#7F847C'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        newCatColor === c ? 'scale-110 border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold text-[#111111]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold shadow-sm hover:opacity-90"
                >
                  Simpan Kategori
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
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#111111] text-[#E4FF6B]">
                  <Wallet className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">Atur Limit Budget Bulanan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#EDEFEB] text-[#7F847C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Kategori</label>
                <CustomSelect
                  value={editCategory}
                  onChange={(v) => setEditCategory(v)}
                  onAddNew={() => {
                    setIsBudgetModalOpen(false);
                    setIsCategoryModalOpen(true);
                  }}
                  addNewLabel="+ Tambah Kategori Baru"
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
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold shadow-sm hover:opacity-90"
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
            <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-[#111111] text-[#E4FF6B]">
                  <CreditCard className="w-4 h-4" />
                </span>
                <h3 className="text-base font-extrabold text-[#111111]">Edit Rekening / Saldo Dompet</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWallet(null)}
                className="p-1.5 rounded-full hover:bg-[#EDEFEB] text-[#7F847C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Hapus rekening ${editingWallet.name}?`)) {
                      await deleteWallet(editingWallet.id);
                      setEditingWallet(null);
                    }
                  }}
                  className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Rekening
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
                    className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold shadow-sm hover:opacity-90"
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
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EDEFEB] rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditTxType('expense');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    editTxType === 'expense'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-[#7F847C] hover:text-[#111111]'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditTxType('income');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    editTxType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-[#7F847C] hover:text-[#111111]'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditTxType('transfer');
                    setEditTxCategory('pemindahan dana');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    editTxType === 'transfer'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-[#7F847C] hover:text-[#111111]'
                  }`}
                >
                  Transfer / Pindah
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Deskripsi Transaksi</label>
                <input
                  type="text"
                  required
                  placeholder={
                    editTxType === 'transfer'
                      ? 'Contoh: Transfer BCA ke Jago, Topup GoPay'
                      : 'Contoh: Belanja Bulanan, Freelance project'
                  }
                  value={editTxTitle}
                  onChange={(e) => setEditTxTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#EDEFEB]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              {/* Amount & Date */}
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

              {editTxType === 'transfer' ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40">
                  <div>
                    <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1 uppercase">
                      Dari Dompet (Asal)
                    </label>
                    <CustomSelect
                      value={editTxPaymentMethod}
                      onChange={(v) => setEditTxPaymentMethod(v)}
                      options={wallets.map((w) => ({
                        value: w.name,
                        label: w.name,
                        sublabel: `Rp ${w.balance.toLocaleString('id-ID')}`,
                        color: w.color,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-1 uppercase">
                      Ke Dompet (Tujuan)
                    </label>
                    <CustomSelect
                      value={editTxToPaymentMethod}
                      onChange={(v) => setEditTxToPaymentMethod(v)}
                      options={wallets
                        .filter((w) => w.name.toLowerCase() !== editTxPaymentMethod.toLowerCase())
                        .map((w) => ({
                          value: w.name,
                          label: w.name,
                          sublabel: `Rp ${w.balance.toLocaleString('id-ID')}`,
                          color: w.color,
                        }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Metode Pembayaran</label>
                    <CustomSelect
                      value={editTxPaymentMethod}
                      onChange={(v) => setEditTxPaymentMethod(v)}
                      options={wallets.map((w) => ({
                        value: w.name,
                        label: w.name,
                        sublabel: `Rp ${w.balance.toLocaleString('id-ID')}`,
                        color: w.color,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Kategori</label>
                    <CustomSelect
                      value={editTxCategory}
                      onChange={(v) => setEditTxCategory(v)}
                      onAddNew={() => setIsCategoryModalOpen(true)}
                      addNewLabel="+ Tambah Kategori Baru"
                      options={categories
                        .filter((c) =>
                          editTxType === 'expense'
                            ? c.type === 'expense' || c.type === 'both'
                            : c.type === 'income' || c.type === 'both'
                        )
                        .map((c) => ({
                          value: c.name.toLowerCase(),
                          label: c.name,
                          color: c.color,
                        }))}
                    />
                  </div>
                </div>
              )}

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
