'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { supabase } from './supabaseClient';
import {
  Wallet,
  CategoryItem,
  Transaction,
  Budget,
  Streak,
  Note,
  Flashcard,
  Assignment,
  StudySession,
  Dataset,
  MLExperiment,
  CodeSnippet,
  JournalEntry,
} from './types';
import {
  INITIAL_WALLETS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_STREAKS,
  INITIAL_NOTES,
  INITIAL_FLASHCARDS,
  INITIAL_ASSIGNMENTS,
  INITIAL_STUDY_SESSIONS,
  INITIAL_DATASETS,
  INITIAL_EXPERIMENTS,
  INITIAL_SNIPPETS,
  INITIAL_JOURNAL_ENTRIES,
} from './mockData';

/* ------------------------------------------------------------------ *
 * Context shape
 *
 * Split into two contexts on purpose:
 *   - DashboardDataContext  changes whenever any row changes
 *   - DashboardActionsContext  never changes after mount
 *
 * A component that only dispatches (modals, forms, buttons) subscribes to
 * the actions context and is therefore immune to data re-renders. With a
 * single merged context every consumer re-rendered on every keystroke that
 * touched any slice of state.
 * ------------------------------------------------------------------ */

interface DashboardData {
  wallets: Wallet[];
  categories: CategoryItem[];
  transactions: Transaction[];
  budgets: Budget[];
  streaks: Streak[];
  notes: Note[];
  flashcards: Flashcard[];
  assignments: Assignment[];
  studySessions: StudySession[];
  datasets: Dataset[];
  experiments: MLExperiment[];
  snippets: CodeSnippet[];
  journalEntries: JournalEntry[];
  isLoading: boolean;
  isOnline: boolean;
}

