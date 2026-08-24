'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession } from '@/lib/types';

interface PomodoroTabProps {
  studySessions: StudySession[];
  onLogStudySession: (session: Omit<StudySession, 'id'>) => Promise<void>;
}

export const PomodoroTab: React.FC<PomodoroTabProps> = ({
  studySessions,
  onLogStudySession,
}) => {
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState('Machine Learning');
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      if (timerMode === 'work') {
        onLogStudySession({
          subject: timerSubject,
          duration_minutes: 25,
          date: new Date().toISOString().split('T')[0],
          notes: 'Pomodoro focus session completed',
        });
        alert('Sesi Pomodoro 25 Menit Selesai! Waktunya istirahat sejenak.');
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        alert('Istirahat selesai! Siap untuk sesi belajar berikutnya?');
        setTimerMode('work');
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode, timerSubject, onLogStudySession]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section className="max-w-md mx-auto card-dark p-6 sm:p-8 text-center space-y-6">
      <div className="flex items-center justify-between">
        <span className="p-2 rounded-2xl bg-white/10 text-[#E4FF6B]">
          <Clock className="w-5 h-5" />
        </span>
        <span
          className={`badge font-bold ${
            timerMode === 'work' ? 'badge-lime' : 'bg-emerald-400 text-[#111111]'
          }`}
        >
          {timerMode === 'work' ? 'Focus Sprint (25m)' : 'Break (5m)'}
        </span>
      </div>

      <div>
        <label className="label-field !text-white/50 mb-2">
          Subjek Belajar Saat Ini:
        </label>
        <select
          value={timerSubject}
          onChange={(e) => setTimerSubject(e.target.value)}
          className="input-field bg-white/10 text-white font-bold text-xs border border-white/10"
        >
          <option value="Machine Learning" className="bg-[#111111]">Machine Learning</option>
          <option value="Linear Algebra" className="bg-[#111111]">Linear Algebra</option>
          <option value="Data Mining & EDA" className="bg-[#111111]">Data Mining & EDA</option>
          <option value="Deep Learning & PyTorch" className="bg-[#111111]">Deep Learning & PyTorch</option>
        </select>
      </div>

      <div className="py-4">
        <div className="text-6xl sm:text-7xl font-black tracking-tighter text-[#E4FF6B] font-mono tabular-nums">
          {formatTime(timerSeconds)}
        </div>
        <p className="text-xs text-white/60 mt-2">
          {isTimerRunning ? 'Fokus berjalan... Tetap semangat!' : 'Tekan tombol play untuk mulai'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIsTimerRunning(!isTimerRunning)}
          className="w-14 h-14 rounded-full bg-[#E4FF6B] text-[#111111] flex items-center justify-center font-black shadow-lg shadow-lime-500/20 hover:scale-105 active:scale-95 transition-transform"
        >
          {isTimerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>
        <button
          onClick={() => {
            setIsTimerRunning(false);
            setTimerSeconds(timerMode === 'work' ? 25 * 60 : 5 * 60);
          }}
          title="Reset Timer"
          className="p-3.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-4 border-t border-white/10 text-left">
        <span className="label-field !text-white/60">Riwayat Sesi Terakhir:</span>
        <div className="space-y-1.5 mt-2">
          {studySessions.length > 0 ? (
            studySessions.slice(0, 2).map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/5 text-white/80"
              >
                <span className="font-semibold">{s.subject}</span>
                <span className="text-white/50">{s.duration_minutes} menit • {s.date}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-white/40">Belum ada riwayat sesi hari ini.</p>
          )}
        </div>
      </div>
    </section>
  );
};
