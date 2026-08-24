'use client';

import React from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  BarChart3,
  ScatterChart as ScatterIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Dataset } from '@/lib/types';

interface DatasetViewerProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (d: Dataset) => void;
  parsedData: any[];
  csvColumns: string[];
  xAxisCol: string;
  onXAxisChange: (col: string) => void;
  yAxisCol: string;
  onYAxisChange: (col: string) => void;
  chartType: 'bar' | 'line';
  onChartTypeChange: (type: 'bar' | 'line') => void;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDataset: (id: string) => Promise<void>;
}

export const DatasetViewer: React.FC<DatasetViewerProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  parsedData,
  csvColumns,
  xAxisCol,
  onXAxisChange,
  yAxisCol,
  onYAxisChange,
  chartType,
  onChartTypeChange,
  isUploading,
  onFileUpload,
}) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upload Zone & Dataset Selector */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Dropzone */}
        <div className="lg:col-span-6 card-base flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="heading-sm flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#111111]" />
                <span>Upload CSV Dataset Baru</span>
              </h3>
              <span className="badge badge-dark">In-Browser EDA</span>
            </div>
            <p className="section-subtitle mb-4">
              Upload file CSV untuk eksplorasi statistik instan, deteksi missing value, dan visualisasi interaktif.
            </p>

            <label className="border-2 border-dashed border-black/10 hover:border-black/30 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#EDEFEB]/40 hover:bg-[#EDEFEB]/70">
              <UploadCloud className={`w-8 h-8 text-[#111111] mb-2 ${isUploading ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold text-[#111111] mb-1">
                {isUploading ? 'Memproses dataset...' : 'Klik atau Drag & Drop file CSV di sini'}
              </span>
              <span className="text-[10px] text-[#7F847C]">Mendukung format .csv standar (Header otomatis terdeteksi)</span>
              <input
                type="file"
                accept=".csv"
                onChange={onFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Dataset Library */}
        <div className="lg:col-span-6 card-base flex flex-col justify-between">
          <div>
            <h3 className="heading-sm mb-2">Pustaka Dataset ({datasets.length})</h3>
            <p className="section-subtitle mb-4">Pilih dataset yang ingin dieksplorasi</p>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {datasets.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onSelectDataset(d)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedDataset?.id === d.id
                      ? 'bg-[#111111] text-white border-black shadow-xs'
                      : 'card-muted text-[#111111] hover:bg-[#EDEFEB]'
                  }`}
                >
                  <div className="truncate">
                    <h4 className="text-xs font-black truncate">{d.name}</h4>
                    <span className={`text-[10px] ${selectedDataset?.id === d.id ? 'text-white/60' : 'text-[#7F847C]'}`}>
                      {d.row_count} baris • {d.column_count} kolom • {(d.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <span
                    className={`badge text-[9px] ${
                      selectedDataset?.id === d.id ? 'badge-lime' : 'badge-neutral'
                    }`}
                  >
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Chart Section */}
      {parsedData.length > 0 && (
        <section className="card-base space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="section-title">Visualisasi Interaktif Kolom</h3>
              <p className="section-subtitle">Pilih sumbu X dan Y untuk analisis korelasi</p>
            </div>

            <div className="filter-bar">
              <div>
                <span className="label-field text-[10px]">Sumbu X:</span>
                <select
                  value={xAxisCol}
                  onChange={(e) => onXAxisChange(e.target.value)}
                  className="input-filter text-xs"
                >
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="label-field text-[10px]">Sumbu Y:</span>
                <select
                  value={yAxisCol}
                  onChange={(e) => onYAxisChange(e.target.value)}
                  className="input-filter text-xs"
                >
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 pt-3 sm:pt-0">
                <button
                  type="button"
                  onClick={() => onChartTypeChange('bar')}
                  className={`p-2 rounded-xl border transition-all ${
                    chartType === 'bar' ? 'bg-[#111111] text-[#E4FF6B] border-black' : 'btn-secondary'
                  }`}
                  title="Bar Chart"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChartTypeChange('line')}
                  className={`p-2 rounded-xl border transition-all ${
                    chartType === 'line' ? 'bg-[#111111] text-[#E4FF6B] border-black' : 'btn-secondary'
                  }`}
                  title="Line Chart"
                >
                  <ScatterIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={parsedData.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey={xAxisCol} stroke="#7F847C" fontSize={10} />
                  <YAxis stroke="#7F847C" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey={yAxisCol} fill="#111111" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={parsedData.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey={xAxisCol} stroke="#7F847C" fontSize={10} />
                  <YAxis stroke="#7F847C" fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey={yAxisCol} stroke="#111111" strokeWidth={2} dot={{ fill: '#E4FF6B', r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Dataset Preview Table */}
      {parsedData.length > 0 && (
        <section className="card-base space-y-4">
          <h3 className="heading-sm">
            Pratinjau Data Mentah (Menampilkan 10 baris pertama)
          </h3>
          <div className="table-scroll rounded-2xl border border-black/5">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EDEFEB] text-[#111111] uppercase font-extrabold text-[10px]">
                <tr>
                  <th className="p-3">#</th>
                  {csvColumns.map((col) => (
                    <th key={col} className="p-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-mono text-[11px]">
                {parsedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#EDEFEB]/40">
                    <td className="p-3 font-sans font-bold text-[#7F847C]">{idx + 1}</td>
                    {csvColumns.map((col) => (
                      <td key={col} className="p-3">{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
