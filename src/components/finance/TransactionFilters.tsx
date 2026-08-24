'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Wallet, CategoryItem } from '@/lib/types';

type SortBy = 'created_desc' | 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
type FilterType = 'all' | 'income' | 'expense' | 'transfer';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  filterDate: string;
  onFilterDateChange: (v: string) => void;
  filterType: FilterType;
  onFilterTypeChange: (v: FilterType) => void;
  filterCategory: string;
  onFilterCategoryChange: (v: string) => void;
  filterWallet: string;
  onFilterWalletChange: (v: string) => void;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;
  categories: CategoryItem[];
  wallets: Wallet[];
  onAddClick: () => void;
}

const TransactionFiltersImpl: React.FC<TransactionFiltersProps> = ({
  searchQuery, onSearchChange,
  filterDate, onFilterDateChange,
  filterType, onFilterTypeChange,
  filterCategory, onFilterCategoryChange,
  filterWallet, onFilterWalletChange,
  sortBy, onSortChange,
  categories, wallets,
  onAddClick,
}) => {
  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Cari transaksi..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="input-filter w-32 sm:w-40 filter-full"
      />

      <div className="relative flex items-center">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => onFilterDateChange(e.target.value)}
          className="input-filter cursor-pointer"
          title="Filter berdasarkan tanggal"
        />
        {filterDate && (
          <button
            type="button"
            onClick={() => onFilterDateChange('')}
            title="Hapus filter tanggal"
            className="absolute right-2 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <CustomSelect
        value={filterType}
        onChange={(v) => onFilterTypeChange(v as FilterType)}
        className="w-32"
        options={[
          { value: 'all', label: 'Semua Tipe' },
          { value: 'income', label: 'Pemasukan (+)' },
          { value: 'expense', label: 'Pengeluaran (-)' },
          { value: 'transfer', label: 'Pemindahan (↔)' },
        ]}
      />

      <CustomSelect
        value={filterCategory}
        onChange={(v) => onFilterCategoryChange(v)}
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

      <CustomSelect
        value={filterWallet}
        onChange={(v) => onFilterWalletChange(v)}
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

      <CustomSelect
        value={sortBy}
        onChange={(v) => onSortChange(v as SortBy)}
        className="w-44"
        options={[
          { value: 'created_desc', label: 'Terbaru Ditambahkan' },
          { value: 'date_desc', label: 'Tanggal Terbaru' },
          { value: 'date_asc', label: 'Tanggal Terlama' },
          { value: 'amount_desc', label: 'Nominal Terbesar' },
          { value: 'amount_asc', label: 'Nominal Terkecil' },
        ]}
      />

      <button onClick={onAddClick} className="btn-primary filter-full">
        <Plus className="w-3.5 h-3.5" />
        <span>Tambah</span>
      </button>
    </div>
  );
};

export const TransactionFilters = React.memo(TransactionFiltersImpl);
