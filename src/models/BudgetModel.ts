import { supabase } from '../supabaseClient';
import { Transaction, Category, HistorySnapshot } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Needs
  { id: 'cat-rent', name: 'Rent & Mortgage', type: 'need', limit: 1500, icon: '🏠', color: '#ec4899' },
  { id: 'cat-groceries', name: 'Groceries', type: 'need', limit: 600, icon: '🛒', color: '#f43f5e' },
  { id: 'cat-utilities', name: 'Utilities & Bills', type: 'need', limit: 350, icon: '⚡', color: '#eab308' },
  { id: 'cat-transport', name: 'Transport & Fuel', type: 'need', limit: 250, icon: '🚗', color: '#a855f7' },
  
  // Wants
  { id: 'cat-dining', name: 'Dining Out', type: 'want', limit: 300, icon: '🍔', color: '#3b82f6' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'want', limit: 200, icon: '🎬', color: '#06b6d4' },
  { id: 'cat-shopping', name: 'Shopping', type: 'want', limit: 250, icon: '🛍️', color: '#14b8a6' },
  { id: 'cat-vacation', name: 'Vacation Fund', type: 'want', limit: 400, icon: '✈️', color: '#f97316' },
  
  // Savings
  { id: 'cat-emergency', name: 'Emergency Fund', type: 'saving', limit: 500, icon: '🛡️', color: '#10b981' },
  { id: 'cat-investments', name: 'Investments', type: 'saving', limit: 600, icon: '📈', color: '#059669' },
];

export interface ProfileData {
  language: string;
  currency: string;
  monthlyIncome: number;
  currentMonth: string;
  activeProfile: 'me' | 'spouse' | 'joint';
}

export const getCycleDateRange = (monthStr: string, startDay: number) => {
  try {
    const parts = monthStr.split('-');
    if (parts.length !== 2) throw new Error('Invalid month format');
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (isNaN(year) || !month || isNaN(month)) throw new Error('Invalid date components');

    if (startDay === 1) {
      const lastDay = new Date(year, month, 0).getDate();
      return {
        startDate: `${monthStr}-01`,
        endDate: `${monthStr}-${String(lastDay).padStart(2, '0')}`,
        totalDays: lastDay
      };
    } else {
      const prevDate = new Date(year, month - 2, startDay);
      const nextDate = new Date(year, month - 1, startDay - 1);
      
      const startYear = prevDate.getFullYear();
      const startMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
      const startDayStr = String(prevDate.getDate()).padStart(2, '0');
      
      const endYear = nextDate.getFullYear();
      const endMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
      const endDayStr = String(nextDate.getDate()).padStart(2, '0');
      
      const diffTime = Math.abs(nextDate.getTime() - prevDate.getTime());
      const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        startDate: `${startYear}-${startMonth}-${startDayStr}`,
        endDate: `${endYear}-${endMonth}-${endDayStr}`,
        totalDays
      };
    }
  } catch (err) {
    console.error('Error calculating cycle date range, using safe fallbacks:', err);
    return {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      totalDays: 31
    };
  }
};

