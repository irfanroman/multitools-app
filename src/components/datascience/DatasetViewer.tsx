'use client';

import React, { useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  BarChart3,
  ScatterChart as ScatterIcon,
} from 'lucide-react';
import { DatasetChart } from '@/components/charts/lazy';
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
  uploadError?: string | null;
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
  uploadError,
  onFileUpload,
}) => {
  // Only the first 10 rows are rendered; slicing here keeps the table body
  // from rebuilding its identity on every parent render.
  const previewRows = useMemo(() => parsedData.slice(0, 10), [parsedData]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upload Zone & Dataset Selector */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Dropzone */}
        <div className="lg:col-span-6 card-base flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="heading-sm flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Upload CSV Dataset Baru</span>
              </h3>
              <span className="badge badge-dark">In-Browser EDA</span>
            </div>
            <p className="section-subtitle mb-4">
              Upload file CSV untuk eksplorasi statistik instan, deteksi missing value, dan visualisasi interaktif.
            </p>

            <label className="dropzone">
              <UploadCloud className={`w-8 h-8 mb-2 ${isUploading ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold mb-1">
                {isUploading ? 'Memproses dataset...' : 'Klik atau Drag & Drop file CSV di sini'}
              </span>
              <span className="text-[10px] text-muted">Mendukung format .csv standar (Header otomatis terdeteksi)</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={onFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>

            {uploadError && (
              <p role="alert" className="mt-3 text-xs font-bold text-rose-500">
                {uploadError}
              </p>
            )}
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
                      ? 'tile-selected'
                      : 'card-muted tile-selectable'
                  }`}
                >
                  <div className="truncate">
                    <h4 className="text-xs font-black truncate">{d.name}</h4>
                    <span className={`text-[10px] ${selectedDataset?.id === d.id ? 'opacity-70' : 'text-muted'}`}>
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
                    chartType === 'bar' ? 'btn-primary !p-2' : 'btn-secondary !p-2'
                  }`}
                  title="Bar Chart"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChartTypeChange('line')}
                  className={`p-2 rounded-xl border transition-all ${
                    chartType === 'line' ? 'btn-primary !p-2' : 'btn-secondary !p-2'
                  }`}
                  title="Line Chart"
                >
                  <ScatterIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <DatasetChart
            data={parsedData}
            xAxisCol={xAxisCol}
            yAxisCol={yAxisCol}
            chartType={chartType}
          />
        </section>
      )}

      {/* Dataset Preview Table */}
      {parsedData.length > 0 && (
        <section className="card-base space-y-4">
          <h3 className="heading-sm">
            Pratinjau Data Mentah (Menampilkan 10 baris pertama)
          </h3>
          <div className="table-scroll rounded-2xl border border-subtle">
            <table className="w-full text-xs text-left">
              <thead className="bg-subtle uppercase font-extrabold text-[10px]">
                <tr>
                  <th className="p-3">#</th>
                  {csvColumns.map((col) => (
                    <th key={col} className="p-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle font-mono text-[11px]">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className="row-hover">
                    <td className="p-3 font-sans font-bold text-muted">{idx + 1}</td>
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
