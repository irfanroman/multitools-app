'use client';

import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Sparkles,
  CreditCard,
  Tag,
} from 'lucide-react';
import { Transaction, CategoryItem } from '@/lib/types';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CapsuleProgress } from '@/components/ui/CapsuleProgress';
import { QuickAddModal } from '@/components/ui/QuickAddModal';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { Pagination } from '@/components/ui/Pagination';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { TransactionRow } from '@/components/finance/TransactionRow';
import { TransactionFilters } from '@/components/finance/TransactionFilters';
import { WalletCard } from '@/components/finance/WalletCard';
import { ExpenseDonutChart, CashFlowChart } from '@/components/charts/lazy';
import { EditTransactionModal } from '@/components/finance/EditTransactionModal';

const ITEMS_PER_PAGE = 10;

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

const WALLET_COLORS = ['#FF5E00', '#0060AF', '#00AED6', '#10B981', '#9333EA', '#111111'];
const CATEGORY_COLOR_OPTIONS = ['#FF8A00', '#0060AF', '#00AED6', '#10B981', '#9333EA', '#EC4899', '#EAB308', '#111111', '#7F847C'];

export default function FinancePage() {
  const {
    wallets, categories, transactions, budgets,
    deleteTransaction, updateTransaction,
    addWallet, updateWallet, deleteWallet,
    updateBudget, addCategory, streaks,
  } = useDashboard();

  // UI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any | null>(null);

  // Filters & pagination
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState<'created_desc' | 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('created_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income' | 'both'>('expense');
  const [newCatColor, setNewCatColor] = useState('#FF8A00');
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'bank' | 'ewallet' | 'cash'>('bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newWalletColor, setNewWalletColor] = useState('#FF5E00');
  const [editWalletName, setEditWalletName] = useState('');
  const [editWalletBalance, setEditWalletBalance] = useState('');
  const [editBudgetCategory, setEditBudgetCategory] = useState('makan');
  const [editBudgetLimit, setEditBudgetLimit] = useState('2000000');

  // Reset page on filter change
  React.useEffect(() => { setCurrentPage(1); }, [filterType, filterCategory, filterWallet, filterDate, sortBy, searchQuery]);

  /* ------------------------------------------------------------------
   * Month rollup — ONE pass over transactions.
   *
   * Previously `currentMonthTx` was rebuilt unmemoised on every render, so
   * its identity changed each time and invalidated the `donutData` memo that
   * depended on it. Totals then walked the list twice more, and the budget
   * loop below walked it once per budget row (O(budgets x transactions)).
   * ------------------------------------------------------------------ */
  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + (w.balance || 0), 0),
    [wallets]
  );

  const { totalExpense, totalIncome, spentByCategory } = useMemo(() => {
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
      totalExpense: expense,
      totalIncome: income,
      spentByCategory: byCategory,
    };
  }, [transactions]);

  const financeStreak = useMemo(
    () => streaks.find((s) => s.module === 'finance')?.current_streak || 0,
    [streaks]
  );

  // Filtered & sorted transactions
  const filteredTransactions = useMemo(() => {
    // Hoisted out of the predicate: these were recomputed for every row.
    const q = searchQuery.trim().toLowerCase();
    const walletKey = filterWallet.toLowerCase();

    // Decorate-sort-undecorate: parsing `created_at` inside the comparator ran
    // O(n log n) Date constructions; this does O(n) and sorts on numbers.
    const decorated: { t: Transaction; ts: number }[] = [];

    for (const t of transactions) {
      if (filterType !== 'all' && t.type !== filterType) continue;
      if (filterCategory !== 'all' && t.category !== filterCategory) continue;
      if (filterDate && t.date !== filterDate) continue;

      if (filterWallet !== 'all') {
        const fromMatch = t.payment_method.toLowerCase() === walletKey;
        const toMatch = t.type === 'transfer' && t.to_payment_method?.toLowerCase() === walletKey;
        if (!fromMatch && !toMatch) continue;
      }

      if (q) {
        const hit =
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.payment_method.toLowerCase().includes(q) ||
          (t.to_payment_method?.toLowerCase().includes(q) ?? false);
        if (!hit) continue;
      }

      decorated.push({ t, ts: t.created_at ? Date.parse(t.created_at) || 0 : 0 });
    }

    switch (sortBy) {
      case 'created_desc':
        decorated.sort((a, b) => b.ts - a.ts || (b.t.id || '').localeCompare(a.t.id || ''));
        break;
      case 'date_desc':
        decorated.sort((a, b) => b.t.date.localeCompare(a.t.date) || b.ts - a.ts);
        break;
      case 'date_asc':
        decorated.sort((a, b) => a.t.date.localeCompare(b.t.date) || a.ts - b.ts);
        break;
      case 'amount_desc':
        decorated.sort((a, b) => b.t.amount - a.t.amount);
        break;
      case 'amount_asc':
        decorated.sort((a, b) => a.t.amount - b.t.amount);
        break;
    }

    return decorated.map((d) => d.t);
  }, [transactions, filterType, filterCategory, filterWallet, filterDate, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Chart data
  const donutData = useMemo(() => {
    // Index categories once instead of a linear find() per slice.
    const colorByName = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.color] as const)
    );
    return Array.from(spentByCategory, ([name, value]) => ({
      name,
      value,
      color: colorByName.get(name) || CATEGORY_COLORS[name] || '#7F847C',
    }));
  }, [spentByCategory, categories]);

  const areaData = useMemo(() => {
    // Keyed on the full date: the old MM-DD key merged the same day across
    // different years into one bucket.
    const byDay = new Map<string, { key: string; date: string; income: number; expense: number }>();

    for (const t of transactions) {
      let bucket = byDay.get(t.date);
      if (!bucket) {
        bucket = { key: t.date, date: t.date.slice(5), income: 0, expense: 0 };
        byDay.set(t.date, bucket);
      }
      if (t.type === 'income') bucket.income += t.amount;
      else bucket.expense += t.amount;
    }

    // Sort the buckets (<= 365) rather than the whole transaction list.
    return Array.from(byDay.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  const spendingInsight = useMemo(() => {
    if (totalExpense === 0 && totalIncome === 0) return 'Belum ada transaksi yang tercatat bulan ini. Catat transaksi baru untuk melihat analisis kesehatan finansialmu.';
    const topCategory = donutData.length > 0 ? [...donutData].sort((a, b) => b.value - a.value)[0] : null;
    const netSavings = totalIncome - totalExpense;
    const savingRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    let text = `Bulan ini kamu mencatat total pengeluaran Rp ${totalExpense.toLocaleString('id-ID')} dengan total pemasukan Rp ${totalIncome.toLocaleString('id-ID')} (Saving Rate: ${savingRate}%). `;
    if (topCategory) text += `Pos pengeluaran terbesar adalah ${topCategory.name.toUpperCase()} (${Math.round((topCategory.value / totalExpense) * 100)}% dari total). `;
    if (savingRate >= 30) text += 'Kesehatan finansial sangat stabil (di atas rekomendasi 20-30% saving rate).';
    else if (savingRate >= 0) text += 'Arus kas positif. Tetap monitor pengeluaran rutin.';
    else text += 'Pengeluaran bulan ini melebihi pemasukan. Tinjau pos sekunder untuk menjaga arus kas.';
    return text;
  }, [totalExpense, totalIncome, donutData]);

  // Handlers
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName) return;
    await addWallet({ name: newWalletName, type: newWalletType, balance: parseFloat(newWalletBalance || '0'), color: newWalletColor, icon: newWalletType === 'bank' ? 'credit-card' : 'wallet' });
    setIsWalletModalOpen(false);
    setNewWalletName('');
    setNewWalletBalance('');
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBudgetLimit) return;
    await updateBudget(editBudgetCategory, parseFloat(editBudgetLimit));
    setIsBudgetModalOpen(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory({ name: newCatName.trim(), type: newCatType, color: newCatColor });
    setIsCategoryModalOpen(false);
    setNewCatName('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <TopHeader title="Finance & Cashflow" subtitle="Manajemen saldo multi-rekening, budget capsule, dan riwayat transaksi." badgeText="Personal Finance" />

      {/* Stat Cards */}
      <section className="stat-grid">
        <StatCard variant="dark" title="Total Saldo Tersedia" value={`Rp ${totalBalance.toLocaleString('id-ID')}`} subtitle="Total akumulasi semua dompet & rekening" badgeText="Active Net Worth" badgeType="lime" icon={<Wallet className="w-5 h-5" />}
          actionButton={<button onClick={() => setIsWalletModalOpen(true)} className="inline-flex items-center gap-1 text-xs font-bold text-[#E4FF6B] hover:underline"><Plus className="w-3.5 h-3.5" /> Tambah Rekening</button>}
        />
        <StatCard variant="lime" title="Pemasukan Bulan Ini" value={`Rp ${totalIncome.toLocaleString('id-ID')}`} subtitle={`Selisih Kas: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}`} badgeText="+ Cash Inflow" badgeType="dark" icon={<TrendingUp className="w-5 h-5" />}
          actionButton={<button onClick={() => setIsAddModalOpen(true)} className="text-xs font-bold text-black/80 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Catat Pemasukan</button>}
        />
        <StatCard variant="white" title="Pengeluaran Bulan Ini" value={`Rp ${totalExpense.toLocaleString('id-ID')}`} subtitle={`Streak Pencatatan: ${financeStreak} Hari`} badgeText={`${financeStreak}d Streak`} badgeType="neutral" icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
          actionButton={<button onClick={() => setIsBudgetModalOpen(true)} className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1">Atur Limit Budget Kategori →</button>}
        />
      </section>

      {/* Wallets */}
      <section className="card-base">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#111111]" />
            <h2 className="heading-sm">Metode Pembayaran & Saldo Dompet</h2>
          </div>
          <button onClick={() => setIsWalletModalOpen(true)} className="btn-pill btn-pill-neutral">
            <Plus className="w-3.5 h-3.5" /> Tambah Metode
          </button>
        </div>
        <div className="wallet-grid">
          {wallets.map((w) => (
            <WalletCard key={w.id} wallet={w} onEdit={(w) => { setEditingWallet(w); setEditWalletName(w.name); setEditWalletBalance(String(w.balance)); }} />
          ))}
        </div>
      </section>

      {/* Charts & Budget Capsules */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ExpenseDonutChart data={donutData} />
        </div>

        <div className="lg:col-span-7 card-base flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="heading-sm flex items-center gap-2"><Wallet className="w-4 h-4" /> Capsule Budget Progress</h3>
              <p className="section-subtitle">Limit & pemakaian per kategori</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCategoryModalOpen(true)} className="btn-pill btn-pill-neutral"><Plus className="w-3 h-3" /> Tambah Kategori</button>
              <button onClick={() => setIsBudgetModalOpen(true)} className="btn-primary text-[11px]">Edit Budget</button>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {budgets.map((b) => (
              <CapsuleProgress
                key={b.id}
                label={b.category}
                spent={b.spent ?? spentByCategory.get(b.category.toLowerCase()) ?? 0}
                limit={b.limit_amount}
                orientation="horizontal"
              />
            ))}
          </div>

          <CashFlowChart data={areaData} />
        </div>
      </section>

      {/* Smart Insight */}
      <section className="p-4 sm:p-6 rounded-3xl bg-[#111111] text-white border border-black/10 shadow-xl flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-[#E4FF6B] text-[#111111] shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-extrabold text-white">Smart Financial Insight</h3>
            <span className="badge bg-white/10 text-[#E4FF6B]">Auto-Analyst</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">{spendingInsight}</p>
        </div>
      </section>

      {/* Transaction History */}
      <section className="card-base">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="section-title">Riwayat Transaksi</h3>
            <p className="section-subtitle">Total {filteredTransactions.length} transaksi • Halaman {currentPage} dari {totalPages}</p>
          </div>
          <TransactionFilters
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            filterDate={filterDate} onFilterDateChange={setFilterDate}
            filterType={filterType} onFilterTypeChange={setFilterType}
            filterCategory={filterCategory} onFilterCategoryChange={setFilterCategory}
            filterWallet={filterWallet} onFilterWalletChange={setFilterWallet}
            sortBy={sortBy} onSortChange={setSortBy}
            categories={categories} wallets={wallets}
            onAddClick={() => setIsAddModalOpen(true)}
          />
        </div>

        <div className="tx-list">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} onEdit={setEditingTx} onDelete={deleteTransaction} />
            ))
          ) : (
            <div className="py-12 text-center section-subtitle">
              {searchQuery || filterDate || filterType !== 'all' || filterCategory !== 'all' || filterWallet !== 'all'
                ? 'Tidak ada transaksi yang cocok dengan filter.'
                : 'Belum ada transaksi. Klik Tambah untuk mulai mencatat.'}
            </div>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredTransactions.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
      </section>

      {/* Modals */}
      {isAddModalOpen && <QuickAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} defaultTab="finance" />}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          wallets={wallets}
          categories={categories}
          onSave={updateTransaction}
          onDelete={deleteTransaction}
          onClose={() => setEditingTx(null)}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
        />
      )}

      {/* Add Wallet Modal */}
      <ModalWrapper isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} title="Tambah Rekening / Dompet Baru" icon={<CreditCard className="w-4 h-4" />}>
        <form onSubmit={handleCreateWallet} className="space-y-4">
          <div>
            <label className="label-field">Nama Rekening / Dompet</label>
            <input type="text" required placeholder="Contoh: Bank Jago, BCA, GoPay, Cash" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Tipe</label>
              <CustomSelect value={newWalletType} onChange={(v) => setNewWalletType(v as any)} options={[{ value: 'bank', label: 'Bank' }, { value: 'ewallet', label: 'E-Wallet' }, { value: 'cash', label: 'Tunai (Cash)' }]} />
            </div>
            <div>
              <label className="label-field">Saldo Awal (Rp)</label>
              <input type="number" min="0" placeholder="0" value={newWalletBalance} onChange={(e) => setNewWalletBalance(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-field">Warna Label</label>
            <ColorPicker colors={WALLET_COLORS} selected={newWalletColor} onChange={setNewWalletColor} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
            <button type="button" onClick={() => setIsWalletModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan Dompet</button>
          </div>
        </form>
      </ModalWrapper>

      {/* Add Category Modal */}
      <ModalWrapper isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Tambah Kategori Baru" icon={<Tag className="w-4 h-4" />}>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="label-field">Nama Kategori</label>
            <input type="text" required placeholder="Contoh: Investasi, Listrik, Donasi" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-field">Tipe Kategori</label>
            <CustomSelect value={newCatType} onChange={(v) => setNewCatType(v as any)} options={[{ value: 'expense', label: 'Pengeluaran (Expense)' }, { value: 'income', label: 'Pemasukan (Income)' }, { value: 'both', label: 'Keduanya' }]} />
          </div>
          <div>
            <label className="label-field">Warna Label</label>
            <ColorPicker colors={CATEGORY_COLOR_OPTIONS} selected={newCatColor} onChange={setNewCatColor} />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
            <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan Kategori</button>
          </div>
        </form>
      </ModalWrapper>

      {/* Edit Budget Modal */}
      <ModalWrapper isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} title="Atur Limit Budget Bulanan" icon={<Wallet className="w-4 h-4" />}>
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div>
            <label className="label-field">Kategori</label>
            <CustomSelect value={editBudgetCategory} onChange={(v) => setEditBudgetCategory(v)} onAddNew={() => { setIsBudgetModalOpen(false); setIsCategoryModalOpen(true); }} addNewLabel="+ Tambah Kategori Baru" options={categories.filter((c) => c.type === 'expense' || c.type === 'both').map((c) => ({ value: c.name.toLowerCase(), label: c.name, color: c.color }))} />
          </div>
          <div>
            <label className="label-field">Limit Bulanan (Rp)</label>
            <input type="number" required min="0" step="any" placeholder="Contoh: 2000000" value={editBudgetLimit} onChange={(e) => setEditBudgetLimit(e.target.value)} className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
            <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan Limit</button>
          </div>
        </form>
      </ModalWrapper>

      {/* Edit Wallet Modal */}
      <ModalWrapper isOpen={!!editingWallet} onClose={() => setEditingWallet(null)} title="Edit Rekening / Saldo Dompet" icon={<CreditCard className="w-4 h-4" />}>
        <form onSubmit={async (e) => { e.preventDefault(); await updateWallet(editingWallet.id, { name: editWalletName, balance: parseFloat(editWalletBalance || '0') }); setEditingWallet(null); }} className="space-y-4">
          <div>
            <label className="label-field">Nama Rekening / Dompet</label>
            <input type="text" required value={editWalletName} onChange={(e) => setEditWalletName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-field">Saldo Saat Ini (Rp)</label>
            <input type="number" min="0" step="1000" required value={editWalletBalance} onChange={(e) => setEditWalletBalance(e.target.value)} className="input-field" />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-black/5">
            <button type="button" onClick={async () => { if (confirm(`Hapus rekening ${editingWallet?.name}?`)) { await deleteWallet(editingWallet.id); setEditingWallet(null); } }} className="btn-danger">Hapus Rekening</button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingWallet(null)} className="btn-secondary">Batal</button>
              <button type="submit" className="btn-primary">Simpan Saldo</button>
            </div>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}