interface DashboardActions {
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addWallet: (w: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  updateBudget: (category: string, limit_amount: number) => Promise<void>;
  addCategory: (c: Omit<CategoryItem, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  triggerStreak: (module: 'finance' | 'study' | 'journal' | 'overall') => void;
  addNote: (note: Omit<Note, 'id' | 'created_at'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addFlashcard: (fc: Omit<Flashcard, 'id'>) => Promise<void>;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  reviewFlashcard: (id: string, performance: 'easy' | 'medium' | 'hard') => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  addAssignment: (a: Omit<Assignment, 'id'>) => Promise<void>;
  toggleAssignment: (id: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  logStudySession: (session: Omit<StudySession, 'id'>) => Promise<void>;
  addDataset: (d: Omit<Dataset, 'id' | 'uploaded_at'>) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  addExperiment: (e: Omit<MLExperiment, 'id' | 'created_at'>) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
  addSnippet: (s: Omit<CodeSnippet, 'id' | 'created_at'>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'created_at'>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DashboardDataContext = createContext<DashboardData | null>(null);
const DashboardActionsContext = createContext<DashboardActions | null>(null);

/* ------------------------------------------------------------------ *
 * localStorage helpers
 * ------------------------------------------------------------------ */

const LS_CATEGORIES = 'dashboard_custom_categories';
const LS_DELETED_TX = 'dashboard_deleted_tx_ids';

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — in-memory state is still correct */
  }
}

/** Case-insensitive union by `name`, first occurrence wins. O(n) via a Set. */
function mergeCategoriesByName(...groups: CategoryItem[][]): CategoryItem[] {
  const seen = new Set<string>();
  const out: CategoryItem[] = [];
  for (const group of groups) {
    for (const c of group) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Lazy initialisers run once. The old code did this work twice: once here
  // and again in a mount effect that recomputed the identical value.
  const [wallets, setWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [categories, setCategories] = useState<CategoryItem[]>(() =>
    mergeCategoriesByName(INITIAL_CATEGORIES, readJSON<CategoryItem[]>(LS_CATEGORIES, []))
  );
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const deleted = readJSON<string[]>(LS_DELETED_TX, []);
    if (deleted.length === 0) return INITIAL_TRANSACTIONS;
    const gone = new Set(deleted);
    return INITIAL_TRANSACTIONS.filter((t) => !gone.has(t.id));
  });

  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [streaks, setStreaks] = useState<Streak[]>(INITIAL_STREAKS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(INITIAL_FLASHCARDS);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [studySessions, setStudySessions] = useState<StudySession[]>(INITIAL_STUDY_SESSIONS);
  const [datasets, setDatasets] = useState<Dataset[]>(INITIAL_DATASETS);
  const [experiments, setExperiments] = useState<MLExperiment[]>(INITIAL_EXPERIMENTS);
  const [snippets, setSnippets] = useState<CodeSnippet[]>(INITIAL_SNIPPETS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);

  /* Mirrors of state for use inside callbacks, so the callbacks can stay
     dependency-free (stable identity) without reading stale values.
     Synced in an effect rather than during render: writing a ref while
     rendering is unsafe under concurrent React, and every reader here runs
     after commit (event handlers and async continuations). */
  const walletsRef = useRef(wallets);
  const transactionsRef = useRef(transactions);

  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  /* ---------------------------------------------------------------- *
   * Fetch — all 13 tables in parallel.
   *
   * The previous implementation awaited each query in sequence, so the
   * dashboard cost 13 sequential round-trips (~1.5-4s on mobile networks).
   * Promise.allSettled issues them concurrently and tolerates missing
   * tables individually instead of aborting the whole refresh.
   * ---------------------------------------------------------------- */
  const refreshAll = useCallback(async () => {
    setIsLoading(true);

    const deleted = new Set(readJSON<string[]>(LS_DELETED_TX, []));

    const q = <T,>(build: () => PromiseLike<{ data: T[] | null }>) =>
      Promise.resolve(build()).then(
        (r) => r.data ?? null,
        () => null
      );

    try {
      const [
        wData, tData, bData, sData, nData, fcData, aData,
        ssData, dData, expData, snData, jData, catData,
      ] = await Promise.all([
        q<Wallet>(() => supabase.from('wallets').select('*')),
        q<Transaction>(() =>
          supabase.from('transactions').select('*').order('created_at', { ascending: false })
        ),
        q<Budget>(() => supabase.from('budgets').select('*')),
        q<Streak>(() => supabase.from('streaks').select('*')),
        q<Note>(() => supabase.from('notes').select('*').order('created_at', { ascending: false })),
        q<Flashcard>(() => supabase.from('flashcards').select('*')),
        q<Assignment>(() =>
          supabase.from('assignments').select('*').order('due_date', { ascending: true })
        ),
        q<StudySession>(() => supabase.from('study_sessions').select('*')),
        q<Dataset>(() =>
          supabase.from('datasets').select('*').order('uploaded_at', { ascending: false })
        ),
        q<MLExperiment>(() =>
          supabase.from('ml_experiments').select('*').order('created_at', { ascending: false })
        ),
        q<CodeSnippet>(() =>
          supabase.from('code_snippets').select('*').order('created_at', { ascending: false })
        ),
        q<JournalEntry>(() =>
          supabase.from('journal_entries').select('*').order('date', { ascending: false })
        ),
        q<CategoryItem>(() => supabase.from('categories').select('*')),
      ]);

      if (wData?.length) setWallets(wData);
      if (bData?.length) setBudgets(bData);
      if (sData?.length) setStreaks(sData);
      if (nData?.length) setNotes(nData);
      if (fcData?.length) setFlashcards(fcData);
      if (aData?.length) setAssignments(aData);
      if (ssData?.length) setStudySessions(ssData);
      if (dData?.length) setDatasets(dData);
      if (expData?.length) setExperiments(expData);
      if (snData?.length) setSnippets(snData);
      if (jData?.length) setJournalEntries(jData);

      if (tData) {
        setTransactions(deleted.size ? tData.filter((t) => !deleted.has(t.id)) : tData);
      } else if (deleted.size) {
        setTransactions((prev) => prev.filter((t) => !deleted.has(t.id)));
      }

      setCategories(
        mergeCategoriesByName(
          INITIAL_CATEGORIES,
          readJSON<CategoryItem[]>(LS_CATEGORIES, []),
          catData ?? []
        )
      );

      setIsOnline(true);
    } catch (err) {
      console.warn('Using offline/local state:', err);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Only hit the network when a session actually exists; on the login screen
     this saves 13 requests that RLS would reject anyway. */
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) refreshAll();
      else setIsLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') refreshAll();
      if (event === 'SIGNED_OUT') setIsOnline(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [refreshAll]);

  /* ---------------------------------------------------------------- *
   * Streaks
   * ---------------------------------------------------------------- */
  const triggerStreak = useCallback((module: 'finance' | 'study' | 'journal' | 'overall') => {
    const today = todayISO();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    setStreaks((prev) => {
      let changed = false;

      const next = prev.map((s) => {
        if (s.module !== module && s.module !== 'overall') return s;

        // Already counted today: nothing to write, nothing to sync.
        if (s.last_logged_date === today) {
          if (s.current_streak >= 1) return s;
          changed = true;
          return { ...s, current_streak: 1 };
        }

        const nextStreak = s.last_logged_date === yesterday ? s.current_streak + 1 : 1;
        const nextLongest = Math.max(nextStreak, s.longest_streak);
        changed = true;

        void supabase
          .from('streaks')
          .upsert(
            {
              module: s.module,
              current_streak: nextStreak,
              longest_streak: nextLongest,
              last_logged_date: today,
            },
            { onConflict: 'module' }
          )
          .then(undefined, (err: unknown) => console.warn('Streak sync error:', err));

        return {
          ...s,
          current_streak: nextStreak,
          longest_streak: nextLongest,
          last_logged_date: today,
        };
      });

      // Bail out with the same reference so no consumer re-renders.
      return changed ? next : prev;
    });
  }, []);

  /* ---------------------------------------------------------------- *
   * Finance
   * ---------------------------------------------------------------- */
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id'>) => {
      const tempId = 'tx-' + Date.now();
      const optimistic: Transaction = { ...tx, id: tempId };

      const currentWallets = walletsRef.current;
      const source = currentWallets.find(
        (w) => w.name.toLowerCase() === tx.payment_method.toLowerCase()
      );
      const dest = tx.to_payment_method
        ? currentWallets.find(
            (w) => w.name.toLowerCase() === tx.to_payment_method!.toLowerCase()
          )
        : undefined;

      let nextSource = source?.balance ?? 0;
      let nextDest = dest?.balance ?? 0;

      if (tx.type === 'transfer') {
        if (source) nextSource = Math.max(0, source.balance - tx.amount);
        if (dest) nextDest = dest.balance + tx.amount;
      } else if (source) {
        const delta = tx.type === 'income' ? tx.amount : -tx.amount;
        nextSource = Math.max(0, source.balance + delta);
      }

      setTransactions((prev) => [optimistic, ...prev]);
      if (source || dest) {
        setWallets((prev) =>
          prev.map((w) => {
            if (source && w.id === source.id) return { ...w, balance: nextSource };
            if (dest && w.id === dest.id) return { ...w, balance: nextDest };
            return w;
          })
        );
      }

      triggerStreak('finance');

      try {
        // Insert + both balance writes go out together instead of serially.
        const [inserted] = await Promise.all([
          supabase.from('transactions').insert([tx]).select().single(),
          source
            ? supabase.from('wallets').update({ balance: nextSource }).eq('id', source.id)
            : Promise.resolve(null),
          dest
            ? supabase.from('wallets').update({ balance: nextDest }).eq('id', dest.id)
            : Promise.resolve(null),
        ]);

        if (inserted?.data?.id) {
          const row = inserted.data as Transaction;
          setTransactions((prev) => prev.map((t) => (t.id === tempId ? row : t)));
        }
      } catch (err) {
        console.warn('Could not sync transaction to Supabase:', err);
      }
    },
    [triggerStreak]
  );

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const oldTx = transactionsRef.current.find((t) => t.id === id);
    if (!oldTx) return;

    const newTx: Transaction = { ...oldTx, ...updates };

    // 1. Update transactions state optimistically
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? newTx : t))
    );

    // 2. Compute wallet balance adjustments
    const currentWallets = walletsRef.current;
    const walletBalanceMap = new Map<string, number>();
    currentWallets.forEach((w) => walletBalanceMap.set(w.id, w.balance));

    // A. Revert old transaction effect
    if (oldTx.type === 'transfer') {
      const oldSource = currentWallets.find(
        (w) => w.name.toLowerCase() === oldTx.payment_method.toLowerCase()
      );
      const oldDest = oldTx.to_payment_method
        ? currentWallets.find(
            (w) => w.name.toLowerCase() === oldTx.to_payment_method!.toLowerCase()
          )
        : undefined;

      if (oldSource) {
        walletBalanceMap.set(
          oldSource.id,
          (walletBalanceMap.get(oldSource.id) ?? 0) + oldTx.amount
        );
      }
      if (oldDest) {
        walletBalanceMap.set(
          oldDest.id,
          Math.max(0, (walletBalanceMap.get(oldDest.id) ?? 0) - oldTx.amount)
        );
      }
    } else {
      const oldSource = currentWallets.find(
        (w) => w.name.toLowerCase() === oldTx.payment_method.toLowerCase()
      );
      if (oldSource) {
        const revertDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
        walletBalanceMap.set(
          oldSource.id,
          Math.max(0, (walletBalanceMap.get(oldSource.id) ?? 0) + revertDelta)
        );
      }
    }

    // B. Apply new transaction effect
    if (newTx.type === 'transfer') {
      const newSource = currentWallets.find(
        (w) => w.name.toLowerCase() === newTx.payment_method.toLowerCase()
      );
      const newDest = newTx.to_payment_method
        ? currentWallets.find(
            (w) => w.name.toLowerCase() === newTx.to_payment_method!.toLowerCase()
          )
        : undefined;

      if (newSource) {
        walletBalanceMap.set(
          newSource.id,
          Math.max(0, (walletBalanceMap.get(newSource.id) ?? 0) - newTx.amount)
        );
      }
      if (newDest) {
        walletBalanceMap.set(
          newDest.id,
          (walletBalanceMap.get(newDest.id) ?? 0) + newTx.amount
        );
      }
    } else {
      const newSource = currentWallets.find(
        (w) => w.name.toLowerCase() === newTx.payment_method.toLowerCase()
      );
      if (newSource) {
        const applyDelta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
        walletBalanceMap.set(
          newSource.id,
          Math.max(0, (walletBalanceMap.get(newSource.id) ?? 0) + applyDelta)
        );
      }
    }

    // 3. Update wallets state optimistically
    const affectedWalletIds: string[] = [];
    currentWallets.forEach((w) => {
      const updatedBalance = walletBalanceMap.get(w.id);
      if (updatedBalance !== undefined && updatedBalance !== w.balance) {
        affectedWalletIds.push(w.id);
      }
    });

    if (affectedWalletIds.length > 0) {
      setWallets((prev) =>
        prev.map((w) => {
          const updatedBalance = walletBalanceMap.get(w.id);
          return updatedBalance !== undefined ? { ...w, balance: updatedBalance } : w;
        })
      );
    }

    // 4. Sync to Supabase in parallel
    const writes: PromiseLike<unknown>[] = [
      supabase.from('transactions').update(updates).eq('id', id),
    ];

    affectedWalletIds.forEach((wId) => {
      const finalBal = walletBalanceMap.get(wId);
      if (finalBal !== undefined) {
        writes.push(supabase.from('wallets').update({ balance: finalBal }).eq('id', wId));
      }
    });

    try {
      await Promise.all(writes);
    } catch (err) {
      console.warn('Update transaction & wallet balance error:', err);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const target = transactionsRef.current.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Tombstone so a deleted mock/remote row never reappears after a refresh.
    const deleted = readJSON<string[]>(LS_DELETED_TX, []);
    if (!deleted.includes(id)) writeJSON(LS_DELETED_TX, [...deleted, id]);

    const writes: PromiseLike<unknown>[] = [
      supabase.from('transactions').delete().eq('id', id),
    ];

    if (target) {
      const currentWallets = walletsRef.current;
      const source = currentWallets.find(
        (w) => w.name.toLowerCase() === target.payment_method.toLowerCase()
      );
      const dest = target.to_payment_method
        ? currentWallets.find(
            (w) => w.name.toLowerCase() === target.to_payment_method!.toLowerCase()
          )
        : undefined;

      if (target.type === 'transfer') {
        const revertedSource = source ? source.balance + target.amount : 0;
        const revertedDest = dest ? Math.max(0, dest.balance - target.amount) : 0;

        if (source || dest) {
          setWallets((prev) =>
            prev.map((w) => {
              if (source && w.id === source.id) return { ...w, balance: revertedSource };
              if (dest && w.id === dest.id) return { ...w, balance: revertedDest };
              return w;
            })
          );
        }
        if (source) {
          writes.push(
            supabase.from('wallets').update({ balance: revertedSource }).eq('id', source.id)
          );
        }
        if (dest) {
          writes.push(
            supabase.from('wallets').update({ balance: revertedDest }).eq('id', dest.id)
          );
        }
      } else if (source) {
        const revert = target.type === 'income' ? -target.amount : target.amount;
        const balance = Math.max(0, source.balance + revert);

        setWallets((prev) => prev.map((w) => (w.id === source.id ? { ...w, balance } : w)));
        writes.push(supabase.from('wallets').update({ balance }).eq('id', source.id));
      }
    }

    try {
      await Promise.all(writes);
    } catch (err) {
      console.warn('Delete transaction error:', err);
    }
  }, []);

  const addWallet = useCallback(async (w: Omit<Wallet, 'id'>) => {
    setWallets((prev) => [...prev, { ...w, id: 'w-' + Date.now() }]);
    try {
      await supabase.from('wallets').insert([w]);
    } catch (err) {
      console.warn('Add wallet error:', err);
    }
  }, []);

  const updateWallet = useCallback(async (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    try {
      await supabase.from('wallets').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Update wallet error:', err);
    }
  }, []);

  const deleteWallet = useCallback(async (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
    try {
      await supabase.from('wallets').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete wallet error:', err);
    }
  }, []);

  const updateBudget = useCallback(async (category: string, limit_amount: number) => {
    const month_year = new Date().toISOString().slice(0, 7);
    const key = category.toLowerCase();

    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.category.toLowerCase() === key);
      if (idx === -1) {
        return [...prev, { id: 'b-' + Date.now(), category, limit_amount, month_year }];
      }
      const next = prev.slice();
      next[idx] = { ...next[idx], limit_amount };
      return next;
    });

