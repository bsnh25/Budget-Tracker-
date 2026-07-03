import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { BudgetModel, DEFAULT_CATEGORIES, getCycleDateRange } from '../models/BudgetModel';
import { TravelingModel } from '../models/TravelingModel';
import { TRANSLATIONS as translations } from '../localization/translations';
import {
  Transaction,
  Category,
  Trip,
  HistorySnapshot,
  ExchangeRates,
  BudgetMetrics,
  DateMetrics,
  ConfirmDialog
} from '../types';

export function useBudgetController() {
  // --- Core State ---
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<'en' | 'id'>('id');
  const [currency, setCurrency] = useState<string>('IDR');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(15000000);
  const [activeProfile, setActiveProfile] = useState<'me' | 'spouse' | 'joint'>('joint');
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('2026-07');
  const [cycleStartDay, setCycleStartDay] = useState<number>(1);
  const [rolloverBonuses, setRolloverBonuses] = useState<{ [categoryId: string]: number }>({});
  
  // Traveling Mode States
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  
  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  // Theme Support
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('harmony_budget_theme');
      if (saved) return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('harmony_budget_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Custom confirmation dialog trigger
  const showConfirm = useCallback(({ message, onConfirm, title = '', isDanger = true, confirmText = '', cancelText = '' }: ConfirmDialog) => {
    setConfirmDialog({ message, onConfirm, title, isDanger, confirmText, cancelText });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  // Sync state to local storage helper
  const saveToLocalStorage = useCallback((updates: Partial<{
    language: 'en' | 'id';
    currency: string;
    monthlyIncome: number;
    activeProfile: 'me' | 'spouse' | 'joint';
    categories: Category[];
    transactions: Transaction[];
    history: HistorySnapshot[];
    currentMonth: string;
    rolloverBonuses: { [categoryId: string]: number };
    cycleStartDay: number;
    trips: Trip[];
    activeTripId: string | null;
  }>) => {
    if (typeof window === 'undefined') return;

    const dataToSave = {
      language: updates.language !== undefined ? updates.language : language,
      currency: updates.currency !== undefined ? updates.currency : currency,
      monthlyIncome: updates.monthlyIncome !== undefined ? updates.monthlyIncome : monthlyIncome,
      activeProfile: updates.activeProfile !== undefined ? updates.activeProfile : activeProfile,
      categories: updates.categories !== undefined ? updates.categories : categories,
      transactions: updates.transactions !== undefined ? updates.transactions : transactions,
      history: updates.history !== undefined ? updates.history : history,
      currentMonth: updates.currentMonth !== undefined ? updates.currentMonth : currentMonth,
      rolloverBonuses: updates.rolloverBonuses !== undefined ? updates.rolloverBonuses : rolloverBonuses,
      cycleStartDay: updates.cycleStartDay !== undefined ? updates.cycleStartDay : cycleStartDay,
      trips: updates.trips !== undefined ? updates.trips : trips,
      activeTripId: updates.activeTripId !== undefined ? updates.activeTripId : activeTripId,
    };

    BudgetModel.saveLocalBackup(user?.id, dataToSave);
  }, [user, language, currency, monthlyIncome, activeProfile, categories, transactions, history, currentMonth, rolloverBonuses, cycleStartDay, trips, activeTripId]);

  // Fetch all user data
  const fetchUserData = useCallback(async (userId: string, isBackground = false) => {
    try {
      if (!isBackground) {
        setIsAuthLoading(true);
      }

      // 1. Profile settings
      const profile = await BudgetModel.fetchProfile(userId);
      let activeCur = 'IDR';
      if (profile) {
        setLanguage((profile.language as 'en' | 'id') || 'id');
        setCurrency(profile.currency || 'IDR');
        setMonthlyIncome(profile.monthlyIncome || 15000000);
        setCurrentMonth(profile.currentMonth || '2026-07');
        setActiveProfile(profile.activeProfile || 'joint');
        activeCur = profile.currency;
      }

      // 2. Categories
      let loadedCats = await BudgetModel.fetchCategories(userId);
      if (loadedCats.length === 0) {
        const defaultMult = activeCur === 'IDR' ? 15000 : activeCur === 'JPY' ? 150 : 1;
        loadedCats = await BudgetModel.initializeDefaultCategories(userId, defaultMult);
      }
      setCategories(loadedCats);

      // 3. Transactions
      const loadedTxs = await BudgetModel.fetchTransactions(userId);
      setTransactions(loadedTxs);

      // 4. History snapshots
      const loadedHistory = await BudgetModel.fetchHistory(userId);
      setHistory(loadedHistory);
      setRolloverBonuses({});

    } catch (err) {
      console.error('Error fetching user context:', err);
    } finally {
      if (!isBackground) {
        setIsAuthLoading(false);
      }
    }
  }, []);

  // Sync state when user session is established
  useEffect(() => {
    // 1. Auth state changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load from local storage or cloud when user changes
  useEffect(() => {
    if (user) {
      fetchUserData(user.id);

      // Load client local-only metadata caching
      const cached = BudgetModel.loadLocalBackup(user.id);
      if (cached) {
        if (cached.rolloverBonuses) setRolloverBonuses(cached.rolloverBonuses);
        if (cached.cycleStartDay) setCycleStartDay(Number(cached.cycleStartDay) || 1);
        if (cached.trips) setTrips(cached.trips);
        if (cached.activeTripId !== undefined) setActiveTripId(cached.activeTripId);
      }
    } else {
      // Guest local backup load
      const cached = BudgetModel.loadLocalBackup();
      if (cached) {
        setLanguage(cached.language || 'id');
        setCurrency(cached.currency || 'IDR');
        setMonthlyIncome(cached.monthlyIncome || 15000000);
        setCategories(cached.categories || DEFAULT_CATEGORIES.map(c => ({ ...c, limit: c.limit * 15000 })));
        setTransactions(cached.transactions || []);
        setHistory(cached.history || []);
        setRolloverBonuses(cached.rolloverBonuses || {});
        setCycleStartDay(Number(cached.cycleStartDay) || 1);
        setCurrentMonth(cached.currentMonth || '2026-07');
        setTrips(cached.trips || []);
        setActiveTripId(cached.activeTripId || null);
      } else {
        // Factory defaults
        setLanguage('id');
        setCurrency('IDR');
        setMonthlyIncome(15000000);
        setCategories(DEFAULT_CATEGORIES.map(c => ({ ...c, limit: c.limit * 15000 })));
        setTransactions([]);
        setHistory([]);
        setRolloverBonuses({});
        setCycleStartDay(1);
        setCurrentMonth('2026-07');
        setTrips([]);
        setActiveTripId(null);
      }
      setIsAuthLoading(false);
    }
  }, [user, fetchUserData]);

  // Real-time synchronization
  useEffect(() => {
    if (!user) return;

    const handleVisibilityAndFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchUserData(user.id, true);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityAndFocus);
    window.addEventListener('focus', handleVisibilityAndFocus);

    const channel = supabase
      .channel(`db-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${user.id}` },
        () => { fetchUserData(user.id, true); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => { fetchUserData(user.id, true); }
      )
      .subscribe();

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityAndFocus);
      window.removeEventListener('focus', handleVisibilityAndFocus);
      supabase.removeChannel(channel);
    };
  }, [user, fetchUserData]);

  // Dynamic Date Metrics Engine
  const dateMetrics = useMemo<DateMetrics>(() => {
    const now = new Date();
    const { startDate, endDate, totalDays } = getCycleDateRange(currentMonth, cycleStartDay);
    
    const startD = new Date(startDate + 'T00:00:00');
    const endD = new Date(endDate + 'T23:59:59');
    const isCurrentRealMonth = now >= startD && now <= endD;
    
    let elapsedDays = totalDays;
    if (isCurrentRealMonth) {
      const diffTime = Math.abs(now.getTime() - startD.getTime());
      elapsedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (elapsedDays < 1) elapsedDays = 1;
      if (elapsedDays > totalDays) elapsedDays = totalDays;
    }
    
    const pacingRatio = elapsedDays / totalDays;
    const daysRemaining = totalDays - elapsedDays;

    return {
      startDate,
      endDate,
      totalDays,
      elapsedDays,
      pacingRatio,
      daysRemaining,
      isCurrentRealMonth,
    };
  }, [currentMonth, cycleStartDay]);

  // Dynamic live aggregations & projections
  const budgetMetrics = useMemo<BudgetMetrics>(() => {
    const monthTransactions = transactions.filter(t => {
      return t.date >= dateMetrics.startDate && t.date <= dateMetrics.endDate;
    });

    const profileTransactions = monthTransactions.filter(t => {
      if (activeProfile === 'joint') return true;
      return t.spender === activeProfile;
    });

    const categorySpend: { [id: string]: number } = {};
    categories.forEach(c => {
      categorySpend[c.id] = 0;
    });

    profileTransactions.forEach(t => {
      if (categorySpend[t.categoryId] !== undefined) {
        categorySpend[t.categoryId] += t.amount;
      }
    });

    const enrichedCategories = categories.map(c => {
      const spent = categorySpend[c.id] || 0;
      const bonus = rolloverBonuses[c.id] || 0;
      const totalLimit = c.limit + bonus;
      const spentRatio = totalLimit > 0 ? spent / totalLimit : 0;
      
      let pacingStatus: 'green' | 'yellow' | 'red' = 'green';
      if (spentRatio > 1.0) {
        pacingStatus = 'red';
      } else if (dateMetrics.pacingRatio > 0) {
        const delta = spentRatio - dateMetrics.pacingRatio;
        if (delta > 0.15) {
          pacingStatus = 'red';
        } else if (delta > 0.02) {
          pacingStatus = 'yellow';
        }
      }

      const dailyBurn = dateMetrics.elapsedDays > 0 ? spent / dateMetrics.elapsedDays : 0;
      const projectedSpend = Math.round(dailyBurn * dateMetrics.totalDays);

      return {
        ...c,
        bonus,
        totalLimit,
        spent,
        spentRatio,
        pacingStatus,
        projectedSpend,
      };
    });

    let totalPlannedLimit = 0;
    let totalSpent = 0;
    let totalProjected = 0;

    const groupMetrics = {
      need: { planned: 0, spent: 0, projected: 0 },
      want: { planned: 0, spent: 0, projected: 0 },
      saving: { planned: 0, spent: 0, projected: 0 },
    };

    enrichedCategories.forEach(c => {
      totalPlannedLimit += c.totalLimit;
      totalSpent += c.spent;
      totalProjected += c.projectedSpend;

      if (groupMetrics[c.type as 'need' | 'want' | 'saving']) {
        groupMetrics[c.type as 'need' | 'want' | 'saving'].planned += c.totalLimit;
        groupMetrics[c.type as 'need' | 'want' | 'saving'].spent += c.spent;
        groupMetrics[c.type as 'need' | 'want' | 'saving'].projected += c.projectedSpend;
      }
    });

    const isOverpace = totalPlannedLimit > 0 && (totalSpent / totalPlannedLimit) > dateMetrics.pacingRatio + 0.05;

    return {
      enrichedCategories,
      profileTransactions,
      monthTransactions,
      totalPlannedLimit,
      totalSpent,
      totalProjected,
      groupMetrics,
      isOverpace,
    };
  }, [categories, transactions, dateMetrics, activeProfile, rolloverBonuses]);

  // Translation helpers
  const t = useCallback((key: string): string => {
    const dict = (translations[language] || translations['en']) as any;
    return dict[key] || translations['en'][key] || key;
  }, [language]);

  // Premium currency formatter
  const formatCurrency = useCallback((amount: number): string => {
    let locale = 'en-US';
    if (currency === 'IDR') locale = 'id-ID';
    else if (currency === 'JPY') locale = 'ja-JP';

    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
    };

    if (currency === 'IDR' || currency === 'JPY') {
      options.minimumFractionDigits = 0;
      options.maximumFractionDigits = 0;
    } else {
      options.minimumFractionDigits = 2;
      options.maximumFractionDigits = 2;
    }

    return new Intl.NumberFormat(locale, options).format(amount);
  }, [currency]);

  // Operations / Actions

  const selectLanguage = useCallback((lang: 'en' | 'id') => {
    setLanguage(lang);
    saveToLocalStorage({ language: lang });
    if (user) {
      BudgetModel.updateProfile(user.id, { language: lang } as any);
    }
  }, [user, saveToLocalStorage]);

  const selectCurrency = useCallback(async (newCur: string) => {
    if (newCur === currency) return;
    const oldCur = currency;

    const convertValue = (val: number, fromC: string, toC: string): number => {
      if (fromC === toC) return val;
      let usdVal = val;
      if (fromC === 'IDR') usdVal = val / 15000;
      else if (fromC === 'JPY') usdVal = val / 150;
      
      let targetVal = usdVal;
      if (toC === 'IDR') targetVal = usdVal * 15000;
      else if (toC === 'JPY') targetVal = usdVal * 150;
      
      return toC === 'USD' ? Math.round(targetVal * 100) / 100 : Math.round(targetVal);
    };

    const updatedIncome = convertValue(monthlyIncome, oldCur, newCur);
    setMonthlyIncome(updatedIncome);

    const updatedCategories = categories.map(c => ({
      ...c,
      limit: convertValue(c.limit, oldCur, newCur)
    }));
    setCategories(updatedCategories);

    const updatedTransactions = transactions.map(t => ({
      ...t,
      amount: convertValue(t.amount, oldCur, newCur)
    }));
    setTransactions(updatedTransactions);

    const updatedRolloverBonuses: { [key: string]: number } = {};
    Object.keys(rolloverBonuses).forEach(catId => {
      updatedRolloverBonuses[catId] = convertValue(rolloverBonuses[catId] || 0, oldCur, newCur);
    });
    setRolloverBonuses(updatedRolloverBonuses);

    const updatedHistory = history.map(h => ({
      ...h,
      monthlyIncome: convertValue(h.monthlyIncome, oldCur, newCur),
      categories: h.categories.map(c => ({
        ...c,
        limit: convertValue(c.limit, oldCur, newCur),
        spent: convertValue(c.spent || 0, oldCur, newCur),
        bonus: convertValue(c.bonus || 0, oldCur, newCur),
        totalLimit: convertValue(c.totalLimit || 0, oldCur, newCur)
      })),
      transactions: h.transactions.map(t => ({
        ...t,
        amount: convertValue(t.amount, oldCur, newCur)
      }))
    }));
    setHistory(updatedHistory);
    setCurrency(newCur);

    saveToLocalStorage({
      currency: newCur,
      monthlyIncome: updatedIncome,
      categories: updatedCategories,
      transactions: updatedTransactions,
      history: updatedHistory,
      rolloverBonuses: updatedRolloverBonuses
    });

    if (user) {
      setIsAuthLoading(true);
      await BudgetModel.syncAllToSupabase(user.id, updatedCategories, updatedTransactions, updatedHistory, {
        language,
        currency: newCur,
        monthlyIncome: updatedIncome,
        currentMonth,
        activeProfile
      });
      setIsAuthLoading(false);
    }
  }, [currency, monthlyIncome, categories, transactions, rolloverBonuses, history, user, language, currentMonth, activeProfile, saveToLocalStorage]);

  const saveTransaction = useCallback(async (transaction: Partial<Transaction>) => {
    const txId = transaction.id || 'tx-' + Math.random().toString(36).substr(2, 9);
    const txObj: Transaction = {
      id: txId,
      date: transaction.date || new Date().toISOString().split('T')[0],
      amount: Number(transaction.amount) || 0,
      categoryId: transaction.categoryId || 'uncategorized',
      spender: transaction.spender || 'joint',
      notes: transaction.notes || ''
    };

    let updatedTxs: Transaction[];
    if (transaction.id) {
      updatedTxs = transactions.map(t => t.id === transaction.id ? txObj : t);
    } else {
      updatedTxs = [txObj, ...transactions];
    }

    setTransactions(updatedTxs);
    saveToLocalStorage({ transactions: updatedTxs });

    if (user) {
      await BudgetModel.saveTransaction(user.id, txObj);
    }
  }, [transactions, user, saveToLocalStorage]);

  const deleteTransaction = useCallback(async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveToLocalStorage({ transactions: updated });

    if (user) {
      await BudgetModel.deleteTransaction(user.id, id);
    }
  }, [transactions, user, saveToLocalStorage]);

  const saveCategory = useCallback(async (category: Partial<Category>) => {
    const catId = category.id || 'cat-' + Math.random().toString(36).substr(2, 9);
    const catObj: Category = {
      id: catId,
      name: category.name || '',
      limit: Number(category.limit) || 0,
      icon: category.icon || '📦',
      type: category.type || 'need',
      color: category.color || '#4f46e5'
    };

    let updatedCats: Category[];
    if (category.id) {
      updatedCats = categories.map(c => c.id === category.id ? catObj : c);
    } else {
      updatedCats = [...categories, catObj];
    }

    setCategories(updatedCats);
    saveToLocalStorage({ categories: updatedCats });

    if (user) {
      await BudgetModel.saveCategory(user.id, catObj);
    }
  }, [categories, user, saveToLocalStorage]);

  const deleteCategory = useCallback(async (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    
    const updatedBonuses = { ...rolloverBonuses };
    delete updatedBonuses[id];
    setRolloverBonuses(updatedBonuses);

    saveToLocalStorage({ categories: updated, rolloverBonuses: updatedBonuses });

    if (user) {
      await BudgetModel.deleteCategory(user.id, id);
    }
  }, [categories, rolloverBonuses, user, saveToLocalStorage]);

  const selectProfile = useCallback((profile: 'me' | 'spouse' | 'joint') => {
    setActiveProfile(profile);
    saveToLocalStorage({ activeProfile: profile });
    if (user) {
      BudgetModel.updateProfile(user.id, { activeProfile: profile } as any);
    }
  }, [user, saveToLocalStorage]);

  const updateIncome = useCallback((income: number) => {
    setMonthlyIncome(income);
    saveToLocalStorage({ monthlyIncome: income });
    if (user) {
      BudgetModel.updateProfile(user.id, { monthlyIncome: income } as any);
    }
  }, [user, saveToLocalStorage]);

  const startNewMonth = useCallback(async (rolloverChoice: 'rollover' | 'fresh') => {
    const currentSnapshot: HistorySnapshot = {
      monthId: currentMonth,
      monthlyIncome,
      categories: budgetMetrics.enrichedCategories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        limit: c.limit,
        bonus: c.bonus || 0,
        totalLimit: c.totalLimit,
        spent: c.spent || 0,
        icon: c.icon || '📦',
        color: c.color || '#4f46e5'
      })),
      transactions: transactions.filter(t => t.date >= dateMetrics.startDate && t.date <= dateMetrics.endDate)
    };

    const updatedHistory = [currentSnapshot, ...history].slice(0, 12);

    const newRolloverBonuses: { [key: string]: number } = {};
    if (rolloverChoice === 'rollover') {
      budgetMetrics.enrichedCategories.forEach(c => {
        if (c.type === 'saving' || c.type === 'want') {
          const totalLimitVal = c.totalLimit ?? c.limit ?? 0;
          const remaining = totalLimitVal - (c.spent || 0);
          if (remaining > 0) {
            newRolloverBonuses[c.id] = Math.round(remaining);
          }
        }
      });
    }

    const parts = currentMonth.split('-');
    let year = parseInt(parts[0] || '2026');
    let month = parseInt(parts[1] || '07');
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const nextMonthStr = `${year}-${String(month).padStart(2, '0')}`;

    setCurrentMonth(nextMonthStr);
    setHistory(updatedHistory);
    setRolloverBonuses(newRolloverBonuses);

    saveToLocalStorage({
      currentMonth: nextMonthStr,
      history: updatedHistory,
      rolloverBonuses: newRolloverBonuses
    });

    if (user) {
      await BudgetModel.saveHistorySnapshot(user.id, currentSnapshot);
      await BudgetModel.updateProfile(user.id, { currentMonth: nextMonthStr } as any);
    }
  }, [currentMonth, monthlyIncome, budgetMetrics, transactions, dateMetrics, history, user, saveToLocalStorage]);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify({
      language,
      currency,
      monthlyIncome,
      activeProfile,
      categories,
      transactions,
      history,
      currentMonth,
      rolloverBonuses,
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `harmony_budget_backup_${currentMonth}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [language, currency, monthlyIncome, activeProfile, categories, transactions, history, currentMonth, rolloverBonuses]);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.categories || !parsed.transactions) {
        alert('Format file cadangan tidak valid.');
        return false;
      }
      
      const lang = parsed.language || language;
      const cur = parsed.currency || currency;
      const income = parsed.monthlyIncome || monthlyIncome;
      const cats = parsed.categories;
      const txs = parsed.transactions;
      const hist = parsed.history || [];
      const curMonth = parsed.currentMonth || currentMonth;
      const bonuses = parsed.rolloverBonuses || {};
      const activeProf = parsed.activeProfile || activeProfile;

      setLanguage(lang);
      setCurrency(cur);
      setMonthlyIncome(income);
      setCategories(cats);
      setTransactions(txs);
      setHistory(hist);
      setCurrentMonth(curMonth);
      setRolloverBonuses(bonuses);
      setActiveProfile(activeProf);

      saveToLocalStorage({
        language: lang,
        currency: cur,
        monthlyIncome: income,
        activeProfile: activeProf,
        categories: cats,
        transactions: txs,
        history: hist,
        currentMonth: curMonth,
        rolloverBonuses: bonuses,
      });

      if (user) {
        setIsAuthLoading(true);
        await BudgetModel.syncAllToSupabase(user.id, cats, txs, hist, {
          language: lang,
          currency: cur,
          monthlyIncome: income,
          currentMonth: curMonth,
          activeProfile: activeProf
        });
        setIsAuthLoading(false);
      }

      return true;
    } catch (e) {
      console.error(e);
      alert('Gagal membaca file cadangan.');
      return false;
    }
  }, [language, currency, monthlyIncome, currentMonth, activeProfile, user, saveToLocalStorage]);

  const resetToFresh = useCallback(async () => {
    const defaultCats = DEFAULT_CATEGORIES;
    setLanguage('id');
    setCurrency('IDR');
    setMonthlyIncome(15000000);
    setActiveProfile('joint');
    setCategories(defaultCats.map(c => ({ ...c, limit: c.limit * 15000 })));
    setTransactions([]);
    setHistory([]);
    setCurrentMonth('2026-07');
    setRolloverBonuses({});
    setTrips([]);
    setActiveTripId(null);

    if (typeof window !== 'undefined') {
      const key = BudgetModel.getLocalStorageKey(user?.id);
      localStorage.removeItem(key);
      localStorage.removeItem('harmony_budget_state_guest');
      localStorage.removeItem('harmony_budget_state');
    }

    if (user) {
      setIsAuthLoading(true);
      await BudgetModel.clearUserData(user.id);
      await BudgetModel.updateProfile(user.id, {
        language: 'id',
        currency: 'IDR',
        monthlyIncome: 15000000,
        currentMonth: '2026-07',
        activeProfile: 'joint'
      });
      const defaultMult = 15000;
      await BudgetModel.initializeDefaultCategories(user.id, defaultMult);
      setIsAuthLoading(false);
    }
  }, [user]);



  const signOut = useCallback(async () => {
    try {
      setIsAuthLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // Traveling Mode Actions

  const fetchExchangeRates = useCallback(async () => {
    const rates = await TravelingModel.fetchExchangeRates(user?.id);
    setExchangeRates(rates);
    return rates;
  }, [user]);

  const saveTrip = useCallback((trip: Partial<Trip>) => {
    const tripId = trip.id || 'trip-' + Math.random().toString(36).substr(2, 9);
    const tripObj: Trip = {
      id: tripId,
      name: trip.name || '',
      startDate: trip.startDate || '',
      endDate: trip.endDate || '',
      totalBudget: Number(trip.totalBudget) || 0,
      currency: trip.currency || 'USD',
      archived: !!trip.archived,
      categories: trip.categories || []
    };

    const updated = trip.id 
      ? trips.map(t => t.id === trip.id ? tripObj : t)
      : [...trips, tripObj];

    setTrips(updated);

    let activeId = activeTripId;
    if (!activeTripId && updated.length === 1) {
      activeId = tripId;
      setActiveTripId(tripId);
    }

    saveToLocalStorage({ trips: updated, activeTripId: activeId });
  }, [trips, activeTripId, saveToLocalStorage]);

  const deleteTrip = useCallback((id: string) => {
    const updated = trips.filter(t => t.id !== id);
    setTrips(updated);

    let activeId = activeTripId;
    if (activeTripId === id) {
      activeId = updated.length > 0 ? (updated[0]?.id || null) : null;
      setActiveTripId(activeId);
    }

    saveToLocalStorage({ trips: updated, activeTripId: activeId });
  }, [trips, activeTripId, saveToLocalStorage]);

  return {
    user,
    isAuthLoading,
    language,
    currency,
    monthlyIncome,
    activeProfile,
    categories: budgetMetrics.enrichedCategories,
    rawCategories: categories,
    transactions: budgetMetrics.profileTransactions,
    allMonthTransactions: budgetMetrics.monthTransactions,
    rawTransactions: transactions,
    history,
    currentMonth,
    cycleStartDay,
    rolloverBonuses,
    dateMetrics,
    budgetMetrics,
    
    // Translation and Currency helpers
    t,
    formatCurrency,
    selectLanguage,
    selectCurrency,
    selectCycleStartDay: (day: number) => {
      const parsedDay = Math.max(1, Math.min(28, Number(day) || 1));
      setCycleStartDay(parsedDay);
      saveToLocalStorage({ cycleStartDay: parsedDay });
    },
    confirmDialog,
    showConfirm,
    closeConfirm,

    theme,
    toggleTheme,

    // Actions
    saveTransaction,
    deleteTransaction,
    saveCategory,
    deleteCategory,
    selectProfile,
    updateIncome,
    startNewMonth,
    exportData,
    importData,
    resetToFresh,
    signOut,

    // Traveling Mode
    trips,
    activeTripId,
    setActiveTripId: (id: string | null) => {
      setActiveTripId(id);
      saveToLocalStorage({ activeTripId: id });
    },
    exchangeRates,
    fetchExchangeRates,
    saveTrip,
    deleteTrip,
  };
}
