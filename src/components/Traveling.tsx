import React, { useState, useEffect } from 'react';
import { Transaction, Category, Trip, TripCategory } from '../types';

interface TravelingProps {
  budget: {
    trips?: Trip[];
    activeTripId: string | null;
    setActiveTripId: (id: string | null) => void;
    exchangeRates?: { [key: string]: number };
    fetchExchangeRates: () => Promise<{ [key: string]: number }>;
    saveTrip: (trip: any) => void;
    deleteTrip: (id: string) => void;
    rawTransactions?: Transaction[];
    saveTransaction: (tx: any) => void;
    deleteTransaction: (id: string) => void;
    categories?: Category[];
    formatCurrency: (amount: number) => string;
    t: (key: string) => string;
    language: 'en' | 'id';
    showConfirm: (opts: any) => void;
  };
}

export default function Traveling({ budget }: TravelingProps) {
  const {
    trips = [],
    activeTripId,
    setActiveTripId,
    exchangeRates = {},
    fetchExchangeRates,
    saveTrip,
    deleteTrip,
    rawTransactions = [],
    saveTransaction,
    deleteTransaction,
    categories = [],
    formatCurrency,
    t,
    language,
    showConfirm
  } = budget;

  // Sync / load exchange rates on mount
  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  // UI Panel and form states
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isLoggerOpen, setIsLoggerOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // New Trip Form State
  const [tripName, setTripName] = useState('');
  const [tripStart, setTripDateStart] = useState('');
  const [tripEnd, setTripDateEnd] = useState('');
  const [tripTotalBudget, setTripTotalBudget] = useState('');
  const [tripCurrency, setTripCurrency] = useState('IDR');
  const [tripCategories, setTripCategories] = useState<Array<{ name: string; limit: string }>>([
    { name: 'Makan', limit: '' },
    { name: 'Transportasi', limit: '' },
    { name: 'Oleh-oleh', limit: '' },
    { name: 'Penginapan', limit: '' },
    { name: 'Tiket/Hiburan', limit: '' }
  ]);

  // Trip Transaction Form State
  const [txAmount, setTxAmount] = useState('');
  const [txCurrency, setTxCurrency] = useState('IDR');
  const [txPosName, setTxPosName] = useState('Makan');
  const [txNotes, setTxNotes] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Find active trip object safely
  const activeTrip = trips.find(t => t.id === activeTripId && !t.archived) || null;
  const archivedTrips = trips.filter(t => t.archived) || [];

  // Set default logging date within trip duration when expense logger is opened
  useEffect(() => {
    if (isLoggerOpen && activeTrip) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (todayStr >= activeTrip.startDate && todayStr <= activeTrip.endDate) {
        setTxDate(todayStr);
      } else {
        setTxDate(activeTrip.startDate);
      }
    }
  }, [isLoggerOpen, activeTrip]);

  // Calculate day-by-day metrics safely
  const getTripMetrics = (trip: Trip | null) => {
    if (!trip) return null;

    // Get all transactions tagged with this trip ID: 🧳[Trip: id]
    const tripTxs = rawTransactions.filter(t => 
      t.notes && t.notes.includes(`🧳[Trip: ${trip.id}]`)
    );

    // Parse note content and handle potential null/undefined safely
    const cleanTxs = tripTxs.map(t => {
      const tagStr = `🧳[Trip: ${trip.id}]`;
      const cleanNote = (t.notes || '').replace(tagStr, '').trim();
      
      let parsedPos = 'Lainnya';
      const posMatch = cleanNote.match(/^\[(.*?)\]/);
      if (posMatch) {
        parsedPos = posMatch[1] || 'Lainnya';
      }
      const displayNote = cleanNote.replace(/^\[.*?\]/, '').trim();

      return {
        ...t,
        cleanNote: displayNote,
        pos: parsedPos
      };
    });

    const totalSpent = cleanTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const start = new Date(trip.startDate + 'T00:00:00');
    const end = new Date(trip.endDate + 'T23:59:59');
    const today = new Date();

    const diffMs = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    
    let currentDayIndex = 1;
    if (today >= start && today <= end) {
      const elapsedMs = Math.abs(today.getTime() - start.getTime());
      currentDayIndex = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));
      if (currentDayIndex < 1) currentDayIndex = 1;
    } else if (today > end) {
      currentDayIndex = totalDays;
    } else {
      currentDayIndex = 0; // Trip hasn't started yet
    }

    const dailyLimit = (trip.totalBudget || 0) / totalDays;
    
    const dailyActuals: { [key: number]: number } = {};
    for (let i = 1; i <= totalDays; i++) {
      dailyActuals[i] = 0;
    }

    cleanTxs.forEach(tx => {
      const txD = new Date((tx.date || '') + 'T00:00:00');
      const diffTxMs = txD.getTime() - start.getTime();
      const idx = Math.ceil(diffTxMs / (1000 * 60 * 60 * 24)) + 1;
      if (idx >= 1 && idx <= totalDays) {
        dailyActuals[idx] = (dailyActuals[idx] || 0) + (tx.amount || 0);
      } else if (idx < 1) {
        dailyActuals[1] = (dailyActuals[1] || 0) + (tx.amount || 0);
      } else {
        dailyActuals[totalDays] = (dailyActuals[totalDays] || 0) + (tx.amount || 0);
      }
    });

    const posMetrics = (trip.categories || []).map(cat => {
      const spent = cleanTxs
        .filter(t => t.pos === cat.name)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      return {
        ...cat,
        spent,
        remaining: (cat.limit || 0) - spent,
        ratio: cat.limit > 0 ? spent / cat.limit : 0
      };
    });

    const categorizedPosNames = (trip.categories || []).map(c => c.name);
    const otherSpent = cleanTxs
      .filter(t => !categorizedPosNames.includes(t.pos))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalDays,
      currentDayIndex,
      totalSpent,
      remainingBudget: (trip.totalBudget || 0) - totalSpent,
      dailyLimit,
      dailyActuals,
      posMetrics,
      otherSpent,
      transactions: cleanTxs,
      isOngoing: today >= start && today <= end,
      hasPassed: today > end,
      hasNotStarted: today < start
    };
  };

  const metrics = getTripMetrics(activeTrip);

  const formatForeignValue = (amountInIDR: number, currencyCode: string) => {
    if (!currencyCode || currencyCode === 'IDR') {
      return formatCurrency(amountInIDR);
    }
    const rate = exchangeRates[currencyCode];
    if (!rate || rate === 0) {
      return `${currencyCode} (loading...)`;
    }
    const foreignAmount = amountInIDR / rate;
    
    let formattedAmount = '';
    try {
      formattedAmount = new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2,
        maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2,
      }).format(foreignAmount);
    } catch (e) {
      formattedAmount = `${currencyCode} ${foreignAmount.toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }
    return formattedAmount;
  };


  const openTripCreator = (trip: Trip | null = null) => {
    if (trip) {
      setEditingTrip(trip);
      setTripName(trip.name || '');
      setTripDateStart(trip.startDate || '');
      setTripDateEnd(trip.endDate || '');
      setTripTotalBudget((trip.totalBudget || 0).toString());
      setTripCurrency(trip.currency || 'IDR');
      setTripCategories(
        (trip.categories || []).map(c => ({ name: c.name || '', limit: (c.limit || 0).toString() }))
      );
    } else {
      setEditingTrip(null);
      setTripName('');
      setTripDateStart(new Date().toISOString().split('T')[0]);
      setTripDateEnd(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setTripTotalBudget('3000000');
      setTripCurrency('IDR');
      setTripCategories([
        { name: 'Makan', limit: '1000000' },
        { name: 'Transportasi', limit: '1000000' },
        { name: 'Oleh-oleh', limit: '500000' },
        { name: 'Penginapan', limit: '500000' }
      ]);
    }
    setIsCreatorOpen(true);
  };

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName || !tripStart || !tripEnd || !tripTotalBudget) {
      alert('Mohon isi semua bidang formulir dengan benar.');
      return;
    }

    const data = {
      id: editingTrip ? editingTrip.id : undefined,
      name: tripName,
      startDate: tripStart,
      endDate: tripEnd,
      totalBudget: parseFloat(tripTotalBudget),
      currency: tripCurrency,
      archived: editingTrip ? editingTrip.archived : false,
      categories: tripCategories.map(c => ({
        name: c.name,
        limit: parseFloat(c.limit) || 0
      }))
    };

    saveTrip(data);
    setIsCreatorOpen(false);
  };

  const handleLogTripExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || isNaN(Number(txAmount)) || parseFloat(txAmount) <= 0 || !activeTrip) {
      alert('Mohon masukkan jumlah pengeluaran yang valid.');
      return;
    }

    let amountInIDR = parseFloat(txAmount);
    if (txCurrency !== 'IDR') {
      const rate = exchangeRates[txCurrency] || 1;
      amountInIDR = Math.round(parseFloat(txAmount) * rate);
    }

    const vacationCat = categories.find(c => 
      c.id === 'cat-vacation' || c.name.toLowerCase().includes('vacation') || c.name.toLowerCase().includes('liburan')
    );
    const categoryId = vacationCat ? vacationCat.id : (categories[0]?.id || 'cat-rent');

    const formattedNotes = `[${txPosName}] ${txNotes} 🧳[Trip: ${activeTrip.id}]`;

    const txObj = {
      date: txDate,
      amount: amountInIDR,
      categoryId: categoryId,
      spender: 'joint',
      notes: formattedNotes
    };

    saveTransaction(txObj);
    setIsLoggerOpen(false);
    
    setTxAmount('');
    setTxNotes('');
  };

  const toggleArchiveTrip = (trip: Trip) => {
    saveTrip({
      ...trip,
      archived: !trip.archived
    });
  };

  return (
    <div className="app-layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      
      {/* HEADER SECTION */}
      <div className="main-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>🧳</span> {language === 'id' ? 'Mode Traveling' : 'Traveling Mode'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {language === 'id' ? 'Kelola rencana harian dan pos anggaran khusus saat bepergian.' : 'Manage daily plans and specific category budgets on trips.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => openTripCreator(null)}>
            ➕ {language === 'id' ? 'Buat Trip Baru' : 'Create New Trip'}
          </button>
        </div>
      </div>

      {/* NO ACTIVE TRIP HERO STATE */}
      {!activeTrip && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✈️</div>
          <h2>{language === 'id' ? 'Belum Ada Liburan yang Aktif' : 'No Active Trips Yet'}</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0.5rem auto 1.5rem auto', lineHeight: 1.5 }}>
            {language === 'id' 
              ? 'Rencanakan liburan impian Anda berikutnya dengan menetapkan budget harian, pos belanja terperinci, dan konversi kurs mata uang otomatis!'
              : 'Plan your next dream holiday by defining daily limits, granular shopping pos, and automatic currency converters!'}
          </p>
          <button className="btn btn-primary" onClick={() => openTripCreator(null)}>
            🧳 {language === 'id' ? 'Mulai Susun Trip Pertama Anda' : 'Start Planning Your First Trip'}
          </button>
        </div>
      )}

      {/* ACTIVE TRIP DASHBOARD PANEL */}
      {activeTrip && metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          
          {/* Active Trip Title Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge-active" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                  ✈️ {metrics.isOngoing ? (language === 'id' ? 'Sedang Berjalan' : 'Ongoing') : metrics.hasPassed ? (language === 'id' ? 'Selesai' : 'Completed') : (language === 'id' ? 'Direncanakan' : 'Upcoming')}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  📅 {activeTrip.startDate} s.d. {activeTrip.endDate} ({metrics.totalDays} {language === 'id' ? 'Hari' : 'Days'})
                </span>
              </div>
              <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {activeTrip.name}
                <span className="badge-currency" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: 'bold' }}>
                  💱 {activeTrip.currency || 'IDR'}
                </span>
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {language === 'id' ? 'Menggunakan anggaran Terintegrasi:' : 'Drawn from integrated envelope:'} <strong>Vacation Fund</strong>
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsLoggerOpen(true)}>
                💵 {language === 'id' ? 'Log Biaya Liburan' : 'Log Trip Expense'}
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => openTripCreator(activeTrip)} title="Edit Trip">
                ✏️
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => toggleArchiveTrip(activeTrip)} title="Archive Trip">
                📥
              </button>
            </div>
          </div>

          {/* Core Metrics: Total Budget vs Spent */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'id' ? 'Total Dana Liburan' : 'Total Holiday Budget'}</span>
              <h3 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                {formatForeignValue(activeTrip.totalBudget, activeTrip.currency)}
              </h3>
              {activeTrip.currency !== 'IDR' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Equivalent to {formatCurrency(activeTrip.totalBudget)}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'id' ? 'Aktual Terbelanjakan' : 'Actual Spent'}</span>
              <h3 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: metrics.remainingBudget < 0 ? '#ef4444' : '#10b981' }}>
                {formatForeignValue(metrics.totalSpent, activeTrip.currency)}
              </h3>
              {activeTrip.currency !== 'IDR' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Equivalent to {formatCurrency(metrics.totalSpent)}
                </div>
              )}
              <div className="progress-bar-container" style={{ height: '6px', marginTop: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, (metrics.totalSpent / activeTrip.totalBudget) * 100)}%`, 
                    height: '100%', 
                    background: metrics.totalSpent > activeTrip.totalBudget ? '#ef4444' : 'var(--color-primary)' 
                  }} 
                />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'id' ? 'Sisa Saldo Liburan' : 'Remaining Holiday Balance'}</span>
              <h3 style={{ fontSize: '1.8rem', marginTop: '0.25rem', color: metrics.remainingBudget < 0 ? '#ef4444' : 'var(--text-primary)' }}>
                {formatForeignValue(metrics.remainingBudget, activeTrip.currency)}
              </h3>
              {activeTrip.currency !== 'IDR' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Equivalent to {formatCurrency(metrics.remainingBudget)}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {metrics.remainingBudget >= 0 
                  ? (language === 'id' ? '✅ Aman di dalam batas budget' : '✅ Within safety budget limit')
                  : (language === 'id' ? '⚠️ Anggaran Liburan melebih batas!' : '⚠️ Holiday budget overlimit!')}
              </div>
            </div>
          </div>

          {/* Daily Timeline Tracker & Category Allocation Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Column Left: Daily Timeline View */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📅 {language === 'id' ? 'Perkembangan Pengeluaran Harian' : 'Daily Spend Timeline'}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                  {language === 'id' ? `Hari ke-${metrics.currentDayIndex} dari ${metrics.totalDays}` : `Day ${metrics.currentDayIndex} of ${metrics.totalDays}`}
                </span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {Array.from({ length: metrics.totalDays }).map((_, index) => {
                  const dayNum = index + 1;
                  const isToday = dayNum === metrics.currentDayIndex;
                  const daySpent = metrics.dailyActuals[dayNum] || 0;
                  const isOverDaily = daySpent > metrics.dailyLimit;

                  return (
                    <div 
                      key={dayNum} 
                      style={{ 
                        padding: '0.75rem 1rem', 
                        borderRadius: '10px', 
                        background: isToday ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.02)',
                        border: isToday ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                          {language === 'id' ? `Hari ke-${dayNum}` : `Day ${dayNum}`} {isToday && '⭐️'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {language === 'id' ? 'Rencana Harian:' : 'Daily Budget:'} {formatForeignValue(metrics.dailyLimit, activeTrip.currency)}
                          {activeTrip.currency !== 'IDR' && ` (${formatCurrency(metrics.dailyLimit)})`}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: isOverDaily ? '#ef4444' : daySpent > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                          {daySpent > 0 ? formatForeignValue(daySpent, activeTrip.currency) : '-'}
                        </div>
                        {daySpent > 0 && (
                          <div style={{ fontSize: '0.7rem', color: isOverDaily ? '#ef4444' : 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {activeTrip.currency !== 'IDR' ? `≈ ${formatCurrency(daySpent)}` : (isOverDaily ? (language === 'id' ? 'Melebihi target!' : 'Over limit!') : (language === 'id' ? 'Sesuai rencana' : 'On track'))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column Right: Pos Allocation Matrix Tracker */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>🏷️ {language === 'id' ? 'Alokasi Pos Budget Perjalanan' : 'Global Pos Allocations'}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {metrics.posMetrics.map(pos => {
                  const percent = Math.min(100, Math.round(pos.ratio * 100));
                  const isPosOver = pos.spent > pos.limit;
                  
                  return (
                    <div key={pos.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: 500 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{pos.name}</span>
                        <span style={{ color: isPosOver ? '#ef4444' : 'var(--text-secondary)' }}>
                          {formatForeignValue(pos.spent, activeTrip.currency)} / {formatForeignValue(pos.limit, activeTrip.currency)} ({percent}%)
                        </span>
                      </div>
                      <div className="progress-bar-container" style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${percent}%`, 
                            height: '100%', 
                            background: isPosOver ? '#ef4444' : '#10b981',
                            borderRadius: '4px'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Other/Uncategorized Trip Spent */}
                {metrics.otherSpent > 0 && (
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📦 {language === 'id' ? 'Pengeluaran Lain-lain' : 'Unallocated/Other Spend'}</span>
                    <strong style={{ fontSize: '0.9rem' }}>{formatForeignValue(metrics.otherSpent, activeTrip.currency)}</strong>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Trip Active Transactions Ledger */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🧾 {language === 'id' ? 'Catatan Transaksi Trip' : 'Trip Transactions'}</h3>
            
            {metrics.transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧾</div>
                <p>{language === 'id' ? 'Belum ada transaksi di dalam liburan ini.' : 'No transactions recorded on this trip yet.'}</p>
                <button className="btn btn-secondary" style={{ marginTop: '0.75rem' }} onClick={() => setIsLoggerOpen(true)}>
                  💵 {language === 'id' ? 'Catat Pengeluaran Pertama' : 'Log First Expense'}
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="transaction-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>{t('date')}</th>
                      <th style={{ padding: '0.75rem' }}>{language === 'id' ? 'Pos' : 'Pos Area'}</th>
                      <th style={{ padding: '0.75rem' }}>{t('notes')}</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>{t('amount')}</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.transactions.map(tx => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{tx.date}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                            {tx.pos}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {tx.cleanNote || '-'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          <div>{formatForeignValue(tx.amount, activeTrip.currency)}</div>
                          {activeTrip.currency !== 'IDR' && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                              {formatCurrency(tx.amount)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                            onClick={() => {
                              showConfirm({
                                title: t('delete'),
                                message: t('confirmDeleteTransaction'),
                                onConfirm: () => deleteTransaction(tx.id)
                              });
                            }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TRIP SELECTOR AND HISTORY AREA */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>🗄️ {language === 'id' ? 'Pilih atau Kelola Trip Anda' : 'Select or Manage Trip'}</h3>
        
        {trips.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{language === 'id' ? 'Belum ada riwayat trip.' : 'No trip records found.'}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trips.map(t => {
              const isActive = t.id === activeTripId && !t.archived;
              return (
                <div 
                  key={t.id}
                  className="glass-panel"
                  style={{ 
                    padding: '0.75rem 1rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    background: isActive ? 'rgba(168, 85, 247, 0.05)' : 'rgba(255,255,255,0.01)',
                    border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--glass-border)'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{t.name}</strong> 
                    <span className="badge-currency" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                      {t.currency || 'IDR'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      ({t.startDate} - {t.endDate}) {t.archived && '📦 (Arsip)'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!isActive && !t.archived && (
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setActiveTripId(t.id)}>
                        🔑 {language === 'id' ? 'Aktifkan' : 'Activate'}
                      </button>
                    )}
                    {t.archived && (
                      <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => toggleArchiveTrip(t)}>
                        📤 {language === 'id' ? 'Buka Arsip' : 'Unarchive'}
                      </button>
                    )}
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        showConfirm({
                          title: language === 'id' ? 'Hapus Trip' : 'Delete Trip',
                          message: language === 'id' ? 'Hapus seluruh data trip ini? Catatan transaksi yang terintegrasi di buku kas utama tidak akan dihapus.' : 'Completely delete this trip configuration? Integrated ledger transactions will remain intact.',
                          onConfirm: () => deleteTrip(t.id)
                        });
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: TRIP CREATOR DIALOG */}
      {isCreatorOpen && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>✈️ {editingTrip ? (language === 'id' ? 'Edit Trip' : 'Edit Trip') : (language === 'id' ? 'Rencanakan Trip Baru' : 'Create New Trip')}</h3>
            
            <form onSubmit={handleSaveTrip} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">{language === 'id' ? 'Nama Trip' : 'Trip Name'}</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Liburan Bali 2026, J-Trip" 
                  value={tripName} 
                  onChange={e => setTripName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">{language === 'id' ? 'Mulai' : 'Start Date'}</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={tripStart} 
                    onChange={e => {
                      const newStart = e.target.value;
                      setTripDateStart(newStart);
                      if (tripEnd && newStart > tripEnd) {
                        setTripDateEnd(newStart);
                      }
                    }} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">{language === 'id' ? 'Selesai' : 'End Date'}</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={tripEnd} 
                    min={tripStart}
                    onChange={e => setTripDateEnd(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">{language === 'id' ? 'Total Anggaran Trip (IDR)' : 'Total IDR Budget'}</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={tripTotalBudget} 
                    onChange={e => setTripTotalBudget(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">{language === 'id' ? 'Mata Uang' : 'Trip Currency'}</label>
                  <select className="form-control" value={tripCurrency} onChange={e => setTripCurrency(e.target.value)}>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="MYR">MYR (RM)</option>
                    <option value="THB">THB (฿)</option>
                    <option value="KRW">KRW (₩)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Pos Subcategories Allocations */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>🏷️ {language === 'id' ? 'Atur Alokasi Pos Budget (IDR)' : 'Set Pos Limits (IDR)'}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {tripCategories.map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        style={{ flex: 1 }}
                        placeholder="Nama Pos" 
                        value={cat.name} 
                        onChange={e => {
                          const updated = [...tripCategories];
                          const item = updated[idx];
                          if (item) item.name = e.target.value;
                          setTripCategories(updated);
                        }}
                      />
                      <input 
                        type="number" 
                        className="form-control" 
                        style={{ width: '130px' }}
                        placeholder="Limit (IDR)" 
                        value={cat.limit} 
                        onChange={e => {
                          const updated = [...tripCategories];
                          const item = updated[idx];
                          if (item) item.limit = e.target.value;
                          setTripCategories(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.8rem', padding: '0.35rem' }}
                  onClick={() => setTripCategories([...tripCategories, { name: '', limit: '' }])}
                >
                  ➕ {language === 'id' ? 'Tambah Pos Kategori' : 'Add Pos Subcategory'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreatorOpen(false)}>
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === 'id' ? 'Simpan' : 'Save Trip'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: TRIP EXPENSE LOGGER DIALOG */}
      {isLoggerOpen && activeTrip && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>💵 {language === 'id' ? 'Log Biaya Liburan' : 'Log Trip Expense'}</h3>
            
            <form onSubmit={handleLogTripExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label">{language === 'id' ? 'Jumlah Nominal' : 'Amount'}</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control" 
                    placeholder="0" 
                    value={txAmount} 
                    onChange={e => setTxAmount(e.target.value)} 
                    required 
                    autoFocus
                  />
                </div>
                <div>
                  <label className="form-label">{language === 'id' ? 'Valuta' : 'Currency'}</label>
                  <select className="form-control" value={txCurrency} onChange={e => setTxCurrency(e.target.value)}>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="USD">USD ($)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="MYR">MYR (RM)</option>
                    <option value="THB">THB (฿)</option>
                    <option value="KRW">KRW (₩)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {txCurrency !== 'IDR' && exchangeRates[txCurrency] && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  💡 {language === 'id' ? 'Konversi ke IDR:' : 'Equivalent in IDR:'} <strong>
                    {formatCurrency(Math.round((parseFloat(txAmount) || 0) * (exchangeRates[txCurrency] || 1)))}
                  </strong> <br />
                  <span style={{ fontSize: '0.7rem' }}>(1 {txCurrency} ≈ {exchangeRates[txCurrency]?.toFixed(1)} IDR)</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label">{language === 'id' ? 'Pos Area' : 'Pos Sector'}</label>
                  <select className="form-control" value={txPosName} onChange={e => setTxPosName(e.target.value)}>
                    {(activeTrip.categories || []).map((cat, idx) => (
                      <option key={idx} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="Lainnya">{language === 'id' ? 'Lain-lain / Lainnya' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('date')}</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={txDate} 
                    min={activeTrip.startDate}
                    max={activeTrip.endDate}
                    onChange={e => setTxDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">{t('notes')} ({language === 'id' ? 'Keterangan' : 'Description'})</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Makan malam di tepi pantai, tiket museum" 
                  value={txNotes} 
                  onChange={e => setTxNotes(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLoggerOpen(false)}>
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === 'id' ? 'Log Pengeluaran' : 'Add Expense'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
