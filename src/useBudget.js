import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

// --- Translation Dictionary (English and Indonesian ID) ---
const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    ledgerBook: 'Ledger Book',
    categoryPlanner: 'Category Planner',
    historyRollovers: 'History & Rollovers',
    portabilityBackups: 'Portability Backups',
    exportBackup: 'Export JSON Backup',
    importBackup: 'Import JSON Backup',
    activeProfile: 'Active Profile',
    husband: 'Husband',
    wife: 'Wife',
    familyView: 'Family View',
    monthlyDashboard: 'Monthly Dashboard',
    trackingBudgetsFor: 'Tracking budgets for',
    in: 'in',
    logExpense: 'Log Expense',
    monthProgress: 'Month Progress',
    daysPassed: 'days passed',
    elapsed: 'elapsed',
    budgetExceeded: 'Joint Monthly Budget Exceeded!',
    pacingWarning: 'Warning: Fast Spending Pace Detected!',
    spendingOnTrack: 'Spending is On Track!',
    projectedMonthEnd: 'Projected Month-End',
    totalMonthlyLimit: 'Total Monthly Limit',
    actualSpent: 'Actual Spent',
    pacingBurnRate: 'Pacing Burn Rate',
    remaining: 'Remaining',
    ofJointIncome: 'Of joint income',
    daysRemainingThisMonth: 'days remaining this month',
    day: 'day',
    budgetProgressCategory: 'Budget Progress per Category',
    pacingLineRepresentedBy: 'Pacing line represented by',
    spendingGroups: 'Spending Groups',
    essentialNeeds: 'Essential Needs',
    personalWants: 'Personal Wants',
    savingsGoalsInvestments: 'Savings & Investments',
    pacingWarnings: 'Pacing Warnings',
    greatJobPacing: '🎉 Great job! All active categories are safely keeping pace.',
    warningOverpace: 'Overpace!',
    warningSlightlyAhead: 'Slightly ahead',
    transactionsLedger: 'Transactions Ledger',
    verifyOrModify: 'Verify or modify expenses for this month',
    searchNotesCategory: 'Search notes or category name...',
    spender: 'Spender',
    allCategories: 'All Categories',
    noTransactionsFound: 'No transactions found',
    clearFiltersSearch: 'Try clearing filters or search queries',
    logExpensesActive: 'Log some expenses to start active tracking!',
    date: 'Date',
    category: 'Category',
    notes: 'Notes',
    amount: 'Amount',
    actions: 'Actions',
    editExpenseEntry: 'Edit Expense Entry',
    logDailyExpense: 'Log Daily Expense',
    spenderAttribution: 'Spender Attribution',
    budgetCategory: 'Budget Category',
    chooseCategory: 'Choose Category...',
    notesDescription: 'Notes / Description',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    logTransaction: 'Log Transaction',
    addCustomCategory: 'Add Custom Category',
    jointMonthlyIncome: 'Joint Monthly Income',
    unallocatedSurplus: 'Unallocated Surplus',
    unallocated: 'Unallocated',
    targetFifty: 'Target 50%',
    targetThirty: 'Target 30%',
    targetTwenty: 'Target 20%',
    surplus: 'Surplus',
    needsDesc: 'Non-negotiable fixed expenses like rent, bills, insurance, and core groceries.',
    wantsDesc: 'Discretionary items like eating out, shopping, hobbies, and vacation deposits.',
    savingsDesc: 'Wealth-building lines, emergency buffers, and targeted high-value saving goals.',
    categoryEnvelopeName: 'Category Envelope Name',
    groupingClassification: 'Grouping Classification',
    monthlyDollarBudget: 'Joint Monthly Dollar Budget',
    accentColor: 'Accent Color',
    updateEnvelope: 'Update Envelope',
    createCategory: 'Create Category',
    historicalAnalysis: 'Historical Analysis',
    comparePastBudgets: 'Compare past monthly budgets, analyze trends, and roll over remaining funds',
    currentMonthTransition: 'Current Month Transition Wizard',
    transitionWizardDesc: 'Ready to close out this month? Running the transition logs a completed snapshot of all category actual limits and spend histories. You can configure carryover rules for unused budgets.',
    triggerRolloverWizard: 'Trigger Rollover Wizard',
    monthlyPlannedActualTrend: 'Monthly Planned vs. Actual Trend',
    pastReportsInspector: 'Past Reports Inspector',
    viewFullCategory: 'View full category progress metrics and lists from completed months',
    chooseMonth: 'Choose Month...',
    pastReportsSnapshot: 'Past Reports Snapshot',
    envelopesStatusSheets: 'Envelopes Status Sheets',
    snapshotTransactionsLedger: 'Snapshot Transactions Ledger',
    startNewMonthWizard: 'Monthly Transition Wizard',
    transitionWizardDialogDesc: 'This wizard will close out our session, snap-logging all budgets and spending files to completed archives. We will start a fresh month with your customized budget templates.',
    chooseRolloverCarryoverRule: 'Choose Rollover carry-over rule:',
    rolloverRemainingFunds: 'Rollover Remaining Funds (Recommended)',
    rolloverFundsDesc: 'Unspent limits under "Personal Wants" and "Savings & Goals" will carry forward as limits bonuses into next month.',
    cleanFreshStart: 'Clean Fresh Start',
    freshStartDesc: 'Zero roll-over carryover. All category budgets reset exactly to standard templates for a clean fresh sheet.',
    startNewMonth: 'Start New Month',
    language: 'Language',
    currency: 'Currency',
    
    // New additions
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    jointMonth: 'joint/month',
    customizeEnvelopesDesc: 'Customize your Needs, Wants, and Savings envelopes and allocate joint income',
    jointIncomeDesc: 'Setting our joint household income helps the visual helper calculate percentages for 50/30/20 rule allocation insights.',
    totalAllocated: 'Total Allocated',
    jointTargets: '50/30/20 Joint Targets',
    needsLabel: 'Needs',
    wantsLabel: 'Wants',
    savingsLabel: 'Savings',
    surplusLabel: 'Surplus',
    insightsNormal: 'Needs are well under 50%, beautiful breathing room!',
    insightsNeedsHigh: 'Needs are high! Consider trimming lease packages.',
    insightsSavingsLow: 'Try routing some unallocated surplus to your emergency fund to hit the 20% target.',
    insightsSavingsGood: 'Excellent saving rate!',
    editCategoryEnvelope: 'Edit Category Envelope',
    confirmDeleteCategory: 'Are you sure you want to delete the category "{name}"? All existing transactions linked to this category will appear as Uncategorized.',
    loadDemoData: 'Load Demo Data',
    resetAll: 'Reset All',
    confirmLoadDemo: 'Are you sure you want to reload 3-months of pre-loaded demo data? This will overwrite your current logs.',
    confirmResetAll: 'Completely clear and reset all budgets, custom categories, and transactions? This cannot be undone.',
    noHistoryLogged: 'No historical reports logged yet. Click "Trigger Rollover Wizard" above to close out this month and start a historical sequence!',
    totalPlannedLimits: 'Total Planned Envelope Limits',
    actualSpendUnder: 'Actual Spend (Under Budget)',
    actualSpendOver: 'Actual Spend (Over Budget)',
    selectPastMonthInspector: 'Select a past month snapshot from the dropdown to load its full detailed ledger and progress sheets.',
    snapshotBudgetLimit: 'Snapshot Budget Limit',
    actualSnapshotSpent: 'Actual Snapshot Spent',
    spentOf: 'spent of',
    noTransactionsLoggedMonth: 'No transactions logged for this completed month.',
    confirmDeleteTransaction: 'Are you sure you want to delete this expense?',
    noDescription: 'No description',
    uncategorized: 'Uncategorized',
    plannedLimit: 'Planned limit',
    actualSpend: 'Actual spend',
    currencyDisclaimer: 'If switching currencies, reload demo data under History to scale mock metrics!'
  },
  id: {
    dashboard: 'Dashboard',
    ledgerBook: 'Buku Ledger',
    categoryPlanner: 'Rencana Kategori',
    historyRollovers: 'Riwayat & Rollover',
    portabilityBackups: 'Cadangan Data',
    exportBackup: 'Ekspor Cadangan JSON',
    importBackup: 'Impor Cadangan JSON',
    activeProfile: 'Profil Aktif',
    husband: 'Suami',
    wife: 'Istri',
    familyView: 'Tampilan Keluarga',
    monthlyDashboard: 'Dashboard Bulanan',
    trackingBudgetsFor: 'Melacak anggaran untuk',
    in: 'di',
    logExpense: 'Catat Pengeluaran',
    monthProgress: 'Progres Bulan Ini',
    daysPassed: 'hari berlalu',
    elapsed: 'berlalu',
    budgetExceeded: 'Anggaran Bulanan Bersama Terlampaui!',
    pacingWarning: 'Peringatan: Pengeluaran Terlalu Cepat!',
    spendingOnTrack: 'Pengeluaran Sesuai Rencana!',
    projectedMonthEnd: 'Proyeksi Akhir Bulan',
    totalMonthlyLimit: 'Batas Anggaran Bulanan',
    actualSpent: 'Pengeluaran Aktual',
    pacingBurnRate: 'Laju Pengeluaran Harian',
    remaining: 'Sisa',
    ofJointIncome: 'Dari pendapatan bersama',
    daysRemainingThisMonth: 'hari tersisa bulan ini',
    day: 'hari',
    budgetProgressCategory: 'Progres Anggaran per Kategori',
    pacingLineRepresentedBy: 'Batas laju harian diwakili oleh',
    spendingGroups: 'Kelompok Pengeluaran',
    essentialNeeds: 'Kebutuhan Pokok',
    personalWants: 'Keinginan Pribadi',
    savingsGoalsInvestments: 'Tabungan & Investasi',
    pacingWarnings: 'Peringatan Laju Harian',
    greatJobPacing: '🎉 Kerja bagus! Semua kategori aktif aman sesuai laju harian.',
    warningOverpace: 'Terlalu Cepat!',
    warningSlightlyAhead: 'Sedikit di atas laju',
    transactionsLedger: 'Buku Catatan Transaksi',
    verifyOrModify: 'Verifikasi atau ubah pengeluaran untuk bulan ini',
    searchNotesCategory: 'Cari catatan atau nama kategori...',
    spender: 'Pembuat Transaksi',
    allCategories: 'Semua Kategori',
    noTransactionsFound: 'Tidak ada transaksi ditemukan',
    clearFiltersSearch: 'Coba bersihkan filter atau kata pencarian',
    logExpensesActive: 'Catat beberapa pengeluaran untuk mulai melacak aktif!',
    date: 'Tanggal',
    category: 'Kategori',
    notes: 'Catatan',
    amount: 'Jumlah',
    actions: 'Aksi',
    editExpenseEntry: 'Ubah Catatan Pengeluaran',
    logDailyExpense: 'Catat Pengeluaran Harian',
    spenderAttribution: 'Atribusi Spender',
    budgetCategory: 'Kategori Anggaran',
    chooseCategory: 'Pilih Kategori...',
    notesDescription: 'Catatan / Deskripsi',
    cancel: 'Batal',
    saveChanges: 'Simpan Perubahan',
    logTransaction: 'Simpan Transaksi',
    addCustomCategory: 'Tambah Kategori Kustom',
    jointMonthlyIncome: 'Pendapatan Bulanan Bersama',
    unallocatedSurplus: 'Surplus Belum Dialokasikan',
    unallocated: 'Belum Dialokasikan',
    targetFifty: 'Target 50%',
    targetThirty: 'Target 30%',
    targetTwenty: 'Target 20%',
    surplus: 'Surplus',
    needsDesc: 'Pengeluaran tetap yang tidak bisa ditawar seperti sewa, tagihan, asuransi, dan bahan makanan pokok.',
    wantsDesc: 'Barang pilihan/opsional seperti makan di luar, belanja, hobi, dan cicilan liburan.',
    savingsDesc: 'Jalur penumpukan kekayaan, dana darurat, dan target tabungan bernilai tinggi.',
    categoryEnvelopeName: 'Nama Amplop Kategori',
    groupingClassification: 'Klasifikasi Pengelompokan',
    monthlyDollarBudget: 'Anggaran Bulanan Bersama bersama/bulan',
    accentColor: 'Warna Aksen',
    updateEnvelope: 'Perbarui Amplop',
    createCategory: 'Buat Kategori',
    historicalAnalysis: 'Analisis Riwayat',
    comparePastBudgets: 'Bandingkan anggaran bulan lalu, analisis tren, dan lakukan rollover sisa dana',
    currentMonthTransition: 'Panduan Transisi Bulan Baru',
    transitionWizardDesc: 'Siap untuk menutup bulan ini? Menjalankan transisi akan menyimpan rekaman lengkap dari semua batas kategori dan riwayat pengeluaran aktual. Anda dapat mengatur aturan bawaan untuk anggaran yang tidak terpakai.',
    triggerRolloverWizard: 'Jalankan Panduan Rollover',
    monthlyPlannedActualTrend: 'Tren Rencana vs. Aktual Bulanan',
    pastReportsInspector: 'Inspektur Laporan Masa Lalu',
    viewFullCategory: 'Lihat metrik progres kategori lengkap dan daftar dari bulan-bulan yang telah selesai',
    chooseMonth: 'Pilih Bulan...',
    pastReportsSnapshot: 'Rekaman Laporan Masa Lalu',
    envelopesStatusSheets: 'Lembar Status Amplop',
    snapshotTransactionsLedger: 'Buku Ledger Transaksi Masa Lalu',
    startNewMonthWizard: 'Panduan Transisi Bulanan',
    transitionWizardDialogDesc: 'Panduan ini akan menutup sesi bulan ini, menyimpan semua anggaran dan file pengeluaran ke arsip yang telah selesai. Kita akan memulai bulan baru dengan template anggaran kustom Anda.',
    chooseRolloverCarryoverRule: 'Pilih aturan transfer rollover:',
    rolloverRemainingFunds: 'Rollover Sisa Dana (Direkomendasikan)',
    rolloverFundsDesc: 'Sisa dana yang tidak terpakai di bawah "Keinginan Pribadi" dan "Tabungan & Investasi" akan dialihkan sebagai bonus batas ke bulan berikutnya.',
    cleanFreshStart: 'Mulai Baru yang Bersih',
    freshStartDesc: 'Tanpa transfer sisa dana. Semua anggaran kategori disetel ulang persis ke template standar untuk lembar baru yang bersih.',
    startNewMonth: 'Mulai Bulan Baru',
    language: 'Bahasa',
    currency: 'Mata Uang',
    
    // New additions
    edit: 'Ubah',
    delete: 'Hapus',
    save: 'Simpan',
    jointMonth: 'bersama/bulan',
    customizeEnvelopesDesc: 'Sesuaikan amplop Kebutuhan, Keinginan, dan Tabungan Anda serta alokasikan pendapatan bersama',
    jointIncomeDesc: 'Mengatur pendapatan rumah tangga bersama membantu alat bantu visual menghitung persentase untuk wawasan alokasi aturan 50/30/20.',
    totalAllocated: 'Total Dialokasikan',
    jointTargets: 'Target Bersama 50/30/20',
    needsLabel: 'Kebutuhan',
    wantsLabel: 'Keinginan',
    savingsLabel: 'Tabungan',
    surplusLabel: 'Surplus',
    insightsNormal: 'Kebutuhan di bawah 50%, ruang bernapas yang indah!',
    insightsNeedsHigh: 'Kebutuhan tinggi! Pertimbangkan untuk memangkas paket sewa.',
    insightsSavingsLow: 'Coba alihkan sebagian surplus yang belum dialokasikan ke dana darurat untuk mencapai target 20%.',
    insightsSavingsGood: 'Tingkat tabungan yang luar biasa!',
    editCategoryEnvelope: 'Ubah Amplop Kategori',
    confirmDeleteCategory: 'Apakah Anda yakin ingin menghapus kategori "{name}"? Semua transaksi yang ditautkan ke kategori ini akan muncul sebagai Belum Dikategorikan.',
    loadDemoData: 'Muat Data Demo',
    resetAll: 'Reset Semua',
    confirmLoadDemo: 'Apakah Anda yakin ingin memuat ulang 3 bulan data demo? Ini akan menimpa catatan Anda saat ini.',
    confirmResetAll: 'Hapus dan atur ulang semua anggaran, kategori kustom, dan transaksi? Tindakan ini tidak dapat dibatalkan.',
    noHistoryLogged: 'Belum ada laporan riwayat yang dicatat. Klik "Jalankan Panduan Rollover" di atas untuk menutup bulan ini dan memulai urutan riwayat!',
    totalPlannedLimits: 'Total Batas Amplop yang Direncanakan',
    actualSpendUnder: 'Pengeluaran Aktual (Di Bawah Anggaran)',
    actualSpendOver: 'Pengeluaran Aktual (Melebihi Anggaran)',
    selectPastMonthInspector: 'Pilih rekaman bulan lalu dari menu dropdown untuk memuat buku besar terperinci dan lembar progres lengkapnya.',
    snapshotBudgetLimit: 'Batas Anggaran Rekaman',
    actualSnapshotSpent: 'Pengeluaran Rekaman Aktual',
    spentOf: 'terpakai dari',
    noTransactionsLoggedMonth: 'Tidak ada transaksi yang dicatat untuk bulan yang selesai ini.',
    confirmDeleteTransaction: 'Apakah Anda yakin ingin menghapus pengeluaran ini?',
    noDescription: 'Tanpa deskripsi',
    uncategorized: 'Belum Dikategorikan',
    plannedLimit: 'Batas direncanakan',
    actualSpend: 'Pengeluaran aktual',
    currencyDisclaimer: 'Jika berpindah mata uang, muat ulang data demo di Riwayat untuk menyesuaikan metrik!'
  }
};

