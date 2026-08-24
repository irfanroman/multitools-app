'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Repeat, Pencil, Trash2 } from 'lucide-react';
import { Transaction } from '@/lib/types';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction: t, onEdit, onDelete }) => {
  const iconBg =
    t.type === 'income' ? 'bg-emerald-100 text-emerald-800'
    : t.type === 'transfer' ? 'bg-indigo-100 text-indigo-700'
    : 'bg-[#EDEFEB] text-[#111111]';

  const amountColor =
    t.type === 'income' ? 'text-emerald-600'
    : t.type === 'transfer' ? 'text-indigo-600'
    : 'text-[#111111]';

  const prefix = t.type === 'income' ? '+' : t.type === 'transfer' ? '↔' : '-';

  return (
    <div className="tx-row">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {t.type === 'income' ? (
            <ArrowDownRight className="w-5 h-5 text-emerald-600" />
          ) : t.type === 'transfer' ? (
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
          ) : (
            <ArrowUpRight className="w-5 h-5 text-rose-500" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#111111] truncate">{t.title}</span>
            {t.is_recurring && (
              <span className="badge badge-dark">
                <Repeat className="w-2.5 h-2.5" /> Recurring
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#7F847C] mt-0.5 flex-wrap">
            <span className="capitalize">{t.category}</span>
            <span>•</span>
            {t.type === 'transfer' ? (
              <span className="badge badge-indigo text-[10px]">
                {t.payment_method} → {t.to_payment_method || 'Dompet Lain'}
              </span>
            ) : (
              <span className="font-semibold text-[#111111] bg-[#EDEFEB] px-2 py-0.5 rounded-md text-[10px]">
                {t.payment_method}
              </span>
            )}
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{t.date}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className="text-right">
          <span className={`text-sm font-black ${amountColor}`}>
            {prefix} Rp {t.amount.toLocaleString('id-ID')}
          </span>
          {t.notes && <p className="text-[10px] text-[#7F847C] max-w-[150px] truncate">{t.notes}</p>}
          <span className="text-[10px] text-[#7F847C] sm:hidden block">{t.date}</span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(t)} title="Edit" className="btn-icon">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(t.id)} title="Hapus" className="btn-icon-danger">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
