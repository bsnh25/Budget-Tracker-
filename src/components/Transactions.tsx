import React, { useState } from 'react';
import { useBudgetController } from '../controllers/useBudgetController';
import { Transaction } from '../types';

interface TransactionsProps {
  budget: ReturnType<typeof useBudgetController>;
  isLoggerOpen: boolean;
  openLogger: () => void;
  closeLogger: () => void;
}

export default function Transactions({ budget, isLoggerOpen, openLogger, closeLogger }: TransactionsProps) {
  const { 
    transactions, 
    categories, 
    activeProfile, 
    saveTransaction, 
    deleteTransaction,
    currentMonth,
    t,
    formatCurrency,
    currency,
    showConfirm
  } = budget;

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Logger Form State (for adding / editing transactions)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formSpender, setFormSpender] = useState<'me' | 'spouse' | 'joint'>('me');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]?.id || '');
  const [formNotes, setFormNotes] = useState('');

  // Handle opening logger for new expense
  const handleOpenNew = () => {
    setEditingTransaction(null);
    setFormSpender(activeProfile === 'joint' ? 'me' : activeProfile);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAmount('');
    setFormCategory(categories[0]?.id || '');
    setFormNotes('');
  };

  // Handle edit transaction
  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormSpender(tx.spender);
    setFormDate(tx.date);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.categoryId);
    setFormNotes(tx.notes);
  };

  // Submit Logger Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount)) || parseFloat(formAmount) <= 0) {
      alert(t('clearFiltersSearch')); // custom alert fallback or simple validation
      return;
    }
    if (!formCategory) {
      alert(t('chooseCategory'));
      return;
    }

    const txData: Partial<Transaction> = {
      id: editingTransaction ? editingTransaction.id : undefined,
      date: formDate,
      amount: parseFloat(formAmount),
      categoryId: formCategory,
      spender: formSpender,
      notes: formNotes,
    };

    saveTransaction(txData);
    closeLogger();
    
    // Reset fields
    setEditingTransaction(null);
    setFormAmount('');
    setFormNotes('');
  };

  // Filter logic (combining profile, category selection, and keyword search)
  const filteredTransactions = transactions.filter(t => {
    const category = categories.find(c => c.id === t.categoryId);
    const categoryName = category ? category.name.toLowerCase() : '';
    const notesMatch = (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryName.includes(searchTerm.toLowerCase());
    const matchesSearch = notesMatch || categoryMatch;

    const matchesCategoryFilter = selectedCategoryFilter === 'all' || t.categoryId === selectedCategoryFilter;

    return matchesSearch && matchesCategoryFilter;
  });

  return (
    <div className="app-layout">
      {/* 1. Header Area */}
      <div className="main-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{t('transactionsLedger')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('verifyOrModify')} ({currentMonth})
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={() => { handleOpenNew(); openLogger(); }}>
          <span>➕</span> {t('logExpense')}
        </button>
      </div>

      {/* 2. Filters & Search Control Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        
        {/* Search */}
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>🔍</span>
          <input 
            type="text" 
            placeholder={t('searchNotesCategory')} 
            className="form-control" 
            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('category')}:</span>
          <select 
            className="form-control" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="all">{t('allCategories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* 3. Transaction Table List */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧾</div>
            <h4>{t('noTransactionsFound')}</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {searchTerm || selectedCategoryFilter !== 'all' 
                ? t('clearFiltersSearch') 
                : t('logExpensesActive')}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="transaction-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('spender')}</th>
                    <th>{t('category')}</th>
                    <th>{t('notes')}</th>
                    <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tData => {
                    const cat = categories.find(c => c.id === tData.categoryId);
                    return (
                      <tr key={tData.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{tData.date}</td>
                        <td>
                          <span className={`spender-badge ${tData.spender}`}>
                            {tData.spender === 'me' ? '👨 ' + t('husband') : tData.spender === 'spouse' ? '👩 ' + t('wife') : '🤝 ' + t('familyView')}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            <span>{cat?.icon || '📦'}</span>
                            <span>{cat?.name || t('uncategorized')}</span>
                          </span>
                        </td>
                        <td style={{ fontStyle: tData.notes ? 'normal' : 'italic' }}>
                          {tData.notes || t('noDescription')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {formatCurrency(tData.amount)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                              onClick={() => {
                                handleEdit(tData);
                                openLogger();
                              }}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none' }}
                              onClick={() => {
                                showConfirm({
                                  title: t('delete') + ' ' + t('ledgerBook'),
                                  message: t('confirmDeleteTransaction'),
                                  isDanger: true,
                                  onConfirm: () => deleteTransaction(tData.id)
                                });
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Feed View */}
            <div className="transaction-mobile-list">
              {filteredTransactions.map(tData => {
                const cat = categories.find(c => c.id === tData.categoryId);
                return (
                  <div key={tData.id} className="transaction-mobile-card">
                    <div className="transaction-mobile-left">
                      <div 
                        className="transaction-mobile-icon-circle"
                        style={{ 
                          boxShadow: cat?.color ? `0 0 12px ${cat.color}25` : 'none',
                          border: cat?.color ? `1px solid ${cat.color}40` : '1px solid var(--glass-border)'
                        }}
                      >
                        {cat?.icon || '📦'}
                      </div>
                      <div className="transaction-mobile-details">
                        <div className="transaction-mobile-category">
                          <span>{cat?.name || t('uncategorized')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tData.date}</span>
                          <span className={`spender-badge ${tData.spender}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                            {tData.spender === 'me' ? t('husband') : tData.spender === 'spouse' ? t('wife') : t('familyView')}
                          </span>
                        </div>
                        <div className="transaction-mobile-notes" style={{ fontStyle: tData.notes ? 'normal' : 'italic' }}>
                          {tData.notes || t('noDescription')}
                        </div>
                      </div>
                    </div>
                    <div className="transaction-mobile-right">
                      <div className="transaction-mobile-amount">
                        {formatCurrency(tData.amount)}
                      </div>
                      <div className="transaction-mobile-actions">
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px' }}
                          onClick={() => {
                            handleEdit(tData);
                            openLogger();
                          }}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px', border: 'none' }}
                          onClick={() => {
                            showConfirm({
                              title: t('delete') + ' ' + t('ledgerBook'),
                              message: t('confirmDeleteTransaction'),
                              isDanger: true,
                              onConfirm: () => deleteTransaction(tData.id)
                            });
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 4. Active Transaction Logging Modal Overlay */}
      {isLoggerOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeLogger}>&times;</button>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📝</span> {editingTransaction ? t('editExpenseEntry') : t('logDailyExpense')}
            </h3>

            <form onSubmit={handleSubmit}>
              
              {/* Spender selector */}
              <div className="form-group">
                <label>{t('spenderAttribution')}</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${formSpender === 'me' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: formSpender === 'me' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)' }}
                    onClick={() => setFormSpender('me')}
                  >
                    👨 {t('husband')}
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${formSpender === 'spouse' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: formSpender === 'spouse' ? 'var(--color-secondary)' : 'rgba(255,255,255,0.03)' }}
                    onClick={() => setFormSpender('spouse')}
                  >
                    👩 {t('wife')}
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${formSpender === 'joint' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: formSpender === 'joint' ? 'var(--color-joint)' : 'rgba(255,255,255,0.03)' }}
                    onClick={() => setFormSpender('joint')}
                  >
                    🤝 {t('familyView')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Date */}
                <div className="form-group">
                  <label>{t('date')}</label>
                  <input 
                    type="date" 
                    className="form-control"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label>{t('amount')} ({currency})</label>
                  <input 
                    type="number" 
                    step={currency === 'USD' ? '0.01' : '1'}
                    min={currency === 'USD' ? '0.01' : '1'}
                    placeholder={currency === 'USD' ? 'e.g. 45.50' : currency === 'JPY' ? 'e.g. 6000' : 'e.g. 50000'}
                    className="form-control"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label>{t('budgetCategory')}</label>
                <select 
                  className="form-control"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="" disabled>{t('chooseCategory')}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name} ({
                        c.type === 'need' 
                          ? t('needsLabel').toUpperCase() 
                          : c.type === 'want' 
                          ? t('wantsLabel').toUpperCase() 
                          : t('savingsLabel').toUpperCase()
                      })
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>{t('notesDescription')}</label>
                <input 
                  type="text" 
                  placeholder={t('notesDescription') + '...'}
                  className="form-control"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={closeLogger}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">
                  {editingTransaction ? t('saveChanges') : t('logTransaction')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