    try {
      await supabase
        .from('budgets')
        .upsert({ category, limit_amount, month_year }, { onConflict: 'category,month_year' });
    } catch (err) {
      console.warn('Update budget error:', err);
    }
  }, []);

  const addCategory = useCallback(async (c: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = { ...c, id: 'cat-' + Date.now() };
    const key = c.name.toLowerCase();

    let added = false;
    setCategories((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === key)) return prev;
      added = true;
      const updated = [...prev, newCat];
      writeJSON(LS_CATEGORIES, updated);
      return updated;
    });
    if (!added) return;

    try {
      await supabase.from('categories').insert([newCat]);
    } catch {
      /* table may not exist — localStorage copy is authoritative */
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (updated.length === prev.length) return prev;
      writeJSON(LS_CATEGORIES, updated);
      return updated;
    });

    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch {
      /* ignore */
    }
  }, []);

  /* ---------------------------------------------------------------- *
   * Study
   * ---------------------------------------------------------------- */
  const addNote = useCallback(
    async (note: Omit<Note, 'id' | 'created_at'>): Promise<Note> => {
      const optimistic: Note = { ...note, id: 'n-' + Date.now(), created_at: todayISO() };
      setNotes((prev) => [optimistic, ...prev]);
      triggerStreak('study');

      try {
        const { data } = await supabase.from('notes').insert([note]).select().single();
        if (data) {
          const row = data as Note;
          setNotes((prev) => prev.map((n) => (n.id === optimistic.id ? row : n)));
          return row;
        }
      } catch (err) {
        console.warn('Add note error:', err);
      }
      return optimistic;
    },
    [triggerStreak]
  );

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    try {
      await supabase.from('notes').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Update note error:', err);
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase.from('notes').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete note error:', err);
    }
  }, []);

  const addFlashcard = useCallback(async (fc: Omit<Flashcard, 'id'>) => {
    setFlashcards((prev) => [{ ...fc, id: 'fc-' + Date.now() }, ...prev]);
    try {
      await supabase.from('flashcards').insert([fc]);
    } catch (err) {
      console.warn('Add flashcard error:', err);
    }
  }, []);

  const updateFlashcard = useCallback(async (id: string, updates: Partial<Flashcard>) => {
    setFlashcards((prev) => prev.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc)));
    try {
      await supabase.from('flashcards').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Update flashcard error:', err);
    }
  }, []);

  const reviewFlashcard = useCallback(
    async (id: string, performance: 'easy' | 'medium' | 'hard') => {
      triggerStreak('study');

      const daysToAdd = performance === 'easy' ? 4 : performance === 'medium' ? 2 : 1;
      const next = new Date();
      next.setDate(next.getDate() + daysToAdd);
      const nextReview = next.toISOString().slice(0, 10);

      let repetition = 0;
      setFlashcards((prev) =>
        prev.map((fc) => {
          if (fc.id !== id) return fc;
          repetition = fc.repetition_count + 1;
          return { ...fc, repetition_count: repetition, next_review_date: nextReview };
        })
      );

      // The old implementation never persisted a review — progress was lost
      // on the next refresh.
      try {
        await supabase
          .from('flashcards')
          .update({ repetition_count: repetition, next_review_date: nextReview })
          .eq('id', id);
      } catch (err) {
        console.warn('Review flashcard sync error:', err);
      }
    },
    [triggerStreak]
  );

  const deleteFlashcard = useCallback(async (id: string) => {
    setFlashcards((prev) => prev.filter((fc) => fc.id !== id));
    try {
      await supabase.from('flashcards').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete flashcard error:', err);
    }
  }, []);

  const addAssignment = useCallback(async (a: Omit<Assignment, 'id'>) => {
    setAssignments((prev) => [...prev, { ...a, id: 'a-' + Date.now() }]);
    try {
      await supabase.from('assignments').insert([a]);
    } catch (err) {
      console.warn('Add assignment error:', err);
    }
  }, []);

  const toggleAssignment = useCallback(async (id: string) => {
    let nextStatus: Assignment['status'] = 'pending';

    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        nextStatus = a.status === 'completed' ? 'pending' : 'completed';
        return { ...a, status: nextStatus };
      })
    );

    // Previously local-only: ticking a task was forgotten on reload.
    try {
      await supabase.from('assignments').update({ status: nextStatus }).eq('id', id);
    } catch (err) {
      console.warn('Toggle assignment sync error:', err);
    }
  }, []);

  const deleteAssignment = useCallback(async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    try {
      await supabase.from('assignments').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete assignment error:', err);
    }
  }, []);

  const logStudySession = useCallback(
    async (session: Omit<StudySession, 'id'>) => {
      setStudySessions((prev) => [{ ...session, id: 'ss-' + Date.now() }, ...prev]);
      triggerStreak('study');
      try {
        await supabase.from('study_sessions').insert([session]);
      } catch (err) {
        console.warn('Log study session error:', err);
      }
    },
    [triggerStreak]
  );

  /* ---------------------------------------------------------------- *
   * Data Science
   * ---------------------------------------------------------------- */
  const addDataset = useCallback(async (d: Omit<Dataset, 'id' | 'uploaded_at'>) => {
    setDatasets((prev) => [{ ...d, id: 'd-' + Date.now(), uploaded_at: todayISO() }, ...prev]);
    try {
      await supabase.from('datasets').insert([d]);
    } catch (err) {
      console.warn('Add dataset error:', err);
    }
  }, []);

  const deleteDataset = useCallback(async (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    try {
      await supabase.from('datasets').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete dataset error:', err);
    }
  }, []);

  const addExperiment = useCallback(async (e: Omit<MLExperiment, 'id' | 'created_at'>) => {
    setExperiments((prev) => [
      { ...e, id: 'exp-' + Date.now(), created_at: todayISO() },
      ...prev,
    ]);
    try {
      await supabase.from('ml_experiments').insert([e]);
    } catch (err) {
      console.warn('Add experiment error:', err);
    }
  }, []);

  const deleteExperiment = useCallback(async (id: string) => {
    setExperiments((prev) => prev.filter((e) => e.id !== id));
    try {
      await supabase.from('ml_experiments').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete experiment error:', err);
    }
  }, []);

  const addSnippet = useCallback(async (s: Omit<CodeSnippet, 'id' | 'created_at'>) => {
    setSnippets((prev) => [{ ...s, id: 'sn-' + Date.now(), created_at: todayISO() }, ...prev]);
    try {
      await supabase.from('code_snippets').insert([s]);
    } catch (err) {
      console.warn('Add snippet error:', err);
    }
  }, []);

  const deleteSnippet = useCallback(async (id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    try {
      await supabase.from('code_snippets').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete snippet error:', err);
    }
  }, []);

  /* ---------------------------------------------------------------- *
   * Journal
   * ---------------------------------------------------------------- */
  const addJournalEntry = useCallback(
    async (entry: Omit<JournalEntry, 'id' | 'created_at'>) => {
      setJournalEntries((prev) => [
        { ...entry, id: 'j-' + Date.now(), created_at: new Date().toISOString() },
        ...prev,
      ]);
      triggerStreak('journal');
      try {
        await supabase.from('journal_entries').insert([entry]);
      } catch (err) {
        console.warn('Add journal entry error:', err);
      }
    },
    [triggerStreak]
  );

  const deleteJournalEntry = useCallback(async (id: string) => {
    setJournalEntries((prev) => prev.filter((j) => j.id !== id));
    try {
      await supabase.from('journal_entries').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete journal entry error:', err);
    }
  }, []);

  /* ---------------------------------------------------------------- *
   * Context values
   * ---------------------------------------------------------------- */
  const data = useMemo<DashboardData>(
    () => ({
      wallets, categories, transactions, budgets, streaks,
      notes, flashcards, assignments, studySessions,
      datasets, experiments, snippets, journalEntries,
      isLoading, isOnline,
    }),
    [
      wallets, categories, transactions, budgets, streaks,
      notes, flashcards, assignments, studySessions,
      datasets, experiments, snippets, journalEntries,
      isLoading, isOnline,
    ]
  );

  // Every member is a stable useCallback, so this object is built once.
  const actions = useMemo<DashboardActions>(
    () => ({
      addTransaction, updateTransaction, deleteTransaction,
      addWallet, updateWallet, deleteWallet,
      updateBudget, addCategory, deleteCategory, triggerStreak,
      addNote, updateNote, deleteNote,
      addFlashcard, updateFlashcard, reviewFlashcard, deleteFlashcard,
      addAssignment, toggleAssignment, deleteAssignment, logStudySession,
      addDataset, deleteDataset,
      addExperiment, deleteExperiment,
      addSnippet, deleteSnippet,
      addJournalEntry, deleteJournalEntry,
      refreshAll,
    }),
    [
      addTransaction, updateTransaction, deleteTransaction,
      addWallet, updateWallet, deleteWallet,
      updateBudget, addCategory, deleteCategory, triggerStreak,
      addNote, updateNote, deleteNote,
      addFlashcard, updateFlashcard, reviewFlashcard, deleteFlashcard,
      addAssignment, toggleAssignment, deleteAssignment, logStudySession,
      addDataset, deleteDataset,
      addExperiment, deleteExperiment,
      addSnippet, deleteSnippet,
      addJournalEntry, deleteJournalEntry,
      refreshAll,
    ]
  );

  return (
    <DashboardActionsContext.Provider value={actions}>
      <DashboardDataContext.Provider value={data}>{children}</DashboardDataContext.Provider>
    </DashboardActionsContext.Provider>
  );
}

/** Subscribes to data. Re-renders whenever any slice changes. */
export function useDashboardData(): DashboardData {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error('useDashboardData must be used within a DashboardProvider');
  return ctx;
}

/** Subscribes to actions only — never re-renders after mount. */
export function useDashboardActions(): DashboardActions {
  const ctx = useContext(DashboardActionsContext);
  if (!ctx) throw new Error('useDashboardActions must be used within a DashboardProvider');
  return ctx;
}

/**
 * Back-compat facade for existing call sites.
 * Prefer useDashboardActions() in components that only dispatch — it keeps
 * them out of the data subscription entirely.
 */
export function useDashboard(): DashboardData & DashboardActions {
  const data = useDashboardData();
  const actions = useDashboardActions();
  return useMemo(() => ({ ...data, ...actions }), [data, actions]);
}
