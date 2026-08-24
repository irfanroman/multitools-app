export interface Wallet {
  id: string;
  name: string; // 'Bank Jago', 'BCA', 'GoPay', 'Cash', etc.
  type: 'bank' | 'ewallet' | 'cash';
  balance: number;
  icon?: string;
  color?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'expense' | 'income' | 'both';
  color?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string; // 'uang jajan', 'gaji/freelance', 'kos', 'makan', 'transport', 'kuliah', 'hiburan', 'belanja', 'lainnya'
  payment_method: string; // 'Bank Jago', 'BCA', 'GoPay', 'Cash', etc.
  wallet_id?: string;
  date: string; // 'YYYY-MM-DD'
  is_recurring?: boolean;
  recurrence_rule?: string;
  notes?: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  month_year: string; // 'YYYY-MM'
  spent?: number;
}

export interface StreakBadge {
  id: string;
  name: string;
  icon: string;
  unlockedAt: string;
}

export interface Streak {
  id: string;
  module: 'finance' | 'study' | 'journal' | 'overall';
  current_streak: number;
  longest_streak: number;
  last_logged_date: string;
  badges: StreakBadge[];
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  raw_content: string;
  summary?: string;
  key_points?: string[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Flashcard {
  id: string;
  note_id?: string;
  question: string;
  answer: string;
  subject: string;
  difficulty: number; // 1-3
  next_review_date: string;
  repetition_count: number;
  created_at?: string;
}

export interface StudySession {
  id: string;
  subject: string;
  duration_minutes: number;
  date: string;
  notes?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface Dataset {
  id: string;
  name: string;
  file_name: string;
  file_size: number;
  row_count: number;
  column_count: number;
  summary_stats?: {
    numeric_cols?: string[];
    categorical_cols?: string[];
    correlations?: Record<string, number>;
    columns_info?: Array<{
      name: string;
      type: string;
      missing: number;
      unique: number;
      mean?: number;
      min?: number;
      max?: number;
    }>;
  };
  sample_data?: Array<Record<string, any>>;
  uploaded_at: string;
}

export interface MLExperiment {
  id: string;
  title: string;
  dataset_name?: string;
  model_type: string;
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  notes?: string;
  created_at: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  language: string; // 'python', 'sql', 'r'
  code: string;
  tags: string[];
  description?: string;
  created_at?: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood_score: number; // 1-5
  mood_tag: string; // 'energized', 'productive', 'chill', 'tired', 'overwhelmed'
  tags: string[];
  date: string;
  created_at?: string;
}
