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

export const INITIAL_WALLETS: Wallet[] = [
  { id: 'w1', name: 'Bank Jago', type: 'bank', balance: 0, color: '#FF5E00', icon: 'credit-card' },
  { id: 'w2', name: 'BCA', type: 'bank', balance: 0, color: '#0060AF', icon: 'building-2' },
  { id: 'w3', name: 'GoPay', type: 'ewallet', balance: 0, color: '#00AED6', icon: 'wallet' },
  { id: 'w4', name: 'Cash', type: 'cash', balance: 0, color: '#10B981', icon: 'banknote' },
];

export const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Makan', type: 'expense', color: '#FF8A00' },
  { id: 'cat-2', name: 'Kos', type: 'expense', color: '#0060AF' },
  { id: 'cat-3', name: 'Transport', type: 'expense', color: '#00AED6' },
  { id: 'cat-4', name: 'Kuliah', type: 'expense', color: '#9333EA' },
  { id: 'cat-5', name: 'Hiburan', type: 'expense', color: '#EC4899' },
  { id: 'cat-6', name: 'Belanja', type: 'expense', color: '#EAB308' },
  { id: 'cat-7', name: 'Gaji/Freelance', type: 'income', color: '#10B981' },
  { id: 'cat-8', name: 'Uang Jajan', type: 'income', color: '#10B981' },
  { id: 'cat-9', name: 'Lainnya', type: 'both', color: '#7F847C' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: Budget[] = [
  { id: 'b1', category: 'makan', limit_amount: 1500000, month_year: new Date().toISOString().slice(0, 7), spent: 0 },
  { id: 'b2', category: 'kos', limit_amount: 1500000, month_year: new Date().toISOString().slice(0, 7), spent: 0 },
  { id: 'b3', category: 'transport', limit_amount: 300000, month_year: new Date().toISOString().slice(0, 7), spent: 0 },
  { id: 'b4', category: 'kuliah', limit_amount: 500000, month_year: new Date().toISOString().slice(0, 7), spent: 0 },
  { id: 'b5', category: 'hiburan', limit_amount: 400000, month_year: new Date().toISOString().slice(0, 7), spent: 0 },
  { id: 'b6', category: 'belanja', limit_amount: 500000, month_year: new Date().toISOString().slice(0, 7), spent: 0 },
];

export const INITIAL_STREAKS: Streak[] = [
  {
    id: 's-overall',
    module: 'overall',
    current_streak: 0,
    longest_streak: 0,
    last_logged_date: new Date().toISOString().split('T')[0],
    badges: [],
  },
  {
    id: 's-finance',
    module: 'finance',
    current_streak: 0,
    longest_streak: 0,
    last_logged_date: new Date().toISOString().split('T')[0],
    badges: [],
  },
  {
    id: 's-study',
    module: 'study',
    current_streak: 0,
    longest_streak: 0,
    last_logged_date: new Date().toISOString().split('T')[0],
    badges: [],
  },
  {
    id: 's-journal',
    module: 'journal',
    current_streak: 0,
    longest_streak: 0,
    last_logged_date: new Date().toISOString().split('T')[0],
    badges: [],
  },
];

export const INITIAL_NOTES: Note[] = [];
export const INITIAL_FLASHCARDS: Flashcard[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_STUDY_SESSIONS: StudySession[] = [];
export const INITIAL_DATASETS: Dataset[] = [];
export const INITIAL_EXPERIMENTS: MLExperiment[] = [];
export const INITIAL_SNIPPETS: CodeSnippet[] = [];
export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [];
