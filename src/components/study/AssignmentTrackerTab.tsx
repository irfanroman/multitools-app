'use client';

import React from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Assignment } from '@/lib/types';

interface AssignmentTrackerTabProps {
  assignments: Assignment[];
  onToggleAssignment: (id: string) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onOpenQuickAdd: () => void;
}

export const AssignmentTrackerTab: React.FC<AssignmentTrackerTabProps> = ({
  assignments,
  onToggleAssignment,
  onDeleteAssignment,
  onOpenQuickAdd,
}) => {
  return (
    <section className="card-base space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="section-title">Daftar Tugas & Deadline Kuliah</h3>
          <p className="section-subtitle">Pantau progress tugas dan tenggat waktu mata kuliah</p>
        </div>
        <button onClick={onOpenQuickAdd} className="btn-primary">
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tugas</span>
        </button>
      </div>

      <div className="item-list">
        {assignments.length > 0 ? (
          assignments.map((a) => (
            <div
              key={a.id}
              className="py-4 flex items-center justify-between hover:bg-[#EDEFEB]/30 px-3 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleAssignment(a.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    a.status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-black/20 hover:border-black'
                  }`}
                >
                  {a.status === 'completed' && <Check className="w-4 h-4" />}
                </button>

                <div>
                  <h4
                    className={`text-sm font-bold ${
                      a.status === 'completed' ? 'line-through text-[#7F847C]' : 'text-[#111111]'
                    }`}
                  >
                    {a.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#7F847C] mt-0.5 flex-wrap">
                    <span className="font-semibold text-[#111111]">{a.subject}</span>
                    <span>•</span>
                    <span>
                      Due: {new Date(a.due_date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    a.priority === 'high'
                      ? 'bg-rose-100 text-rose-700'
                      : a.priority === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {a.priority.toUpperCase()}
                </span>

                <button
                  onClick={() => onDeleteAssignment(a.id)}
                  className="btn-icon-danger p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center section-subtitle">
            Belum ada tugas tercatat. Klik tombol Tambah Tugas di atas.
          </div>
        )}
      </div>
    </section>
  );
};
