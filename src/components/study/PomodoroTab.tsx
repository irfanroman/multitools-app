'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  // Replaces alert(), which blocks the main thread and stops the timer UI.
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // `onLogStudySession` can change identity across renders; refs keep the tick
  // effect from resubscribing because of it.
  const logRef = useRef(onLogStudySession);
  const modeRef = useRef(timerMode);
  const subjectRef = useRef(timerSubject);
  const secondsRef = useRef(timerSeconds);

  // Synced after commit — writing a ref during render is unsafe under
  // concurrent rendering.
  useEffect(() => {
    logRef.current = onLogStudySession;
    modeRef.current = timerMode;
    subjectRef.current = timerSubject;
    secondsRef.current = timerSeconds;
  }, [onLogStudySession, timerMode, timerSubject, timerSeconds]);

  /**
   * One interval for the whole run, with completion handled inside the tick.
   *
   * The previous effect listed `timerSeconds` as a dependency, so every tick
   * cleared and recreated the interval — 1500 teardown/setup cycles across a
   * 25-minute session, each one re-anchoring the clock and adding drift.
   */
  useEffect(() => {
    if (!isTimerRunning) return;

    const id = setInterval(() => {
      const next = secondsRef.current - 1;

      if (next > 0) {
        secondsRef.current = next;
        setTimerSeconds(next);
        return;
      }

      // Reached zero: stop, log, and roll over to the next phase.
      secondsRef.current = 0;
      setIsTimerRunning(false);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });

      if (modeRef.current === 'work') {
        void logRef.current({
          subject: subjectRef.current,
          duration_minutes: 25,
          date: new Date().toISOString().slice(0, 10),
          notes: 'Pomodoro focus session completed',
        });
        setStatusMessage('Sesi Pomodoro 25 menit selesai. Waktunya istirahat sejenak.');
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        setStatusMessage('Istirahat selesai. Siap untuk sesi belajar berikutnya?');
        setTimerMode('work');
        setTimerSeconds(25 * 60);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [isTimerRunning]);

  const formatTime = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

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

      {statusMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#E4FF6B]/15 border border-[#E4FF6B]/30 text-left"
        >
          <span className="text-xs font-bold text-[#E4FF6B]">{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[10px] font-black text-white/60 hover:text-white shrink-0"
          >
            TUTUP
          </button>
        </div>
      )}

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
            const reset = timerMode === 'work' ? 25 * 60 : 5 * 60;
            setIsTimerRunning(false);
            secondsRef.current = reset;
            setTimerSeconds(reset);
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
