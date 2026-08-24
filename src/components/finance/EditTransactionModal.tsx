'use client';

import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Transaction, Wallet, CategoryItem } from '@/lib/types';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ModalWrapper } from '@/components/ui/ModalWrapper';

interface EditTransactionModalProps {
  transaction: Transaction;
  wallets: Wallet[];
  categories: CategoryItem[];
  onSave: (id: string, updates: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onOpenCategoryModal: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  wallets,
  categories,
  onSave,
  onDelete,
  onClose,
  onOpenCategoryModal,
}) => {
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction.type);
  const [category, setCategory] = useState(transaction.category.toLowerCase());
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(transaction.payment_method);
  const [toPaymentMethod, setToPaymentMethod] = useState(
    transaction.to_payment_method ||
    wallets.find((w) => w.name.toLowerCase() !== transaction.payment_method.toLowerCase())?.name || 'BCA'
  );
  const [date, setDate] = useState(transaction.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [isRecurring, setIsRecurring] = useState(!!transaction.is_recurring);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    let finalCategory = category;
    if (type === 'transfer') {
      finalCategory = 'pemindahan dana';
    } else if (category === 'lainnya' && customCategory.trim()) {
      finalCategory = customCategory.trim();
    }

    await onSave(transaction.id, {
      title,
      amount: parseFloat(amount),
      type,
      category: finalCategory,
      payment_method: paymentMethod,
      to_payment_method: type === 'transfer' ? toPaymentMethod : undefined,
      date,
      notes: notes || undefined,
      is_recurring: isRecurring,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (confirm(`Hapus transaksi "${transaction.title}"?`)) {
      await onDelete(transaction.id);
      onClose();
    }
  };

  const typeButtons: { key: 'expense' | 'income' | 'transfer'; label: string; activeClass: string }[] = [
    { key: 'expense', label: 'Pengeluaran', activeClass: 'bg-rose-500 text-white shadow-xs' },
    { key: 'income', label: 'Pemasukan', activeClass: 'bg-emerald-600 text-white shadow-xs' },
    { key: 'transfer', label: 'Transfer / Pindah', activeClass: 'bg-indigo-600 text-white shadow-xs' },
  ];

  const filteredCategories = categories.filter((c) =>
    type === 'expense' ? c.type === 'expense' || c.type === 'both'
    : c.type === 'income' || c.type === 'both'
  );

  return (
    <ModalWrapper isOpen={true} onClose={onClose} title="Edit Transaksi" icon={<Pencil className="w-4 h-4" />} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#EDEFEB] rounded-2xl">
          {typeButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => {
                setType(btn.key);
                if (btn.key === 'transfer') setCategory('pemindahan dana');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                type === btn.key ? btn.activeClass : 'text-[#7F847C] hover:text-[#111111]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div>
          <label className="label-field">Deskripsi Transaksi</label>
          <input
            type="text"
            required
            placeholder={type === 'transfer' ? 'Contoh: Transfer BCA ke Jago' : 'Contoh: Belanja Bulanan'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Nominal (Rp)</label>
            <input type="number" required min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-field">Tanggal</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          </div>
        </div>

        {type === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div>
              <label className="label-field !text-indigo-900">Dari Dompet (Asal)</label>
              <CustomSelect
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v)}
                options={wallets.map((w) => ({ value: w.name, label: w.name, sublabel: `Rp ${w.balance.toLocaleString('id-ID')}`, color: w.color }))}
              />
            </div>
            <div>
              <label className="label-field !text-indigo-900">Ke Dompet (Tujuan)</label>
              <CustomSelect
                value={toPaymentMethod}
                onChange={(v) => setToPaymentMethod(v)}
                options={wallets.filter((w) => w.name.toLowerCase() !== paymentMethod.toLowerCase()).map((w) => ({ value: w.name, label: w.name, sublabel: `Rp ${w.balance.toLocaleString('id-ID')}`, color: w.color }))}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Metode Pembayaran</label>
              <CustomSelect
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v)}
                options={wallets.map((w) => ({ value: w.name, label: w.name, sublabel: `Rp ${w.balance.toLocaleString('id-ID')}`, color: w.color }))}
              />
            </div>
            <div>
              <label className="label-field">Kategori</label>
              <CustomSelect
                value={category}
                onChange={(v) => setCategory(v)}
                onAddNew={onOpenCategoryModal}
                addNewLabel="+ Tambah Kategori Baru"
                options={filteredCategories.map((c) => ({ value: c.name.toLowerCase(), label: c.name, color: c.color }))}
              />
            </div>
          </div>
        )}

        {category === 'lainnya' && (
          <div>
            <label className="label-field">Nama Kategori Kustom</label>
            <input type="text" required placeholder="Masukkan nama kategori baru" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="input-field" />
          </div>
        )}

        <div>
          <label className="label-field">Catatan (Opsional)</label>
          <input type="text" placeholder="Catatan tambahan" value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="editTxRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-4 h-4 rounded text-[#111111] focus:ring-[#111111]" />
          <label htmlFor="editTxRecurring" className="text-xs font-semibold text-[#111111] cursor-pointer">
            Tandai sebagai transaksi rutin bulanan (Recurring)
          </label>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-black/5">
          <button type="button" onClick={handleDelete} className="btn-danger">
            <Trash2 className="w-3.5 h-3.5" /> Hapus Transaksi
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan Perubahan</button>
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
};