// Default Category Templates in USD values (These scale dynamically when changing currency!)
const DEFAULT_CATEGORIES = [
  // Needs
  { id: 'cat-rent', name: 'Rent & Mortgage', type: 'need', limit: 1500, color: '#ec4899', icon: '🏠' },
  { id: 'cat-groceries', name: 'Groceries', type: 'need', limit: 600, color: '#f43f5e', icon: '🛒' },
  { id: 'cat-utilities', name: 'Utilities & Bills', type: 'need', limit: 350, color: '#eab308', icon: '⚡' },
  { id: 'cat-transport', name: 'Transport & Fuel', type: 'need', limit: 250, color: '#a855f7', icon: '🚗' },
  
  // Wants
  { id: 'cat-dining', name: 'Dining Out', type: 'want', limit: 300, color: '#3b82f6', icon: '🍔' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'want', limit: 200, color: '#06b6d4', icon: '🎬' },
  { id: 'cat-shopping', name: 'Shopping', type: 'want', limit: 250, color: '#14b8a6', icon: '🛍️' },
  { id: 'cat-vacation', name: 'Vacation Fund', type: 'want', limit: 400, color: '#f97316', icon: '✈️' },
  
  // Savings
  { id: 'cat-emergency', name: 'Emergency Fund', type: 'saving', limit: 500, color: '#10b981', icon: '🛡️' },
  { id: 'cat-investments', name: 'Investments', type: 'saving', limit: 600, color: '#059669', icon: '📈' },
];

