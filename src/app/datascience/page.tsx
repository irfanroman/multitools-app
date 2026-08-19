'use client';

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import {
  LineChart as LineChartIcon,
  UploadCloud,
  FileSpreadsheet,
  Cpu,
  Code2,
  Plus,
  Trash2,
  Copy,
  Check,
  Play,
  BarChart3,
  ScatterChart as ScatterIcon,
  Layers,
  Sparkles,
  ArrowRight,
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
import confetti from 'canvas-confetti';
import { useDashboard } from '@/lib/DashboardContext';
import { TopHeader } from '@/components/layout/TopHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Dataset, MLExperiment, CodeSnippet } from '@/lib/types';

const SAMPLE_CSV_RAW = `age,studytime,failures,absences,G1,G2,G3
18,2,0,6,5,6,6
17,2,0,4,5,5,6
15,2,3,10,7,8,10
15,3,0,2,15,14,15
16,2,0,4,6,10,10
16,1,0,10,15,15,15
16,2,0,0,12,12,11
17,2,0,6,6,5,6
15,2,0,0,16,18,19
15,2,0,0,14,14,15
15,3,0,0,10,8,9
15,4,0,4,10,12,12
15,1,0,2,14,14,14
15,2,0,2,10,10,11
15,3,0,0,14,16,16
16,1,0,4,10,10,10
16,3,0,6,13,14,14
16,2,0,4,8,10,10
17,1,3,16,6,5,5
16,1,0,4,8,10,10`;

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

          // Generate column summaries
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
              columns_info: colInfo,
            },
            sample_data: rows.slice(0, 50),
          });

          confetti({ particleCount: 60, spread: 50 });
        }
        setIsUploading(false);
      },
    });
  };

  // Load sample dataset
  const handleLoadSampleDataset = () => {
    Papa.parse(SAMPLE_CSV_RAW, {
      header: true,
      dynamicTyping: true,
      complete: (res) => {
        const rows = res.data as any[];
        const cols = Object.keys(rows[0]);
        setCsvColumns(cols);
        setParsedData(rows);
        setXAxisCol('studytime');
        setYAxisCol('G3');
      },
    });
  };

  // Aggregate data for charting
  const chartData = useMemo(() => {
    if (!parsedData || parsedData.length === 0 || !xAxisCol || !yAxisCol) return [];

    const groupMap: Record<string, { x: any; sumY: number; count: number }> = {};
    parsedData.forEach((row) => {
      const xVal = row[xAxisCol];
      const yVal = typeof row[yAxisCol] === 'number' ? row[yAxisCol] : 1;
      if (xVal !== undefined && xVal !== null) {
        const key = String(xVal);
        if (!groupMap[key]) {
          groupMap[key] = { x: xVal, sumY: 0, count: 0 };
        }
        groupMap[key].sumY += yVal;
        groupMap[key].count += 1;
      }
    });

    return Object.values(groupMap)
      .map((g) => ({
        [xAxisCol]: g.x,
        [yAxisCol]: Number((g.sumY / g.count).toFixed(2)),
        count: g.count,
      }))
      .slice(0, 30);
  }, [parsedData, xAxisCol, yAxisCol]);

  // Copy code helper
  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save Experiment
  const handleSaveExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle) return;
    await addExperiment({
      title: expTitle,
      dataset_name: expDataset,
      model_type: expModel,
      parameters: { tuning: 'standard grid-search', cv_folds: 5 },
      metrics: {
        r2_score: parseFloat(expAccuracy || '0.85'),
        f1_score: parseFloat(expF1 || '0.80'),
        rmse: parseFloat(expRmse || '1.20'),
      },
      notes: expNotes,
    });
    setIsExpModalOpen(false);
    setExpTitle('');
    setExpNotes('');
    confetti({ particleCount: 50, spread: 50 });
  };

  // Save Snippet
  const handleSaveSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snipTitle || !snipCode) return;
    await addSnippet({
      title: snipTitle,
      language: snipLang,
      code: snipCode,
      tags: snipTags.split(',').map((t) => t.trim()),
      description: snipDesc,
    });
    setIsSnipModalOpen(false);
    setSnipTitle('');
    setSnipCode('');
    setSnipDesc('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <TopHeader
        title="Data Science Practice Corner"
        subtitle="Tempat latihan EDA, visualisasi dataset in-browser, logging eksperimen model ML, & snippet vault."
        badgeText="EDA & ML Lab"
      />

      {/* Row 1: Stat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          variant="dark"
          title="Datasets Uploaded"
          value={`${datasets.length} Dataset`}
          subtitle="Tersimpan di Supabase & siap dianalisis EDA"
          badgeText="Active Data"
          badgeType="lime"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setActiveTab('playground')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#E4FF6B] hover:underline"
            >
              Buka EDA Playground <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        <StatCard
          variant="lime"
          title="ML Experiments"
          value={`${experiments.length} Model Tracked`}
          subtitle="Model accuracy, F1-score & metrics tracker"
          badgeText="Model Ops"
          badgeType="dark"
          icon={<Cpu className="w-5 h-5" />}
          actionButton={
            <button
              onClick={() => setIsExpModalOpen(true)}
              className="text-xs font-bold text-black/80 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Catat Run Eksperimen Baru
            </button>
          }
        />

        <StatCard
          variant="white"
          title="Python / SQL Snippets"
          value={`${snippets.length} Code Snippets`}
          subtitle="Potongan kode analisis data siap pakai"
          badgeText="Code Vault"
          badgeType="neutral"
          icon={<Code2 className="w-5 h-5 text-[#111111]" />}
          actionButton={
            <button
              onClick={() => setIsSnipModalOpen(true)}
              className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1"
            >
              + Simpan Snippet Baru
            </button>
          }
        />
      </section>

      {/* Navigation Subtabs without emojis */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl border border-black/5 overflow-x-auto shadow-xs">
        {[
          { key: 'playground', label: 'Dataset Playground & EDA' },
          { key: 'experiments', label: 'ML Experiment Tracker' },
          { key: 'snippets', label: 'Python & SQL Code Vault' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all text-center ${
              activeTab === tab.key
                ? 'bg-[#111111] text-[#E4FF6B] shadow-md'
                : 'text-[#7F847C] hover:text-[#111111] hover:bg-[#EDEFEB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DATASET PLAYGROUND & EDA */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          {/* Uploader & Dataset Selector Header */}
          <div className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <span>Upload & Pilih Dataset CSV</span>
              </h3>
              <p className="text-xs text-[#7F847C]">
                Upload CSV langsung dari komputermu atau gunakan dataset latihan bawaan
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLoadSampleDataset}
                className="px-4 py-2 rounded-full bg-[#EDEFEB] hover:bg-[#111111] hover:text-[#E4FF6B] text-xs font-bold text-[#111111] transition-all"
              >
                Gunakan Sample (Student Data)
              </button>

              <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-extrabold cursor-pointer hover:bg-[#222222] transition-colors shadow-xs">
                <UploadCloud className="w-4 h-4" />
                <span>{isUploading ? 'Memproses...' : 'Upload CSV Baru'}</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* EDA Stats & Dynamic Chart Explorer */}
          {parsedData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Dynamic Chart Generator */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Dynamic EDA Chart Explorer</span>
                    </h3>

                    {/* Chart Type Toggle */}
                    <div className="flex bg-[#EDEFEB] p-1 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          chartType === 'bar' ? 'bg-[#111111] text-[#E4FF6B]' : 'text-[#7F847C]'
                        }`}
                      >
                        Bar (Rata-rata)
                      </button>
                      <button
                        onClick={() => setChartType('line')}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          chartType === 'line' ? 'bg-[#111111] text-[#E4FF6B]' : 'text-[#7F847C]'
                        }`}
                      >
                        Line Trend
                      </button>
                    </div>
                  </div>

                  {/* Axis Selectors */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#7F847C] uppercase mb-1">
                        Sumbu X (Kategori / Fitur)
                      </label>
                      <select
                        value={xAxisCol}
                        onChange={(e) => setXAxisCol(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#EDEFEB] text-xs font-bold border border-black/5"
                      >
                        {csvColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-[#7F847C] uppercase mb-1">
                        Sumbu Y (Target Numerik)
                      </label>
                      <select
                        value={yAxisCol}
                        onChange={(e) => setYAxisCol(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#EDEFEB] text-xs font-bold border border-black/5"
                      >
                        {csvColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Chart Render Canvas */}
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                          <XAxis dataKey={xAxisCol} stroke="#7F847C" fontSize={11} />
                          <YAxis stroke="#7F847C" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey={yAxisCol} fill="#111111" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                          <XAxis dataKey={xAxisCol} stroke="#7F847C" fontSize={11} />
                          <YAxis stroke="#7F847C" fontSize={11} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey={yAxisCol}
                            stroke="#111111"
                            strokeWidth={3}
                            dot={{ fill: '#E4FF6B', r: 5 }}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 text-[11px] text-[#7F847C] flex justify-between">
                  <span>Total baris dianalisis: <b>{parsedData.length} baris</b></span>
                  <span>Kolom terdeteksi: <b>{csvColumns.length} kolom</b></span>
                </div>
              </div>

              {/* Right Column (5 cols): Quick Stats Table & Sample Preview */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#111111] mb-2">Descriptive Column Stats</h3>
                  <p className="text-xs text-[#7F847C] mb-4">Statistik ringkas tipe data & missing values</p>

                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EDEFEB] text-[#7F847C] font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3 rounded-l-xl">Kolom</th>
                          <th className="py-2 px-3">Tipe</th>
                          <th className="py-2 px-3">Unique</th>
                          <th className="py-2 px-3 rounded-r-xl">Missing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {csvColumns.slice(0, 8).map((col) => {
                          const values = parsedData.map((r) => r[col]);
                          const isNum = typeof values[0] === 'number';
                          const uniqueCount = new Set(values).size;
                          const missing = values.filter((v) => v === null || v === undefined).length;
                          return (
                            <tr key={col} className="hover:bg-[#EDEFEB]/40 transition-colors">
                              <td className="py-2 px-3 font-bold text-[#111111]">{col}</td>
                              <td className="py-2 px-3 text-[#7F847C]">{isNum ? 'float/int' : 'string'}</td>
                              <td className="py-2 px-3 font-semibold">{uniqueCount}</td>
                              <td className="py-2 px-3">{missing === 0 ? '0' : missing}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-black/5">
                  <span className="text-[11px] font-bold text-[#7F847C] uppercase">
                    Sample 3 Baris Teratas:
                  </span>
                  <pre className="mt-1 p-3 rounded-2xl bg-[#EDEFEB] text-[10px] font-mono text-[#111111] overflow-x-auto">
                    {JSON.stringify(parsedData.slice(0, 3), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-black/5">
              <FileSpreadsheet className="w-10 h-10 text-[#7F847C] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#111111]">Belum ada dataset yang dimuat.</p>
              <button
                onClick={handleLoadSampleDataset}
                className="mt-3 px-4 py-2 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-bold"
              >
                Muat Dataset Latihan (Student Performance)
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ML EXPERIMENT TRACKER */}
      {activeTab === 'experiments' && (
        <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111]">Machine Learning Experiment Runs</h3>
              <p className="text-xs text-[#7F847C]">
                Dokumentasikan hyperparameter, model type, dan metrik akurasi / F1-score
              </p>
            </div>
            <button
              onClick={() => setIsExpModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-extrabold hover:bg-[#222222] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Run Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.length > 0 ? (
              experiments.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 rounded-3xl bg-[#EDEFEB]/50 border border-black/5 hover:border-black/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-black text-[#111111]">{exp.title}</h4>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#111111] text-[#E4FF6B]">
                        {exp.model_type}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#7F847C] font-semibold mb-3">
                      Dataset: {exp.dataset_name || 'Generic Dataset'} • Run on {exp.created_at}
                    </p>

                    {/* Metrics Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      {Object.entries(exp.metrics).map(([k, v]) => (
                        <div key={k} className="p-2 bg-white rounded-2xl border border-black/5 shadow-2xs">
                          <div className="text-[9px] text-[#7F847C] font-bold uppercase">{k}</div>
                          <div className="text-xs font-black text-[#111111]">{v}</div>
                        </div>
                      ))}
                    </div>

                    {exp.notes && (
                      <p className="text-xs text-[#111111]/80 leading-relaxed bg-white/60 p-3 rounded-2xl border border-black/5">
                        "{exp.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/5 flex justify-end">
                    <button
                      onClick={() => deleteExperiment(exp.id)}
                      className="text-[11px] text-[#7F847C] hover:text-rose-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Run
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center text-xs text-[#7F847C] bg-[#EDEFEB]/40 rounded-3xl border border-black/5">
                Belum ada eksperimen yang dicatat. Klik Log Run Baru untuk mulai.
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: CODE SNIPPET VAULT */}
      {activeTab === 'snippets' && (
        <section className="bg-white rounded-3xl p-6 border border-black/6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-[#111111]">Python & SQL Snippet Vault</h3>
              <p className="text-xs text-[#7F847C]">Potongan kode yang sering dipakai ulang dalam proyek data</p>
            </div>
            <button
              onClick={() => setIsSnipModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] text-[#E4FF6B] text-xs font-extrabold hover:bg-[#222222] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Snippet</span>
            </button>
          </div>

          <div className="space-y-4">
            {snippets.length > 0 ? (
              snippets.map((sn) => (
                <div
                  key={sn.id}
                  className="rounded-3xl bg-[#111111] text-white p-5 border border-black/20 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{sn.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4FF6B] text-[#111111] uppercase">
                        {sn.language}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(sn.code, sn.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                      >
                        {copiedId === sn.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === sn.id ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => deleteSnippet(sn.id)}
                        className="p-1.5 text-white/50 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {sn.description && <p className="text-xs text-white/70">{sn.description}</p>}

                  <pre className="p-4 rounded-2xl bg-[#181818] border border-white/10 text-xs font-mono text-[#E4FF6B] overflow-x-auto leading-relaxed">
                    <code>{sn.code}</code>
                  </pre>

                  <div className="flex gap-1.5 flex-wrap">
                    {sn.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#7F847C] bg-[#EDEFEB]/40 rounded-3xl border border-black/5">
                Belum ada snippet tersimpan. Klik Tambah Snippet di atas.
              </div>
            )}
          </div>
        </section>
      )}

      {/* New Experiment Modal */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-[#111111] mb-4">Catat Run Eksperimen ML</h3>
            <form onSubmit={handleSaveExperiment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Judul Eksperimen</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tuning XGBoost Hyperparameters"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Model Type</label>
                  <select
                    value={expModel}
                    onChange={(e) => setExpModel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none"
                  >
                    <option value="RandomForestRegressor">Random Forest</option>
                    <option value="XGBClassifier">XGBoost</option>
                    <option value="LightGBM">LightGBM</option>
                    <option value="LogisticRegression">Logistic Regression</option>
                    <option value="PyTorchNeuralNet">Neural Network (PyTorch)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Dataset</label>
                  <input
                    type="text"
                    placeholder="Student Performance"
                    value={expDataset}
                    onChange={(e) => setExpDataset(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#7F847C] uppercase">Accuracy / R2</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expAccuracy}
                    onChange={(e) => setExpAccuracy(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-[#EDEFEB]/50 border border-black/5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#7F847C] uppercase">F1-Score</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expF1}
                    onChange={(e) => setExpF1(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-[#EDEFEB]/50 border border-black/5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#7F847C] uppercase">RMSE</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expRmse}
                    onChange={(e) => setExpRmse(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-[#EDEFEB]/50 border border-black/5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Catatan Eksperimen</label>
                <textarea
                  rows={3}
                  placeholder="Catat parameter kunci atau insight hasil prediksi..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold"
                >
                  Simpan Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Snippet Modal */}
      {isSnipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-[#111111] mb-4">Tambah Code Snippet Baru</h3>
            <form onSubmit={handleSaveSnippet} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Judul Snippet</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Missing Value Imputation Pipeline"
                  value={snipTitle}
                  onChange={(e) => setSnipTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Bahasa</label>
                  <select
                    value={snipLang}
                    onChange={(e) => setSnipLang(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none"
                  >
                    <option value="python">Python</option>
                    <option value="sql">SQL</option>
                    <option value="r">R</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Tags (Koma)</label>
                  <input
                    type="text"
                    placeholder="pandas, preprocessing"
                    value={snipTags}
                    onChange={(e) => setSnipTags(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-[#EDEFEB]/50 border border-black/5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7F847C] mb-1 uppercase">Kode Program</label>
                <textarea
                  required
                  rows={5}
                  placeholder="def impute_missing(df): ..."
                  value={snipCode}
                  onChange={(e) => setSnipCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSnipModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-[#EDEFEB] text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-[#111111] text-[#E4FF6B] text-xs font-extrabold"
                >
                  Simpan Snippet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
