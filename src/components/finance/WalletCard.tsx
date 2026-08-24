'use client';

import React from 'react';
import { Wallet } from '@/lib/types';

interface WalletCardProps {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet: w, onEdit }) => {
  return (
    <div className="card-muted hover:border-black/20 transition-all flex flex-col justify-between group relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-[#7F847C] uppercase tracking-wider truncate">{w.name}</span>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/10"
            style={{ backgroundColor: w.color || '#111111' }}
          />
          <button
            onClick={() => onEdit(w)}
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
  );
};
