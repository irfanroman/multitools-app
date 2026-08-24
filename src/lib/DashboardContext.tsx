'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

interface DashboardContextType {
  // Finance
  wallets: Wallet[];
  categories: CategoryItem[];
  transactions: Transaction[];
  budgets: Budget[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addWallet: (w: Omit<Wallet, 'id'>) => Promise<void>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  updateBudget: (category: string, limit_amount: number) => Promise<void>;
  addCategory: (c: Omit<CategoryItem, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Streaks
  streaks: Streak[];
  triggerStreak: (module: 'finance' | 'study' | 'journal' | 'overall') => void;

  // Study
  notes: Note[];
  flashcards: Flashcard[];
  assignments: Assignment[];
  studySessions: StudySession[];
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

  // Data Science
  datasets: Dataset[];
  experiments: MLExperiment[];
  snippets: CodeSnippet[];
  addDataset: (d: Omit<Dataset, 'id' | 'uploaded_at'>) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  addExperiment: (e: Omit<MLExperiment, 'id' | 'created_at'>) => Promise<void>;
  deleteExperiment: (id: string) => Promise<void>;
  addSnippet: (s: Omit<CodeSnippet, 'id' | 'created_at'>) => Promise<void>;
  deleteSnippet: (id: string) => Promise<void>;

  // Mood / Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'created_at'>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Global status
  isLoading: boolean;
  isOnline: boolean;
  refreshAll: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // States with localStorage persistence
  const [wallets, setWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCats = localStorage.getItem('dashboard_custom_categories');
        if (savedCats) {
          const parsed = JSON.parse(savedCats);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...INITIAL_CATEGORIES];
            parsed.forEach((c: CategoryItem) => {
              if (!merged.some((m) => m.name.toLowerCase() === c.name.toLowerCase())) {
                merged.push(c);
              }
            });
            return merged;
          }
        }
      } catch (e) {}
    }
    return INITIAL_CATEGORIES;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const deletedTxRaw = localStorage.getItem('dashboard_deleted_tx_ids');
        if (deletedTxRaw) {
          const deletedIds = JSON.parse(deletedTxRaw);
          if (Array.isArray(deletedIds) && deletedIds.length > 0) {
            return INITIAL_TRANSACTIONS.filter((t) => !deletedIds.includes(t.id));
          }
        }
      } catch (e) {}
    }
    return INITIAL_TRANSACTIONS;
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

  // Load custom categories & deleted tx tracking from localStorage
  useEffect(() => {
    try {
      const savedCats = localStorage.getItem('dashboard_custom_categories');
      if (savedCats) {
        const parsed = JSON.parse(savedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...INITIAL_CATEGORIES];
          parsed.forEach((c: CategoryItem) => {
            if (!merged.some((m) => m.name.toLowerCase() === c.name.toLowerCase())) {
              merged.push(c);
            }
          });
          setCategories(merged);
        }
      }

      // Filter initial transactions if any were deleted locally
      const deletedTxRaw = localStorage.getItem('dashboard_deleted_tx_ids');
      if (deletedTxRaw) {
        const deletedIds = JSON.parse(deletedTxRaw);
        if (Array.isArray(deletedIds) && deletedIds.length > 0) {
          setTransactions((prev) => prev.filter((t) => !deletedIds.includes(t.id)));
        }
      }
    } catch (e) {
      console.warn('Failed to load initial data from localStorage:', e);
    }
  }, []);

  // Fetch all from Supabase
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const deletedTxRaw = localStorage.getItem('dashboard_deleted_tx_ids');
      const deletedIds: string[] = deletedTxRaw ? JSON.parse(deletedTxRaw) : [];

      // 1. Wallets
      const { data: wData } = await supabase.from('wallets').select('*');
      if (wData && wData.length > 0) setWallets(wData);

      // 2. Transactions
      const { data: tData, error: tErr } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tErr && tData !== null) {
        const filtered = tData.filter((t: Transaction) => !deletedIds.includes(t.id));
        setTransactions(filtered);
      } else {
        setTransactions((prev) => prev.filter((t) => !deletedIds.includes(t.id)));
      }

      // 3. Budgets
      const { data: bData } = await supabase.from('budgets').select('*');
      if (bData && bData.length > 0) setBudgets(bData);

      // 4. Streaks
      const { data: sData } = await supabase.from('streaks').select('*');
      if (sData && sData.length > 0) setStreaks(sData);

      // 5. Notes
      const { data: nData } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
      if (nData && nData.length > 0) setNotes(nData);

      // 6. Flashcards
      const { data: fcData } = await supabase.from('flashcards').select('*');
      if (fcData && fcData.length > 0) setFlashcards(fcData);

      // 7. Assignments
      const { data: aData } = await supabase.from('assignments').select('*').order('due_date', { ascending: true });
      if (aData && aData.length > 0) setAssignments(aData);

      // 8. Study sessions
      const { data: ssData } = await supabase.from('study_sessions').select('*');
      if (ssData && ssData.length > 0) setStudySessions(ssData);

      // 9. Datasets
      const { data: dData } = await supabase.from('datasets').select('*').order('uploaded_at', { ascending: false });
      if (dData && dData.length > 0) setDatasets(dData);

      // 10. Experiments
      const { data: expData } = await supabase.from('ml_experiments').select('*').order('created_at', { ascending: false });
      if (expData && expData.length > 0) setExperiments(expData);

      // 11. Snippets
      const { data: snData } = await supabase.from('code_snippets').select('*').order('created_at', { ascending: false });
      if (snData && snData.length > 0) setSnippets(snData);

      // 12. Journal entries
      const { data: jData } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
      if (jData && jData.length > 0) setJournalEntries(jData);

      // 13. Categories (Merge Initial + LocalStorage + Supabase)
      const allCats: CategoryItem[] = [...INITIAL_CATEGORIES];
      try {
        const saved = localStorage.getItem('dashboard_custom_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((c: CategoryItem) => {
              if (!allCats.some((m) => m.name.toLowerCase() === c.name.toLowerCase())) {
                allCats.push(c);
              }
            });
          }
        }
      } catch (e) {}

      try {
        const { data: catData } = await supabase.from('categories').select('*');
        if (catData && catData.length > 0) {
          catData.forEach((c: CategoryItem) => {
            if (!allCats.some((m) => m.name.toLowerCase() === c.name.toLowerCase())) {
              allCats.push(c);
            }
          });
        }
      } catch (catErr) {}

      setCategories(allCats);
      setIsOnline(true);
    } catch (err) {
      console.warn('Using offline/local state:', err);
      setIsOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // STREAKS TRIGGER (Hanya bertambah 1x per hari kalender)
  const triggerStreak = useCallback((module: 'finance' | 'study' | 'journal' | 'overall') => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    setStreaks((prev) =>
      prev.map((s) => {
        if (s.module === module || s.module === 'overall') {
          // Jika sudah mencatat hari ini, jangan tambah streak lagi
          if (s.last_logged_date === today) {
            return {
              ...s,
              current_streak: Math.max(s.current_streak, 1),
            };
          }

          let nextStreak = 1;
          // Jika kemarin aktif, lanjutkan streak berturut-turut
          if (s.last_logged_date === yesterday) {
            nextStreak = s.current_streak + 1;
          } else {
            // Jika streak terputus atau baru mulai
            nextStreak = 1;
          }

          const nextLongest = Math.max(nextStreak, s.longest_streak);

          // Sync streak ke Supabase
          try {
            supabase
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
              .then();
          } catch (err) {
            console.warn('Streak sync error:', err);
          }

          return {
            ...s,
            current_streak: nextStreak,
            longest_streak: nextLongest,
            last_logged_date: today,
          };
        }
        return s;
      })
    );
  }, []);

  // FINANCE: Add Transaction (Updates wallets balance & budget)
  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const newId = 'tx-' + Date.now();
    const newTx: Transaction = { ...tx, id: newId };

    const sourceWallet = wallets.find((w) => w.name.toLowerCase() === tx.payment_method.toLowerCase());
    const destWallet = tx.to_payment_method
      ? wallets.find((w) => w.name.toLowerCase() === tx.to_payment_method?.toLowerCase())
      : null;

    let newSourceBalance = sourceWallet ? sourceWallet.balance : 0;
    let newDestBalance = destWallet ? destWallet.balance : 0;

    if (tx.type === 'transfer') {
      if (sourceWallet) newSourceBalance = Math.max(0, sourceWallet.balance - tx.amount);
      if (destWallet) newDestBalance = destWallet.balance + tx.amount;
    } else {
      const delta = tx.type === 'income' ? tx.amount : -tx.amount;
      if (sourceWallet) newSourceBalance = Math.max(0, sourceWallet.balance + delta);
    }

    // Optimistic UI update
    setTransactions((prev) => [newTx, ...prev]);

    setWallets((prev) =>
      prev.map((w) => {
        if (sourceWallet && w.id === sourceWallet.id) return { ...w, balance: newSourceBalance };
        if (destWallet && w.id === destWallet.id) return { ...w, balance: newDestBalance };
        return w;
      })
    );

    triggerStreak('finance');

    // Sync to Supabase
    try {
      const { data, error } = await supabase.from('transactions').insert([tx]).select().single();
      if (data && data.id) {
        setTransactions((prev) => prev.map((t) => (t.id === newId ? data : t)));
      }
      if (sourceWallet) {
        await supabase.from('wallets').update({ balance: newSourceBalance }).eq('id', sourceWallet.id);
      }
      if (destWallet) {
        await supabase.from('wallets').update({ balance: newDestBalance }).eq('id', destWallet.id);
      }
    } catch (err) {
      console.warn('Could not sync transaction to Supabase:', err);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const newTx: Transaction = { ...oldTx, ...updates };

    // Update transactions state optimistically
    setTransactions((prev) => prev.map((t) => (t.id === id ? newTx : t)));

    try {
      await supabase.from('transactions').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Update transaction error:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Track deleted IDs in localStorage so deleted mock/real transactions never return
    try {
      const deletedTxRaw = localStorage.getItem('dashboard_deleted_tx_ids');
      const deletedIds: string[] = deletedTxRaw ? JSON.parse(deletedTxRaw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('dashboard_deleted_tx_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {}

    if (txToDelete) {
      const sourceWallet = wallets.find((w) => w.name.toLowerCase() === txToDelete.payment_method.toLowerCase());
      const destWallet = txToDelete.to_payment_method
        ? wallets.find((w) => w.name.toLowerCase() === txToDelete.to_payment_method?.toLowerCase())
        : null;

      if (txToDelete.type === 'transfer') {
        const newSourceBalance = sourceWallet ? sourceWallet.balance + txToDelete.amount : 0;
        const newDestBalance = destWallet ? Math.max(0, destWallet.balance - txToDelete.amount) : 0;

        setWallets((prev) =>
          prev.map((w) => {
            if (sourceWallet && w.id === sourceWallet.id) return { ...w, balance: newSourceBalance };
            if (destWallet && w.id === destWallet.id) return { ...w, balance: newDestBalance };
            return w;
          })
        );

        try {
          if (sourceWallet) await supabase.from('wallets').update({ balance: newSourceBalance }).eq('id', sourceWallet.id);
          if (destWallet) await supabase.from('wallets').update({ balance: newDestBalance }).eq('id', destWallet.id);
        } catch (err) {
          console.warn('Could not sync wallet revert to Supabase:', err);
        }
      } else if (sourceWallet) {
        const revert = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;
        const newBalance = Math.max(0, sourceWallet.balance + revert);

        setWallets((prev) =>
          prev.map((w) => (w.id === sourceWallet.id ? { ...w, balance: newBalance } : w))
        );

        try {
          await supabase.from('wallets').update({ balance: newBalance }).eq('id', sourceWallet.id);
        } catch (err) {
          console.warn('Could not sync wallet revert to Supabase:', err);
        }
      }
    }

    try {
      await supabase.from('transactions').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete transaction error:', err);
    }
  };

  const addWallet = async (w: Omit<Wallet, 'id'>) => {
    const newId = 'w-' + Date.now();
    const newWallet = { ...w, id: newId };
    setWallets((prev) => [...prev, newWallet]);
    try {
      await supabase.from('wallets').insert([w]);
    } catch (err) {
      console.warn('Add wallet error:', err);
    }
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    try {
      await supabase.from('wallets').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Update wallet error:', err);
    }
  };

  const deleteWallet = async (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
    try {
      await supabase.from('wallets').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete wallet error:', err);
    }
  };

  const updateBudget = async (category: string, limit_amount: number) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setBudgets((prev) => {
      const exists = prev.find((b) => b.category.toLowerCase() === category.toLowerCase());
      if (exists) {
        return prev.map((b) =>
          b.category.toLowerCase() === category.toLowerCase() ? { ...b, limit_amount } : b
        );
      }
      return [...prev, { id: 'b-' + Date.now(), category, limit_amount, month_year: currentMonth }];
    });

    try {
      await supabase
        .from('budgets')
        .upsert({ category, limit_amount, month_year: currentMonth }, { onConflict: 'category,month_year' });
    } catch (err) {
      console.warn('Update budget error:', err);
    }
  };

  const addCategory = async (c: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...c,
      id: 'cat-' + Date.now(),
    };
    setCategories((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === c.name.toLowerCase())) {
        return prev;
      }
      const updated = [...prev, newCat];
      try {
        localStorage.setItem('dashboard_custom_categories', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await supabase.from('categories').insert([newCat]);
    } catch (err) {
      // Supabase table fallback
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem('dashboard_custom_categories', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      await supabase.from('categories').delete().eq('id', id);
    } catch (err) {
      // Supabase table fallback
    }
  };

  // STUDY TOOLS: Notes & Flashcards
  const addNote = async (note: Omit<Note, 'id' | 'created_at'>): Promise<Note> => {
    const newId = 'n-' + Date.now();
    const newNote: Note = {
      ...note,
      id: newId,
      created_at: new Date().toISOString().split('T')[0],
    };
    setNotes((prev) => [newNote, ...prev]);
    triggerStreak('study');

    try {
      const { data } = await supabase.from('notes').insert([note]).select().single();
      if (data) return data;
    } catch (err) {
      console.warn('Add note error:', err);
    }
    return newNote;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
    try {
      await supabase.from('notes').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Update note error:', err);
    }
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabase.from('notes').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete note error:', err);
    }
  };

  const addFlashcard = async (fc: Omit<Flashcard, 'id'>) => {
    const newFc: Flashcard = { ...fc, id: 'fc-' + Date.now() };
    setFlashcards((prev) => [newFc, ...prev]);
    try {
      await supabase.from('flashcards').insert([fc]);
    } catch (err) {
      console.warn('Add flashcard error:', err);
    }
  };

  const updateFlashcard = async (id: string, updates: Partial<Flashcard>) => {
    setFlashcards((prev) => prev.map((fc) => (fc.id === id ? { ...fc, ...updates } : fc)));
    try {
      await supabase.from('flashcards').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Update flashcard error:', err);
    }
  };

  const reviewFlashcard = async (id: string, performance: 'easy' | 'medium' | 'hard') => {
    triggerStreak('study');
    setFlashcards((prev) =>
      prev.map((fc) => {
        if (fc.id === id) {
          const daysToAdd = performance === 'easy' ? 4 : performance === 'medium' ? 2 : 1;
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + daysToAdd);
          return {
            ...fc,
            repetition_count: fc.repetition_count + 1,
            next_review_date: nextDate.toISOString().split('T')[0],
          };
        }
        return fc;
      })
    );
  };

  const deleteFlashcard = async (id: string) => {
    setFlashcards((prev) => prev.filter((fc) => fc.id !== id));
    try {
      await supabase.from('flashcards').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete flashcard error:', err);
    }
  };

  // STUDY: Assignments & Sessions
  const addAssignment = async (a: Omit<Assignment, 'id'>) => {
    const newA: Assignment = { ...a, id: 'a-' + Date.now() };
    setAssignments((prev) => [...prev, newA]);
    try {
      await supabase.from('assignments').insert([a]);
    } catch (err) {
      console.warn('Add assignment error:', err);
    }
  };

  const toggleAssignment = async (id: string) => {
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus = a.status === 'completed' ? 'pending' : 'completed';
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const deleteAssignment = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    try {
      await supabase.from('assignments').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete assignment error:', err);
    }
  };

  const logStudySession = async (session: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = { ...session, id: 'ss-' + Date.now() };
    setStudySessions((prev) => [newSession, ...prev]);
    triggerStreak('study');
    try {
      await supabase.from('study_sessions').insert([session]);
    } catch (err) {
      console.warn('Log study session error:', err);
    }
  };

  // DATA SCIENCE: Datasets, Experiments & Snippets
  const addDataset = async (d: Omit<Dataset, 'id' | 'uploaded_at'>) => {
    const newD: Dataset = {
      ...d,
      id: 'd-' + Date.now(),
      uploaded_at: new Date().toISOString().split('T')[0],
    };
    setDatasets((prev) => [newD, ...prev]);
    try {
      await supabase.from('datasets').insert([d]);
    } catch (err) {
      console.warn('Add dataset error:', err);
    }
  };

  const deleteDataset = async (id: string) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    try {
      await supabase.from('datasets').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete dataset error:', err);
    }
  };

  const addExperiment = async (e: Omit<MLExperiment, 'id' | 'created_at'>) => {
    const newExp: MLExperiment = {
      ...e,
      id: 'exp-' + Date.now(),
      created_at: new Date().toISOString().split('T')[0],
    };
    setExperiments((prev) => [newExp, ...prev]);
    try {
      await supabase.from('ml_experiments').insert([e]);
    } catch (err) {
      console.warn('Add experiment error:', err);
    }
  };

  const deleteExperiment = async (id: string) => {
    setExperiments((prev) => prev.filter((e) => e.id !== id));
    try {
      await supabase.from('ml_experiments').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete experiment error:', err);
    }
  };

  const addSnippet = async (s: Omit<CodeSnippet, 'id' | 'created_at'>) => {
    const newS: CodeSnippet = {
      ...s,
      id: 'sn-' + Date.now(),
      created_at: new Date().toISOString().split('T')[0],
    };
    setSnippets((prev) => [newS, ...prev]);
    try {
      await supabase.from('code_snippets').insert([s]);
    } catch (err) {
      console.warn('Add snippet error:', err);
    }
  };

  const deleteSnippet = async (id: string) => {
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    try {
      await supabase.from('code_snippets').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete snippet error:', err);
    }
  };

  // MOOD & JOURNAL
  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'created_at'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: 'j-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    triggerStreak('journal');
    try {
      await supabase.from('journal_entries').insert([entry]);
    } catch (err) {
      console.warn('Add journal entry error:', err);
    }
  };

  const deleteJournalEntry = async (id: string) => {
    setJournalEntries((prev) => prev.filter((j) => j.id !== id));
    try {
      await supabase.from('journal_entries').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete journal entry error:', err);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        wallets,
        categories,
        transactions,
        budgets,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        updateBudget,
        addCategory,
        deleteCategory,
        streaks,
        triggerStreak,
        notes,
        flashcards,
        assignments,
        studySessions,
        addNote,
        updateNote,
        deleteNote,
        addFlashcard,
        updateFlashcard,
        reviewFlashcard,
        deleteFlashcard,
        addAssignment,
        toggleAssignment,
        deleteAssignment,
        logStudySession,
        datasets,
        experiments,
        snippets,
        addDataset,
        deleteDataset,
        addExperiment,
        deleteExperiment,
        addSnippet,
        deleteSnippet,
        journalEntries,
        addJournalEntry,
        deleteJournalEntry,
        isLoading,
        isOnline,
        refreshAll,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
