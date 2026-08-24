'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  FileSpreadsheet,
  Cpu,
  Code2,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { Dataset } from '@/lib/types';
import { DatasetViewer } from '@/components/datascience/DatasetViewer';
import { ExperimentCard } from '@/components/datascience/ExperimentCard';
import { CodeSnippetBlock } from '@/components/datascience/CodeSnippetBlock';

export default function DataSciencePage() {
  const {
    datasets,
    experiments,
    snippets,
    addDataset,
    deleteDataset,
    addExperiment,
    deleteExperiment,
    addSnippet,
    deleteSnippet,
  } = useDashboard();

  const [activeTab, setActiveTab] = useState<'playground' | 'experiments' | 'snippets'>('playground');

  // CSV Playground state
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(datasets[0] || null);
  const [parsedData, setParsedData] = useState<any[]>(datasets[0]?.sample_data || []);
  const [csvColumns, setCsvColumns] = useState<string[]>(['age', 'studytime', 'failures', 'absences', 'G1', 'G2', 'G3']);
  const [xAxisCol, setXAxisCol] = useState<string>('studytime');
  const [yAxisCol, setYAxisCol] = useState<string>('G3');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [isUploading, setIsUploading] = useState(false);

  // New Experiment Modal state
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expModel, setExpModel] = useState('RandomForestRegressor');
  const [expDataset, setExpDataset] = useState('Student Performance');
  const [expAccuracy, setExpAccuracy] = useState('0.88');
  const [expF1, setExpF1] = useState('0.86');
  const [expRmse, setExpRmse] = useState('1.25');
  const [expNotes, setExpNotes] = useState('');

  // New Snippet Modal state
  const [isSnipModalOpen, setIsSnipModalOpen] = useState(false);
  const [snipTitle, setSnipTitle] = useState('');
  const [snipLang, setSnipLang] = useState('python');
  const [snipCode, setSnipCode] = useState('');
  const [snipTags, setSnipTags] = useState('pandas, eda');
  const [snipDesc, setSnipDesc] = useState('');

  // Handle CSV file upload & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        if (rows.length > 0) {
          const cols = Object.keys(rows[0]);
          setCsvColumns(cols);
          setParsedData(rows);
          setXAxisCol(cols[0] || '');
          setYAxisCol(cols[1] || cols[0] || '');

          const colInfo = cols.map((col) => {
            const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined);
            const isNum = typeof values[0] === 'number';
            const numVals = isNum ? (values as number[]) : [];
            const mean = isNum && numVals.length > 0 ? numVals.reduce((a, b) => a + b, 0) / numVals.length : undefined;
            const min = isNum && numVals.length > 0 ? Math.min(...numVals) : undefined;
            const max = isNum && numVals.length > 0 ? Math.max(...numVals) : undefined;

            return {
              name: col,
              type: isNum ? 'numeric' : 'categorical',
              missing: rows.length - values.length,
              unique: new Set(values).size,
              mean: mean ? Number(mean.toFixed(2)) : undefined,
              min,
              max,
            };
          });

          await addDataset({
            name: file.name.replace(/\.[^/.]+$/, ''),
            file_name: file.name,
            file_size: file.size,
            row_count: rows.length,
            column_count: cols.length,
            summary_stats: {
              numeric_cols: colInfo.filter((c) => c.type === 'numeric').map((c) => c.name),
              categorical_cols: colInfo.filter((c) => c.type === 'categorical').map((c) => c.name),
              columns_info: colInfo,
            },
            sample_data: rows.slice(0, 20),
          });

          confetti({ particleCount: 50, spread: 50 });
        }
        setIsUploading(false);
      },
    });
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle) return;

    await addExperiment({
      title: expTitle,
      dataset_name: expDataset,
      model_type: expModel,
      parameters: { random_state: 42, max_depth: 10 },
      metrics: {
        Accuracy: parseFloat(expAccuracy || '0.85'),
        'F1-Score': parseFloat(expF1 || '0.83'),
        RMSE: parseFloat(expRmse || '1.12'),
      },
      notes: expNotes || undefined,
    });

    setIsExpModalOpen(false);
    setExpTitle('');
    setExpNotes('');
    confetti({ particleCount: 60, spread: 60 });
  };

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snipTitle || !snipCode) return;

    await addSnippet({
      title: snipTitle,
      language: snipLang,
      code: snipCode,
      tags: snipTags.split(',').map((t) => t.trim()).filter(Boolean),
      description: snipDesc || undefined,
    });

    setIsSnipModalOpen(false);
    setSnipTitle('');
    setSnipCode('');
    setSnipDesc('');
    confetti({ particleCount: 50, spread: 45 });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <TopHeader
        title="Data Science & ML Corner"
        subtitle="Eksplorasi CSV interaktif, pelacak eksperimen machine learning, & repositori snippet kode."
        badgeText="Data Science Lab"
      />

      {/* Row 1: Stat Cards */}
      <section className="stat-grid">
        <StatCard
          variant="dark"
          title="Datasets Explored"
          value={`${datasets.length} File Aktif`}
          subtitle="File CSV tersimpan di database local"
          badgeText="EDA Engine"
          badgeType="lime"
          icon={<FileSpreadsheet className="w-5 h-5 text-[#E4FF6B]" />}
          actionButton={
            <button
              onClick={() => setActiveTab('playground')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E4FF6B] hover:underline"
            >
              Upload / Eksplorasi Data →
            </button>
          }
        />

        <StatCard
          variant="lime"
          title="Model Runs & Experiment"
          value={`${experiments.length} Runs Logged`}
          subtitle="Pelacakan performa metrik (Accuracy, F1, RMSE)"
          badgeText="MLflow Light"
          badgeType="dark"
          icon={<Cpu className="w-5 h-5 text-[#111111]" />}
          actionButton={
            <button
              onClick={() => setIsExpModalOpen(true)}
              className="text-xs font-bold text-black/80 hover:underline flex items-center gap-1"
            >
              + Log Run Baru
            </button>
          }
        />

        <StatCard
          variant="white"
          title="Python & SQL Vault"
          value={`${snippets.length} Snippets`}
          subtitle="Koleksi boilerplate EDA & ML pipeline"
          badgeText="Code Vault"
          badgeType="neutral"
          icon={<Code2 className="w-5 h-5 text-[#111111]" />}
          actionButton={
            <button
              onClick={() => setIsSnipModalOpen(true)}
              className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1"
            >
              + Tambah Snippet
            </button>
          }
        />
      </section>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-black/5 overflow-x-auto shadow-xs">
        {[
          { key: 'playground', label: 'CSV Playground & EDA' },
          { key: 'experiments', label: 'ML Experiment Tracker' },
          { key: 'snippets', label: 'Code Snippets Vault' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all text-center ${
              activeTab === tab.key
                ? 'bg-[#111111] text-[#E4FF6B] shadow-md shadow-black/10'
                : 'text-[#7F847C] hover:text-[#111111] hover:bg-[#EDEFEB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: CSV Playground */}
      {activeTab === 'playground' && (
        <DatasetViewer
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelectDataset={(d) => {
            setSelectedDataset(d);
            if (d.sample_data && d.sample_data.length > 0) {
              setParsedData(d.sample_data);
              setCsvColumns(Object.keys(d.sample_data[0]));
            }
          }}
          parsedData={parsedData}
          csvColumns={csvColumns}
          xAxisCol={xAxisCol}
          onXAxisChange={setXAxisCol}
          yAxisCol={yAxisCol}
          onYAxisChange={setYAxisCol}
          chartType={chartType}
          onChartTypeChange={setChartType}
          isUploading={isUploading}
          onFileUpload={handleFileUpload}
          onDeleteDataset={deleteDataset}
        />
      )}

      {/* Tab 2: Experiments */}
      {activeTab === 'experiments' && (
        <section className="card-base space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="section-title">Riwayat Eksperimen Model ML</h3>
              <p className="section-subtitle">Daftar run perbandingan arsitektur model dan metrik evaluasi</p>
            </div>
            <button onClick={() => setIsExpModalOpen(true)} className="btn-primary">
              <Plus className="w-3.5 h-3.5" />
              <span>Log Run Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiments.map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} onDelete={deleteExperiment} />
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Code Snippets */}
      {activeTab === 'snippets' && (
        <section className="card-base space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="section-title">Python, SQL, & R Code Vault</h3>
              <p className="section-subtitle">Simpan dan copy snippet reusable untuk pipeline data science</p>
            </div>
            <button onClick={() => setIsSnipModalOpen(true)} className="btn-primary">
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Snippet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snippets.map((snip) => (
              <CodeSnippetBlock key={snip.id} snippet={snip} onDelete={deleteSnippet} />
            ))}
          </div>
        </section>
      )}

      {/* New Experiment Modal */}
      <ModalWrapper
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title="Log Model Run Baru"
        icon={<Cpu className="w-4 h-4" />}
      >
        <form onSubmit={handleCreateExperiment} className="space-y-3.5">
          <div>
            <label className="label-field">Judul Eksperimen / Run</label>
            <input type="text" required placeholder="Contoh: Student Performance Prediction" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Model Type</label>
              <input type="text" required placeholder="RandomForest, XGBoost, LightGBM" value={expModel} onChange={(e) => setExpModel(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Dataset Name</label>
              <input type="text" required placeholder="Student Performance Dataset" value={expDataset} onChange={(e) => setExpDataset(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label-field">Accuracy</label>
              <input type="number" step="0.01" min="0" max="1" value={expAccuracy} onChange={(e) => setExpAccuracy(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">F1-Score</label>
              <input type="number" step="0.01" min="0" max="1" value={expF1} onChange={(e) => setExpF1(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">RMSE / Loss</label>
              <input type="number" step="0.01" min="0" value={expRmse} onChange={(e) => setExpRmse(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-field">Catatan (Hyperparameters / Insights)</label>
            <textarea rows={3} placeholder="max_depth=10, n_estimators=100..." value={expNotes} onChange={(e) => setExpNotes(e.target.value)} className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
            <button type="button" onClick={() => setIsExpModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan Run</button>
          </div>
        </form>
      </ModalWrapper>

      {/* New Snippet Modal */}
      <ModalWrapper
        isOpen={isSnipModalOpen}
        onClose={() => setIsSnipModalOpen(false)}
        title="Simpan Code Snippet Baru"
        icon={<Code2 className="w-4 h-4" />}
      >
        <form onSubmit={handleCreateSnippet} className="space-y-3.5">
          <div>
            <label className="label-field">Judul Snippet</label>
            <input type="text" required placeholder="Contoh: Remove Outliers with IQR Method" value={snipTitle} onChange={(e) => setSnipTitle(e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Bahasa</label>
              <select value={snipLang} onChange={(e) => setSnipLang(e.target.value)} className="input-field">
                <option value="python">Python</option>
                <option value="sql">SQL</option>
                <option value="r">R</option>
              </select>
            </div>
            <div>
              <label className="label-field">Tags (Koma terpisah)</label>
              <input type="text" placeholder="eda, preprocessing, pandas" value={snipTags} onChange={(e) => setSnipTags(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="label-field">Deskripsi</label>
            <input type="text" placeholder="Fungsi untuk membersihkan outlier pada dataframe" value={snipDesc} onChange={(e) => setSnipDesc(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-field">Code Body</label>
            <textarea required rows={6} placeholder="def remove_outliers(df, col):..." value={snipCode} onChange={(e) => setSnipCode(e.target.value)} className="input-field font-mono text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
            <button type="button" onClick={() => setIsSnipModalOpen(false)} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Simpan Snippet</button>
          </div>
        </form>
      </ModalWrapper>
    </div>
  );
}