export const BudgetModel = {
  getLocalStorageKey(userId?: string): string {
    return userId ? `harmony_budget_state_${userId}` : 'harmony_budget_state_guest';
  },

  loadLocalBackup(userId?: string): any {
    if (typeof window === 'undefined') return null;
    try {
      const key = this.getLocalStorageKey(userId);
      const cached = localStorage.getItem(key) || localStorage.getItem('harmony_budget_state_guest');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to load local backup:', e);
    }
    return null;
  },

  saveLocalBackup(userId: string | undefined, data: any): void {
    if (typeof window === 'undefined') return;
    try {
      const key = this.getLocalStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save local backup:', e);
    }
  },

  async fetchProfile(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        language: data.language || 'id',
        currency: data.currency || 'IDR',
        monthlyIncome: Number(data.monthly_income) || 15000000,
        currentMonth: data.current_month || '2026-07',
        activeProfile: (data.active_profile as any) || 'joint'
      };
    } catch (e) {
      console.error('Error fetching profile from Supabase:', e);
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<ProfileData>): Promise<void> {
    try {
      const dbUpdates: any = {};
      if (updates.language !== undefined) dbUpdates.language = updates.language;
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      if (updates.monthlyIncome !== undefined) dbUpdates.monthly_income = updates.monthlyIncome;
      if (updates.currentMonth !== undefined) dbUpdates.current_month = updates.currentMonth;
      if (updates.activeProfile !== undefined) dbUpdates.active_profile = updates.activeProfile;

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId);

      if (error) throw error;
    } catch (e) {
      console.error('Error updating profile in Supabase:', e);
    }
  },

  async fetchCategories(userId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map(c => ({
        id: c.id,
        name: c.name || '',
        limit: Number(c.limit_amount) || 0,
        icon: c.icon || '📦',
        type: (c.type as any) || 'need',
        color: c.color || '#4f46e5'
      }));
    } catch (e) {
      console.error('Error fetching categories from Supabase:', e);
      return [];
    }
  },

  async initializeDefaultCategories(userId: string, defaultMultiplier: number): Promise<Category[]> {
    try {
      const dbCategories = DEFAULT_CATEGORIES.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        limit_amount: c.limit * defaultMultiplier,
        icon: c.icon,
        type: c.type,
        color: c.color
      }));

      const { error } = await supabase
        .from('categories')
        .insert(dbCategories);

      if (error) throw error;

      return dbCategories.map(c => ({
        id: c.id,
        name: c.name,
        limit: Number(c.limit_amount),
        icon: c.icon,
        type: c.type as any,
        color: c.color
      }));
    } catch (e) {
      console.error('Error initializing categories in Supabase:', e);
      return [];
    }
  },

  async fetchTransactions(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(t => ({
        id: t.id,
        date: t.date || '',
        amount: Number(t.amount) || 0,
        categoryId: t.category_id || 'uncategorized',
        spender: (t.spender as any) || 'joint',
        notes: t.notes || ''
      }));
    } catch (e) {
      console.error('Error fetching transactions from Supabase:', e);
      return [];
    }
  },

  async fetchHistory(userId: string): Promise<HistorySnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .neq('month_id', 'SYSTEM_RATES')
        .order('month_id', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map(h => ({
        monthId: h.month_id || '',
        monthlyIncome: Number(h.monthly_income) || 0,
        categories: (h.categories || []).map((c: any) => ({
          id: c.id || '',
          name: c.name || '',
          type: c.type || 'need',
          limit: Number(c.limit) || 0,
          bonus: Number(c.bonus) || 0,
          totalLimit: Number(c.totalLimit) || 0,
          spent: Number(c.spent) || 0,
          icon: c.icon || '📦',
          color: c.color || '#4f46e5'
        })),
        transactions: (h.transactions || []).map((t: any) => ({
          id: t.id || '',
          date: t.date || '',
          amount: Number(t.amount) || 0,
          categoryId: t.categoryId || t.category_id || '',
          spender: t.spender || 'joint',
          notes: t.notes || ''
        }))
      }));
    } catch (e) {
      console.error('Error fetching history from Supabase:', e);
      return [];
    }
  },

  async saveTransaction(userId: string, tx: Transaction): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .upsert({
          id: tx.id,
          user_id: userId,
          date: tx.date,
          amount: tx.amount,
          category_id: tx.categoryId || null,
          spender: tx.spender,
          notes: tx.notes
        });

      if (error) throw error;
    } catch (e: any) {
      console.error('Error saving transaction to Supabase:', e?.message || e?.details || e);
    }
  },

  async deleteTransaction(userId: string, id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (e: any) {
      console.error('Error deleting transaction from Supabase:', e?.message || e?.details || e);
    }
  },

  async saveCategory(userId: string, cat: Category): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .upsert({
          id: cat.id,
          user_id: userId,
          name: cat.name,
          limit_amount: cat.limit,
          icon: cat.icon || '📦',
          type: cat.type,
          color: cat.color || '#4f46e5'
        });

      if (error) throw error;
    } catch (e: any) {
      console.error('Error saving category to Supabase:', e?.message || e?.details || e);
    }
  },

  async deleteCategory(userId: string, id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (e: any) {
      console.error('Error deleting category from Supabase:', e?.message || e?.details || e);
    }
  },

  async saveHistorySnapshot(userId: string, snapshot: HistorySnapshot): Promise<void> {
    try {
      const { error } = await supabase
        .from('history')
        .upsert({
          user_id: userId,
          month_id: snapshot.monthId,
          monthly_income: snapshot.monthlyIncome,
          categories: snapshot.categories,
          transactions: snapshot.transactions
        });

      if (error) throw error;
    } catch (e: any) {
      console.error('Error saving history snapshot to Supabase:', e?.message || e?.details || e);
    }
  },

  async clearUserData(userId: string): Promise<void> {
    try {
      await supabase.from('transactions').delete().eq('user_id', userId);
      await supabase.from('categories').delete().eq('user_id', userId);
      await supabase.from('history').delete().eq('user_id', userId);
    } catch (e) {
      console.error('Error clearing user data in Supabase:', e);
    }
  },

  async syncAllToSupabase(
    userId: string,
    cats: Category[],
    txs: Transaction[],
    hist: HistorySnapshot[],
    profile: ProfileData
  ): Promise<void> {
    try {
      await this.clearUserData(userId);

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: userId,
        language: profile.language,
        currency: profile.currency,
        monthly_income: profile.monthlyIncome,
        current_month: profile.currentMonth,
        active_profile: profile.activeProfile
      });

      // Insert categories
      if (cats.length > 0) {
        const dbCats = cats.map(c => ({
          id: c.id,
          user_id: userId,
          name: c.name,
          limit_amount: c.limit,
          icon: c.icon || '📦',
          type: c.type,
          color: c.color || '#4f46e5'
        }));
        const { error } = await supabase.from('categories').insert(dbCats);
        if (error) throw error;
      }

      // Insert transactions
      if (txs.length > 0) {
        const dbTxs = txs.map(t => ({
          id: t.id,
          user_id: userId,
          date: t.date,
          amount: t.amount,
          category_id: t.categoryId || null,
          spender: t.spender,
          notes: t.notes || ''
        }));
        const { error } = await supabase.from('transactions').insert(dbTxs);
        if (error) throw error;
      }

      // Insert history snapshots
      if (hist.length > 0) {
        const dbHist = hist.map(h => ({
          user_id: userId,
          month_id: h.monthId,
          monthly_income: h.monthlyIncome,
          categories: h.categories,
          transactions: h.transactions
        }));
        const { error } = await supabase.from('history').insert(dbHist);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error('Failed to sync all data to Supabase:', e?.message || e?.details || e);
    }
  }
};
