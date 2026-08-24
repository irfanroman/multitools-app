'use client';

import React, { useMemo } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Assignment } from '@/lib/types';

// One formatter for the whole list. `toLocaleDateString` with an options
// object constructs a fresh Intl.DateTimeFormat per row, per render.
const DUE_FMT = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

interface AssignmentTrackerTabProps {
  assignments: Assignment[];
  onToggleAssignment: (id: string) => Promise<void>;
  onDeleteAssignment: (id: string) => Promise<void>;
  onOpenQuickAdd: () => void;
}

const AssignmentTrackerTabImpl: React.FC<AssignmentTrackerTabProps> = ({
  assignments,
  onToggleAssignment,
  onDeleteAssignment,
  onOpenQuickAdd,
}) => {
  // Pre-format once per assignments change instead of on every render.
  const rows = useMemo(
    () =>
      assignments.map((a) => {
        const due = new Date(a.due_date);
        return {
          a,
          dueLabel: Number.isNaN(due.getTime()) ? a.due_date : DUE_FMT.format(due),
        };
      }),
    [assignments]
  );

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
        {rows.length > 0 ? (
          rows.map(({ a, dueLabel }) => (
            <div
              key={a.id}
              className="py-4 flex items-center justify-between row-hover px-3 rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleAssignment(a.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    a.status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-black/20 dark:border-white/25 hover:border-black dark:hover:border-white'
                  }`}
                >
                  {a.status === 'completed' && <Check className="w-4 h-4" />}
                </button>

                <div>
                  <h4
                    className={`text-sm font-bold ${
                      a.status === 'completed' ? 'line-through text-muted' : ''
                    }`}
                  >
                    {a.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted mt-0.5 flex-wrap">
                    <span className="font-semibold text-current">{a.subject}</span>
                    <span>•</span>
                    <span>Due: {dueLabel}</span>
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

export const AssignmentTrackerTab = React.memo(AssignmentTrackerTabImpl);
