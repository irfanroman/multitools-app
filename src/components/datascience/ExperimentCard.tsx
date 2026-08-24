'use client';

import React from 'react';
import { Cpu, Trash2 } from 'lucide-react';
import { MLExperiment } from '@/lib/types';

interface ExperimentCardProps {
  experiment: MLExperiment;
  onDelete: (id: string) => Promise<void>;
}

export const ExperimentCard: React.FC<ExperimentCardProps> = ({
  experiment: exp,
  onDelete,
}) => {
  return (
    <div className="card-muted flex flex-col justify-between space-y-4 hover:border-black/20 transition-all">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#111111] text-[#E4FF6B]">
              <Cpu className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-black text-[#111111]">{exp.title}</h4>
          </div>
          <button
            onClick={() => onDelete(exp.id)}
            className="btn-icon-danger p-1"
            title="Hapus Run"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="section-subtitle">Model:</span>
            <span className="font-bold text-[#111111]">{exp.model_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="section-subtitle">Dataset:</span>
            <span className="font-semibold text-[#111111]">{exp.dataset_name || 'Custom'}</span>
          </div>
          <div className="flex justify-between">
            <span className="section-subtitle">Tanggal Run:</span>
            <span className="section-subtitle">{exp.created_at}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-3 mt-3 border-t border-subtle text-center">
          {Object.entries(exp.metrics).map(([metricKey, metricVal]) => (
            <div key={metricKey} className="p-1.5 rounded-xl bg-white border border-subtle shadow-2xs">
              <span className="text-[9px] font-bold text-muted uppercase block">{metricKey}</span>
              <span className="text-xs font-black text-[#111111]">{metricVal}</span>
            </div>
          ))}
        </div>

        {exp.notes && (
          <p className="text-[11px] text-muted italic mt-3 bg-white/50 p-2 rounded-xl border border-subtle">
            "{exp.notes}"
          </p>
        )}
      </div>
    </div>
  );
};