const getCycleDateRange = (monthStr, startDay) => {
  const [year, month] = monthStr.split('-').map(Number);
  if (startDay === 1) {
    const lastDay = new Date(year, month, 0).getDate();
    return {
      startDate: `${monthStr}-01`,
      endDate: `${monthStr}-${String(lastDay).padStart(2, '0')}`,
      totalDays: lastDay
    };
  } else {
    // Custom payroll billing cycle (e.g. 25th of last month to 24th of this month)
    const prevDate = new Date(year, month - 2, startDay);
    const nextDate = new Date(year, month - 1, startDay - 1);
    
    const startYear = prevDate.getFullYear();
    const startMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    const startDayStr = String(prevDate.getDate()).padStart(2, '0');
    
    const endYear = nextDate.getFullYear();
    const endMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    const endDayStr = String(nextDate.getDate()).padStart(2, '0');
    
    const diffTime = Math.abs(nextDate - prevDate);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      startDate: `${startYear}-${startMonth}-${startDayStr}`,
      endDate: `${endYear}-${endMonth}-${endDayStr}`,
      totalDays
    };
  }
};

export function useBudget() {
  // --- Core State ---
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [language, setLanguage] = useState('id'); // 'en' | 'id'
  const [currency, setCurrency] = useState('IDR'); // 'USD' | 'IDR' | 'JPY'
  const [monthlyIncome, setMonthlyIncome] = useState(15000000);
  const [activeProfile, setActiveProfile] = useState('joint'); // 'me' | 'spouse' | 'joint'
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('2026-07');
  const [cycleStartDay, setCycleStartDay] = useState(1); // 1 to 28
  const [rolloverBonuses, setRolloverBonuses] = useState({}); // { categoryId: bonusAmount }
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm, title, isDanger, confirmText, cancelText }

  // Theme support
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('harmony_budget_theme');
    if (saved) return saved;
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('harmony_budget_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Custom confirmation dialog trigger
  const showConfirm = ({ message, onConfirm, title = '', isDanger = true, confirmText = '', cancelText = '' }) => {
    setConfirmDialog({ message, onConfirm, title, isDanger, confirmText, cancelText });
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  // --- Supabase Authentication & Real-time Database Sync ---

  // Auth session listener
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all user-scoped data from Supabase
  const fetchUserData = async (userId) => {
    try {
      setIsAuthLoading(true);

      // 1. Fetch Profile settings
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileErr) throw profileErr;

      let currentLang = 'id';
      let currentCur = 'IDR';
      let currentInc = 15000000;
      let curMonth = '2026-07';
      let activeProf = 'joint';

      if (profileData) {
        currentLang = profileData.language || 'id';
        currentCur = profileData.currency || 'IDR';
        currentInc = Number(profileData.monthly_income) || 15000000;
        curMonth = profileData.current_month || '2026-07';
        activeProf = profileData.active_profile || 'joint';

        setLanguage(currentLang);
        setCurrency(currentCur);
        setMonthlyIncome(currentInc);
        setCurrentMonth(curMonth);
        setActiveProfile(activeProf);
      }

      // 2. Fetch Categories (Envelopes)
      const { data: catData, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (catErr) throw catErr;

      let loadedCategories = [];
      if (catData && catData.length > 0) {
        loadedCategories = catData.map(c => ({
          id: c.id,
          name: c.name,
          limit: Number(c.limit_amount),
          icon: c.icon,
          type: c.type,
          color: c.color
        }));
        setCategories(loadedCategories);
      } else {
        // Initialize default categories in database if none exist yet
        const defaultMult = currentCur === 'IDR' ? 15000 : currentCur === 'JPY' ? 150 : 1;
        const initialCategories = DEFAULT_CATEGORIES.map(c => ({
          id: c.id,
          user_id: userId,
          name: c.name,
          limit_amount: c.limit * defaultMult,
          icon: c.icon,
          type: c.type,
          color: c.color
        }));

        const { error: insertCatErr } = await supabase
          .from('categories')
          .insert(initialCategories);

        if (insertCatErr) throw insertCatErr;

        loadedCategories = initialCategories.map(c => ({
          id: c.id,
          name: c.name,
          limit: Number(c.limit_amount),
          icon: c.icon,
          type: c.type,
          color: c.color
        }));
        setCategories(loadedCategories);
      }

      // 3. Fetch Transactions
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (txErr) throw txErr;

      let loadedTransactions = [];
      if (txData) {
        loadedTransactions = txData.map(t => ({
          id: t.id,
          date: t.date,
          amount: Number(t.amount),
          categoryId: t.category_id,
          spender: t.spender,
          notes: t.notes || ''
        }));
      }
      setTransactions(loadedTransactions);

      // 4. Fetch History
      const { data: histData, error: histErr } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('month_id', { ascending: false });

      if (histErr) throw histErr;

      let loadedHistory = [];
      if (histData) {
        loadedHistory = histData.map(h => ({
          monthId: h.month_id,
          monthlyIncome: Number(h.monthly_income),
          categories: h.categories || [],
          transactions: h.transactions || []
        }));
      }
      setHistory(loadedHistory);
      setRolloverBonuses({});

    } catch (e) {
      console.error('Error fetching user data from Supabase:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sync state when user logs in or out
  useEffect(() => {
    if (user) {
      fetchUserData(user.id);
      
      // Load user-specific cached local state (like rolloverBonuses & cycleStartDay)
      try {
        const cached = localStorage.getItem(`harmony_budget_state_${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.rolloverBonuses) setRolloverBonuses(parsed.rolloverBonuses);
          if (parsed.cycleStartDay) setCycleStartDay(parsed.cycleStartDay || 1);
        }
      } catch (err) {
        console.error('Error loading cached states:', err);
      }
    } else {
      // Offline / logged out sandbox default state (IDR based)
      try {
        const cached = localStorage.getItem('harmony_budget_state_guest') || localStorage.getItem('harmony_budget_state');
        if (cached) {
          const parsed = JSON.parse(cached);
          setLanguage(parsed.language || 'id');
          setCurrency(parsed.currency || 'IDR');
          setMonthlyIncome(parsed.monthlyIncome || 15000000);
          setCategories(parsed.categories || DEFAULT_CATEGORIES.map(c => ({ ...c, limit: c.limit * 15000 })));
          setTransactions(parsed.transactions || []);
          setHistory(parsed.history || []);
          setRolloverBonuses(parsed.rolloverBonuses || {});
          setCycleStartDay(parsed.cycleStartDay || 1);
          setCurrentMonth(parsed.currentMonth || '2026-07');
          return;
        }
      } catch (e) {
        console.error('Error loading guest cache:', e);
      }

      setLanguage('id');
      setCurrency('IDR');
      setMonthlyIncome(15000000);
      setCategories(DEFAULT_CATEGORIES.map(c => ({ ...c, limit: c.limit * 15000 })));
      setTransactions([]);
      setHistory([]);
      setRolloverBonuses({});
      setCycleStartDay(1);
      setCurrentMonth('2026-07');
    }
  }, [user]);

  // Profiles settings table updater
  const updateSupabaseProfile = async (updates) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (error) console.error('Failed to sync profile to Supabase:', error);
  };

  // Save State Helper (Used for fallback/backup offline)
  const saveToLocalStorage = (updates) => {
    const stateToSave = {
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
    };
    const key = user ? `harmony_budget_state_${user.id}` : 'harmony_budget_state_guest';
    localStorage.setItem(key, JSON.stringify(stateToSave));
  };

  // --- Localization translation helper ---
  const t = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    return dict[key] || TRANSLATIONS['en'][key] || key;
  };

  // --- Premium currency formatting helper using Intl.NumberFormat ---
  const formatCurrency = (amount) => {
    let locale = 'en-US';
    if (currency === 'IDR') locale = 'id-ID';
    else if (currency === 'JPY') locale = 'ja-JP';

    const options = {
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
  };

  // --- Real-time Date and Pacing Engine ---
  const dateMetrics = useMemo(() => {
    const now = new Date();
    const { startDate, endDate, totalDays } = getCycleDateRange(currentMonth, cycleStartDay);
    
    // Check if current real-world date is within this cycle
    const startD = new Date(startDate + 'T00:00:00');
    const endD = new Date(endDate + 'T23:59:59');
    const isCurrentRealMonth = now >= startD && now <= endD;
    
    let elapsedDays = totalDays;
    if (isCurrentRealMonth) {
      const diffTime = Math.abs(now - startD);
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

  // --- Live Dynamic Aggregations & Calculations ---
  const budgetMetrics = useMemo(() => {
    const monthTransactions = transactions.filter(t => {
      return t.date >= dateMetrics.startDate && t.date <= dateMetrics.endDate;
    });

    const profileTransactions = monthTransactions.filter(t => {
      if (activeProfile === 'joint') return true;
      return t.spender === activeProfile;
    });

    const categorySpend = {};
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
      
      let pacingStatus = 'green';
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

      if (groupMetrics[c.type]) {
        groupMetrics[c.type].planned += c.totalLimit;
        groupMetrics[c.type].spent += c.spent;
        groupMetrics[c.type].projected += c.projectedSpend;
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
  }, [categories, transactions, currentMonth, activeProfile, rolloverBonuses, dateMetrics]);

  // --- Operations / Actions ---

  // Helper to bulk sync all active states to Supabase (Dry and clean)
  const syncAllToSupabase = async (cats, txs, hist, income, curMonth, lang, cur, activeProf) => {
    if (!user) return;
    try {
      setIsAuthLoading(true);

      // 1. Delete all user categories, transactions, and history to prevent unique constraint conflicts
      await supabase.from('transactions').delete().eq('user_id', user.id);
      await supabase.from('categories').delete().eq('user_id', user.id);
      await supabase.from('history').delete().eq('user_id', user.id);

      // 2. Upsert Profiles row
      await supabase.from('profiles').upsert({
        id: user.id,
        language: lang || language,
        currency: cur || currency,
        monthly_income: income !== undefined ? income : monthlyIncome,
        current_month: curMonth || currentMonth,
        active_profile: activeProf || activeProfile
      });

      // 3. Insert categories if any
      if (cats && cats.length > 0) {
        const dbCats = cats.map(c => ({
          id: c.id,
          user_id: user.id,
          name: c.name,
          limit_amount: c.limit,
          icon: c.icon,
          type: c.type,
          color: c.color
        }));
        const { error: catErr } = await supabase.from('categories').insert(dbCats);
        if (catErr) throw catErr;
      }

      // 4. Insert transactions if any
      if (txs && txs.length > 0) {
        const dbTxs = txs.map(t => ({
          id: t.id,
          user_id: user.id,
          date: t.date,
          amount: t.amount,
          category_id: t.categoryId,
          spender: t.spender,
          notes: t.notes || ''
        }));
        const { error: txErr } = await supabase.from('transactions').insert(dbTxs);
        if (txErr) throw txErr;
      }

      // 5. Insert history snapshots if any
      if (hist && hist.length > 0) {
        const dbHist = hist.map(h => ({
          user_id: user.id,
          month_id: h.monthId,
          monthly_income: h.monthlyIncome,
          categories: h.categories || [],
          transactions: h.transactions || []
        }));
        const { error: histErr } = await supabase.from('history').insert(dbHist);
        if (histErr) throw histErr;
      }

    } catch (err) {
      console.error('Critical error during Supabase synchronization:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    saveToLocalStorage({ language: lang });
    if (user) {
      updateSupabaseProfile({ language: lang });
    }
  };

  const selectCurrency = async (newCur) => {
    if (newCur === currency) return;

    const oldCur = currency;

    // Helper conversion logic
    const convertValue = (val, fromC, toC) => {
      if (fromC === toC) return val;
      
      // Convert to USD base first
      let usdVal = val;
      if (fromC === 'IDR') {
        usdVal = val / 15000;
      } else if (fromC === 'JPY') {
        usdVal = val / 150;
      }
      
      // Convert from USD base to target
      let targetVal = usdVal;
      if (toC === 'IDR') {
        targetVal = usdVal * 15000;
      } else if (toC === 'JPY') {
        targetVal = usdVal * 150;
      }
      
      // Round to 2 decimal places for USD, and round to integer for IDR/JPY
      if (toC === 'USD') {
        return Math.round(targetVal * 100) / 100;
      } else {
        return Math.round(targetVal);
      }
    };

    // 1. Convert monthly income
    const updatedIncome = convertValue(monthlyIncome, oldCur, newCur);
    setMonthlyIncome(updatedIncome);

    // 2. Convert categories limits
    const updatedCategories = categories.map(c => ({
      ...c,
      limit: convertValue(c.limit, oldCur, newCur)
    }));
    setCategories(updatedCategories);

    // 3. Convert transactions amounts
    const updatedTransactions = transactions.map(t => ({
      ...t,
      amount: convertValue(t.amount, oldCur, newCur)
    }));
    setTransactions(updatedTransactions);

    // 4. Convert rollover bonuses
    const updatedRolloverBonuses = {};
    Object.keys(rolloverBonuses).forEach(catId => {
      updatedRolloverBonuses[catId] = convertValue(rolloverBonuses[catId], oldCur, newCur);
    });
    setRolloverBonuses(updatedRolloverBonuses);

    // 5. Convert history snapshots
    const updatedHistory = history.map(h => ({
      ...h,
      monthlyIncome: convertValue(h.monthlyIncome, oldCur, newCur),
      categories: h.categories.map(c => ({
        ...c,
        limit: convertValue(c.limit, oldCur, newCur),
        spent: convertValue(c.spent, oldCur, newCur),
        bonus: c.bonus ? convertValue(c.bonus, oldCur, newCur) : 0,
        totalLimit: c.totalLimit ? convertValue(c.totalLimit, oldCur, newCur) : 0
      })),
      transactions: h.transactions.map(t => ({
        ...t,
        amount: convertValue(t.amount, oldCur, newCur)
      }))
    }));
    setHistory(updatedHistory);

    // 6. Update local react state
    setCurrency(newCur);

    // 7. Save converted values to localStorage in a single synchronized state
    saveToLocalStorage({
      currency: newCur,
      monthlyIncome: updatedIncome,
      categories: updatedCategories,
      transactions: updatedTransactions,
      history: updatedHistory,
      rolloverBonuses: updatedRolloverBonuses
    });

    // 8. If authenticated, update Supabase database tables!
    if (user) {
      try {
        setIsAuthLoading(true);
        // Bulk upsert profiles
        await supabase.from('profiles').update({
          currency: newCur,
          monthly_income: updatedIncome
        }).eq('id', user.id);

        // Bulk upsert categories
        const dbCats = updatedCategories.map(c => ({
          id: c.id,
          user_id: user.id,
          name: c.name,
          limit_amount: c.limit,
          icon: c.icon,
          type: c.type,
          color: c.color
        }));
        await supabase.from('categories').upsert(dbCats);

        // Bulk upsert transactions
        const dbTxs = updatedTransactions.map(t => ({
          id: t.id,
          user_id: user.id,
          date: t.date,
          amount: t.amount,
          category_id: t.categoryId,
          spender: t.spender,
          notes: t.notes || ''
        }));
        await supabase.from('transactions').upsert(dbTxs);

        // Bulk upsert history
        const dbHist = updatedHistory.map(h => ({
          user_id: user.id,
          month_id: h.monthId,
          monthly_income: h.monthlyIncome,
          categories: h.categories,
          transactions: h.transactions
        }));
        await supabase.from('history').upsert(dbHist);

      } catch (err) {
        console.error('Failed to convert and sync currency in Supabase:', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
  };

  const saveTransaction = async (transaction) => {
    let updated;
    const txId = transaction.id || 'tx-' + Math.random().toString(36).substr(2, 9);
    const txObj = {
      ...transaction,
      id: txId,
    };

    if (transaction.id) {
      updated = transactions.map(t => t.id === transaction.id ? txObj : t);
    } else {
      updated = [txObj, ...transactions];
    }
    
    // Optimistic UI updates
    setTransactions(updated);
    saveToLocalStorage({ transactions: updated });

    if (user) {
      try {
        const dbObj = {
          id: txId,
          user_id: user.id,
          date: txObj.date,
          amount: txObj.amount,
          category_id: txObj.categoryId,
          spender: txObj.spender,
          notes: txObj.notes || ''
        };

        const { error } = await supabase
          .from('transactions')
          .upsert(dbObj);

        if (error) throw error;
      } catch (err) {
        console.error('Error saving transaction to Supabase:', err);
      }
    }
  };

  const deleteTransaction = async (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveToLocalStorage({ transactions: updated });

    if (user) {
      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error('Error deleting transaction from Supabase:', err);
      }
    }
  };

  const saveCategory = async (category) => {
    let updated;
    const catId = category.id || 'cat-' + Math.random().toString(36).substr(2, 9);
    const catObj = {
      ...category,
      id: catId,
    };

    if (category.id) {
      updated = categories.map(c => c.id === category.id ? catObj : c);
    } else {
      updated = [...categories, catObj];
    }
    
    // Optimistic UI updates
    setCategories(updated);
    saveToLocalStorage({ categories: updated });

    if (user) {
      try {
        const dbObj = {
          id: catId,
          user_id: user.id,
          name: catObj.name,
          limit_amount: catObj.limit,
          icon: catObj.icon || '📦',
          type: catObj.type,
          color: catObj.color || '#4f46e5'
        };

        const { error } = await supabase
          .from('categories')
          .upsert(dbObj);

        if (error) throw error;
      } catch (err) {
        console.error('Error saving category to Supabase:', err);
      }
    }
  };

  const deleteCategory = async (id) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    const updatedBonuses = { ...rolloverBonuses };
    delete updatedBonuses[id];
    setRolloverBonuses(updatedBonuses);
    saveToLocalStorage({ categories: updated, rolloverBonuses: updatedBonuses });

    if (user) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error('Error deleting category from Supabase:', err);
      }
    }
  };

  const selectProfile = (profile) => {
    setActiveProfile(profile);
    saveToLocalStorage({ activeProfile: profile });
    if (user) {
      updateSupabaseProfile({ active_profile: profile });
    }
  };

  const updateIncome = (income) => {
    setMonthlyIncome(income);
    saveToLocalStorage({ monthlyIncome: income });
    if (user) {
      updateSupabaseProfile({ monthly_income: income });
    }
  };

  const startNewMonth = async (rolloverChoice) => {
    const currentSnapshot = {
      monthId: currentMonth,
      monthlyIncome,
      categories: budgetMetrics.enrichedCategories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        limit: c.limit,
        bonus: c.bonus,
        totalLimit: c.totalLimit,
        spent: c.spent,
      })),
      transactions: transactions.filter(t => t.date >= dateMetrics.startDate && t.date <= dateMetrics.endDate),
    };

    const updatedHistory = [currentSnapshot, ...history].slice(0, 12);

    const newRolloverBonuses = {};
    if (rolloverChoice === 'rollover') {
      budgetMetrics.enrichedCategories.forEach(c => {
        if (c.type === 'saving' || c.type === 'want') {
          const remaining = c.totalLimit - c.spent;
          if (remaining > 0) {
            newRolloverBonuses[c.id] = Math.round(remaining);
          }
        }
      });
    }

    const parts = currentMonth.split('-');
    let year = parseInt(parts[0]);
    let month = parseInt(parts[1]);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    const nextMonthStr = `${year}-${String(month).padStart(2, '0')}`;

    // Optimistically close current month and open new month
    setCurrentMonth(nextMonthStr);
    setHistory(updatedHistory);
    setRolloverBonuses(newRolloverBonuses);

    saveToLocalStorage({
      currentMonth: nextMonthStr,
      history: updatedHistory,
      rolloverBonuses: newRolloverBonuses,
    });

    if (user) {
      try {
        // 1. Insert history snapshot row in Supabase
        const { error: histErr } = await supabase
          .from('history')
          .upsert({
            user_id: user.id,
            month_id: currentMonth,
            monthly_income: monthlyIncome,
            categories: currentSnapshot.categories,
            transactions: currentSnapshot.transactions
          });

        if (histErr) throw histErr;

        // 2. Transition current month settings row in Profiles
        await updateSupabaseProfile({ current_month: nextMonthStr });

      } catch (err) {
        console.error('Error saving transition snapshot to Supabase:', err);
      }
    }
  };

  const exportData = () => {
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
  };

  const importData = async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.categories || !parsed.transactions) {
        alert('Invalid file format. Ensure it is a valid HarmonyBudget backup.');
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

      if (parsed.language) setLanguage(lang);
      if (parsed.currency) setCurrency(cur);
      if (parsed.monthlyIncome) setMonthlyIncome(income);
      if (parsed.categories) setCategories(cats);
      if (parsed.transactions) setTransactions(txs);
      if (parsed.history) setHistory(hist);
      if (parsed.currentMonth) setCurrentMonth(curMonth);
      if (parsed.rolloverBonuses) setRolloverBonuses(bonuses);
      
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

      // If user is logged in, sync all imported data to the cloud!
      if (user) {
        await syncAllToSupabase(cats, txs, hist, income, curMonth, lang, cur, activeProf);
      }

      return true;
    } catch (e) {
      console.error(e);
      alert('Error reading backup file.');
      return false;
    }
  };

  const resetToFresh = async () => {
    const defaultCats = DEFAULT_CATEGORIES;
    setLanguage('en');
    setCurrency('USD');
    setMonthlyIncome(5500);
    setActiveProfile('joint');
    setCategories(defaultCats);
    setTransactions([]);
    setHistory([]);
    setCurrentMonth('2026-07');
    setRolloverBonuses({});
    
    // Clear local cache keys
    const storageKey = user ? `harmony_budget_state_${user.id}` : 'harmony_budget_state_guest';
    localStorage.removeItem(storageKey);
    localStorage.removeItem('harmony_budget_state'); // also clean legacy key

    if (user) {
      try {
        setIsAuthLoading(true);
        // Clear all Supabase tables
        await supabase.from('transactions').delete().eq('user_id', user.id);
        await supabase.from('categories').delete().eq('user_id', user.id);
        await supabase.from('history').delete().eq('user_id', user.id);

        // Reset Profile settings row
        await supabase.from('profiles').upsert({
          id: user.id,
          language: 'en',
          currency: 'USD',
          monthly_income: 5500,
          current_month: '2026-07',
          active_profile: 'joint'
        });

        // Insert initial template categories
        const dbCats = defaultCats.map(c => ({
          id: c.id,
          user_id: user.id,
          name: c.name,
          limit_amount: c.limit,
          icon: c.icon,
          type: c.type,
          color: c.color
        }));
        const { error } = await supabase.from('categories').insert(dbCats);
        if (error) throw error;

      } catch (err) {
        console.error('Error resetting database in Supabase:', err);
      } finally {
        setIsAuthLoading(false);
      }
    }
  };

  // --- Dynamic Scaling Demo Mock Data Injector (Supports USD, IDR, JPY) ---
  const injectDemoData = async (targetLang, targetCur) => {
    const activeLang = targetLang || language;
    const activeCur = targetCur || currency;

    // Scale factors:
    let mult = 1;
    if (activeCur === 'IDR') mult = 15000;
    else if (activeCur === 'JPY') mult = 150;

    const scaledIncome = 5500 * mult;
    const scaledCategories = DEFAULT_CATEGORIES.map(c => ({
      ...c,
      limit: c.limit * mult
    }));

    const mockHistory = [
      // 1. June 2026 History Snapshot
      {
        monthId: '2026-06',
        monthlyIncome: scaledIncome,
        categories: scaledCategories.map(c => {
          let spent = 0;
          if (c.id === 'cat-rent') spent = 1500 * mult;
          if (c.id === 'cat-groceries') spent = 580 * mult;
          if (c.id === 'cat-utilities') spent = 345 * mult;
          if (c.id === 'cat-transport') spent = 220 * mult;
          if (c.id === 'cat-dining') spent = 320 * mult;
          if (c.id === 'cat-entertainment') spent = 180 * mult;
          if (c.id === 'cat-shopping') spent = 240 * mult;
          if (c.id === 'cat-vacation') spent = 400 * mult;
          if (c.id === 'cat-emergency') spent = 500 * mult;
          if (c.id === 'cat-investments') spent = 600 * mult;
          return { ...c, spent, bonus: 0, totalLimit: c.limit };
        }),
        transactions: [
          { id: 'h1', date: '2026-06-01', amount: 1500 * mult, categoryId: 'cat-rent', spender: 'joint', notes: 'Monthly Rent Payment' },
          { id: 'h2', date: '2026-06-04', amount: 150 * mult, categoryId: 'cat-groceries', spender: 'me', notes: 'Trader Joe weekly run' },
          { id: 'h3', date: '2026-06-06', amount: 80 * mult, categoryId: 'cat-dining', spender: 'spouse', notes: 'Anniversary Dinner with Husband' },
          { id: 'h4', date: '2026-06-12', amount: 120 * mult, categoryId: 'cat-shopping', spender: 'me', notes: 'New work clothes' },
          { id: 'h5', date: '2026-06-15', amount: 180 * mult, categoryId: 'cat-utilities', spender: 'joint', notes: 'Electricity & Gas bill' },
          { id: 'h6', date: '2026-06-18', amount: 400 * mult, categoryId: 'cat-vacation', spender: 'joint', notes: 'Vacation savings transfer' },
          { id: 'h7', date: '2026-06-22', amount: 120 * mult, categoryId: 'cat-dining', spender: 'spouse', notes: 'Friday night tapas' },
          { id: 'h8', date: '2026-06-25', amount: 165 * mult, categoryId: 'cat-utilities', spender: 'joint', notes: 'Internet & Phones bills' },
          { id: 'h9', date: '2026-06-28', amount: 500 * mult, categoryId: 'cat-emergency', spender: 'joint', notes: 'Savings deposit' },
        ]
      },
      // 2. May 2026 History Snapshot
      {
        monthId: '2026-05',
        monthlyIncome: scaledIncome,
        categories: scaledCategories.map(c => {
          let spent = 0;
          if (c.id === 'cat-rent') spent = 1500 * mult;
          if (c.id === 'cat-groceries') spent = 610 * mult;
          if (c.id === 'cat-utilities') spent = 320 * mult;
          if (c.id === 'cat-transport') spent = 260 * mult;
          if (c.id === 'cat-dining') spent = 280 * mult;
          if (c.id === 'cat-entertainment') spent = 210 * mult;
          if (c.id === 'cat-shopping') spent = 190 * mult;
          if (c.id === 'cat-vacation') spent = 400 * mult;
          if (c.id === 'cat-emergency') spent = 500 * mult;
          if (c.id === 'cat-investments') spent = 600 * mult;
          return { ...c, spent, bonus: 0, totalLimit: c.limit };
        }),
        transactions: [
          { id: 'm1', date: '2026-05-01', amount: 1500 * mult, categoryId: 'cat-rent', spender: 'joint', notes: 'Monthly Rent Payment' },
          { id: 'm2', date: '2026-05-03', amount: 180 * mult, categoryId: 'cat-groceries', spender: 'spouse', notes: 'Whole Foods' },
          { id: 'm3', date: '2026-05-10', amount: 95 * mult, categoryId: 'cat-dining', spender: 'me', notes: 'Sushi night out' },
          { id: 'm4', date: '2026-05-14', amount: 200 * mult, categoryId: 'cat-groceries', spender: 'me', notes: 'Costco restock' },
          { id: 'm5', date: '2026-05-20', amount: 210 * mult, categoryId: 'cat-entertainment', spender: 'joint', notes: 'Concert tickets' },
          { id: 'm6', date: '2026-05-25', amount: 600 * mult, categoryId: 'cat-investments', spender: 'me', notes: 'Brokerage deposit' },
        ]
      },
      // 3. April 2026 History Snapshot
      {
        monthId: '2026-04',
        monthlyIncome: scaledIncome,
        categories: scaledCategories.map(c => {
          let spent = 0;
          if (c.id === 'cat-rent') spent = 1500 * mult;
          if (c.id === 'cat-groceries') spent = 550 * mult;
          if (c.id === 'cat-utilities') spent = 310 * mult;
          if (c.id === 'cat-transport') spent = 180 * mult;
          if (c.id === 'cat-dining') spent = 150 * mult;
          if (c.id === 'cat-entertainment') spent = 90 * mult;
          if (c.id === 'cat-shopping') spent = 120 * mult;
          if (c.id === 'cat-vacation') spent = 400 * mult;
          if (c.id === 'cat-emergency') spent = 500 * mult;
          if (c.id === 'cat-investments') spent = 600 * mult;
          return { ...c, spent, bonus: 0, totalLimit: c.limit };
        }),
        transactions: [
          { id: 'a1', date: '2026-04-01', amount: 1500 * mult, categoryId: 'cat-rent', spender: 'joint', notes: 'Monthly Rent Payment' },
          { id: 'a2', date: '2026-04-05', amount: 500 * mult, categoryId: 'cat-emergency', spender: 'joint', notes: 'Emergency fund' },
          { id: 'a3', date: '2026-04-12', amount: 120 * mult, categoryId: 'cat-groceries', spender: 'me', notes: 'Weekly groceries' },
          { id: 'a4', date: '2026-04-18', amount: 150 * mult, categoryId: 'cat-dining', spender: 'joint', notes: 'Sunday Brunch with family' },
          { id: 'a5', date: '2026-04-22', amount: 400 * mult, categoryId: 'cat-vacation', spender: 'spouse', notes: 'Summer savings' },
        ]
      }
    ];

    // July 2026 Active Transactions
    const activeJulyTransactions = [
      { id: 't1', date: '2026-07-01', amount: 1500 * mult, categoryId: 'cat-rent', spender: 'joint', notes: 'Obsidian Hills Rental' },
      { id: 't2', date: '2026-07-02', amount: 140 * mult, categoryId: 'cat-groceries', spender: 'me', notes: 'H-Mart Bulk Groceries' },
      { id: 't3', date: '2026-07-04', amount: 85 * mult, categoryId: 'cat-dining', spender: 'spouse', notes: '4th of July BBQ & Drinks' },
      { id: 't4', date: '2026-07-06', amount: 125 * mult, categoryId: 'cat-utilities', spender: 'joint', notes: 'Water & Gas Monthly Billing' },
      { id: 't5', date: '2026-07-08', amount: 280 * mult, categoryId: 'cat-groceries', spender: 'spouse', notes: 'Costco Organic Run & Supplies' },
      { id: 't6', date: '2026-07-09', amount: 90 * mult, categoryId: 'cat-shopping', spender: 'me', notes: 'Running shoes discount' },
      { id: 't7', date: '2026-07-10', amount: 130 * mult, categoryId: 'cat-dining', spender: 'joint', notes: 'Date Night - Steakhouse' },
      { id: 't8', date: '2026-07-11', amount: 50 * mult, categoryId: 'cat-transport', spender: 'spouse', notes: 'Gas Station fill up' },
    ];

    const targetBonuses = {
      'cat-vacation': 50 * mult,
      'cat-shopping': 20 * mult,
    };

    setLanguage(activeLang);
    setCurrency(activeCur);
    setMonthlyIncome(scaledIncome);
    setActiveProfile('joint');
    setCategories(scaledCategories);
    setTransactions(activeJulyTransactions);
    setHistory(mockHistory);
    setCurrentMonth('2026-07');
    setRolloverBonuses(targetBonuses);

    saveToLocalStorage({
      language: activeLang,
      currency: activeCur,
      monthlyIncome: scaledIncome,
      activeProfile: 'joint',
      categories: scaledCategories,
      transactions: activeJulyTransactions,
      history: mockHistory,
      currentMonth: '2026-07',
      rolloverBonuses: targetBonuses
    });

    // If authenticated, fully overwrite Supabase with this demo package!
    if (user) {
      await syncAllToSupabase(
        scaledCategories,
        activeJulyTransactions,
        mockHistory,
        scaledIncome,
        '2026-07',
        activeLang,
        activeCur,
        'joint'
      );
    }
  };

  const signOut = async () => {
    try {
      setIsAuthLoading(true);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out of Supabase session:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

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
    getCycleDateRange,
    
    // Translation and Currency helpers
    t,
    formatCurrency,
    selectLanguage,
    selectCurrency,
    selectCycleStartDay: (day) => {
      const parsedDay = Math.max(1, Math.min(28, parseInt(day) || 1));
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
    injectDemoData,
    resetToFresh,
    signOut,
  };
}
