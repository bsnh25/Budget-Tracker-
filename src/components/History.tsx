import React, { useState, useMemo } from 'react';
import { useBudgetController } from '../controllers/useBudgetController';
import { HistorySnapshot } from '../types';

interface HistoryProps {
  budget: ReturnType<typeof useBudgetController>;
}

export default function History({ budget }: HistoryProps) {
  const { 
    history, 
    currentMonth, 
    startNewMonth, 
    resetToFresh,
    t,
    formatCurrency,
    showConfirm
  } = budget;

  // Selected Month Snapshot to view detailed report
  const [selectedPastMonth, setSelectedMonth] = useState('');
  
  // Rollover wizard state
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const [rolloverChoice, setRolloverChoice] = useState<'rollover' | 'fresh'>('rollover');

  // If viewing a historical snapshot
  const activeHistorySnapshot = history.find(h => h.monthId === selectedPastMonth);

  // SVG Chart Calculation Data
  const chartData = [...history].reverse(); // chronological

  // Calculations for custom SVG Chart
  const chartHeight = 150;
  const barWidth = 25;
  const gap = 45;

  // Find max value in snapshots to scale bars correctly
  const maxVal = Math.max(
    ...chartData.map(h => {
      const plannedSum = h.categories.reduce((sum, c) => sum + ((c.totalLimit !== undefined ? c.totalLimit : c.limit) || 0), 0);
      const spentSum = h.categories.reduce((sum, c) => sum + (c.spent || 0), 0);
      return Math.max(plannedSum, spentSum);
    }),
    5000 // default minimum ceiling
  ) * 1.1; // 10% headroom

  const handleStartNewMonthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startNewMonth(rolloverChoice);
    setIsRolloverOpen(false);
    alert(t('rolloverCompletedSuccess') || `Rollover complete! Successfully transitioned to the next month.`);
  };

  return (
    <div className="app-layout">
      {/* 1. Header Area */}
      <div className="main-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{t('historicalAnalysis')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('comparePastBudgets')}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-danger" 
            style={{ border: 'none' }} 
            onClick={() => { 
              showConfirm({
                title: t('resetAll'),
                message: t('confirmResetAll'),
                isDanger: true,
                onConfirm: () => resetToFresh()
              }); 
            }}
          >
            ⚠️ {t('resetAll')}
          </button>
        </div>
      </div>

      {/* 2. Month Rollover Wizard Trigger Card */}
      <div className="glass-panel" style={{ borderLeft: '4px solid var(--color-primary)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem', fontFamily: 'Outfit' }}>
            📅 {t('currentMonthTransition')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', maxWidth: '600px' }}>
            {t('transitionWizardDesc').replace('this month', currentMonth).replace('bulan ini', currentMonth)}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsRolloverOpen(true)}>
          🚀 {t('triggerRolloverWizard')}
        </button>
      </div>

      {/* 3. Trend Visualizer Chart (Pure Interactive SVG) */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          📈 {t('monthlyPlannedActualTrend')}
        </h3>

        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('noHistoryLogged')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            
            {/* SVG Wrapper */}
            <div style={{ width: '100%', maxWidth: '550px', overflowX: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '1rem' }}>
              <svg width="100%" height="220" viewBox="0 0 500 220" style={{ overflow: 'visible' }}>
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
                  const y = chartHeight * (1 - ratio) + 20;
                  const value = Math.round(maxVal * ratio);
                  return (
                    <g key={i}>
                      <line x1="60" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                      <text x="50" y={y + 4} textAnchor="end" fill="var(--text-secondary)" fontSize="9" fontFamily="monospace">
                        {formatCurrency(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Draw side-by-side bars */}
                {chartData.map((month, idx) => {
                  const x = 80 + idx * (barWidth * 2 + gap);
                  
                  // Compute sums
                  const totalPlanned = month.categories.reduce((sum, c) => sum + ((c.totalLimit !== undefined ? c.totalLimit : c.limit) || 0), 0);
                  const totalSpent = month.categories.reduce((sum, c) => sum + (c.spent || 0), 0);

                  // Heights
                  const plannedHeight = (totalPlanned / maxVal) * chartHeight;
                  const spentHeight = (totalSpent / maxVal) * chartHeight;

                  // Positions (SVG y increases downwards)
                  const plannedY = chartHeight - plannedHeight + 20;
                  const spentY = chartHeight - spentHeight + 20;

                  return (
                    <g key={month.monthId}>
                      {/* Planned Bar */}
                      <rect 
                        x={x} 
                        y={plannedY} 
                        width={barWidth} 
                        height={plannedHeight} 
                        fill="rgba(168, 85, 247, 0.75)" 
                        rx="4"
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      >
                        <title>{`${t('plannedLimit')}: ${formatCurrency(totalPlanned)}`}</title>
                      </rect>
                      
                      {/* Spent Bar */}
                      <rect 
                        x={x + barWidth + 4} 
                        y={spentY} 
                        width={barWidth} 
                        height={spentHeight} 
                        fill={totalSpent > totalPlanned ? 'rgba(244, 63, 94, 0.85)' : 'rgba(16, 185, 129, 0.85)'} 
                        rx="4"
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                      >
                        <title>{`${t('actualSpent')}: ${formatCurrency(totalSpent)}`}</title>
                      </rect>

                      {/* Month Label */}
                      <text x={x + barWidth + 2} y={chartHeight + 40} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="bold">
                        {month.monthId}
                      </text>
                    </g>
                  );
                })}

                {/* Bottom line axis */}
                <line x1="60" y1={chartHeight + 20} x2="480" y2={chartHeight + 20} stroke="rgba(255,255,255,0.15)" />
              </svg>
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(168, 85, 247, 0.75)', borderRadius: '3px' }} />
                <span>{t('totalPlannedLimits')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.85)', borderRadius: '3px' }} />
                <span>{t('actualSpendUnder')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', background: 'rgba(244, 63, 94, 0.85)', borderRadius: '3px' }} />
                <span>{t('actualSpendOver')}</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 4. Past Snapshots Detailed Inspector */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📖</span> {t('pastReportsInspector')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
              {t('viewFullCategory')}
            </p>
          </div>
          
          <select 
            className="form-control" 
            style={{ minWidth: '180px', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            value={selectedPastMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">{t('chooseMonth')}</option>
            {history.map(h => (
              <option key={h.monthId} value={h.monthId}>{h.monthId} {t('pastReportsSnapshot')}</option>
            ))}
          </select>
        </div>

        {/* Selected Historical Snap Details */}
        {!selectedPastMonth ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            🔍 {t('selectPastMonthInspector')}
          </div>
        ) : !activeHistorySnapshot ? (
          <div style={{ color: 'var(--color-danger)' }}>Error: Snapshot not found.</div>
        ) : (
          <div>
            {/* Snapshot Summary Cards */}
            <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
              
              <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('jointMonthlyIncome')}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(activeHistorySnapshot.monthlyIncome)}</div>
              </div>

              <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('snapshotBudgetLimit')}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {formatCurrency(activeHistorySnapshot.categories.reduce((sum, c) => sum + ((c.totalLimit !== undefined ? c.totalLimit : c.limit) || 0), 0))}
                </div>
              </div>

              <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('actualSnapshotSpent')}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {formatCurrency(activeHistorySnapshot.categories.reduce((sum, c) => sum + (c.spent || 0), 0))}
                </div>
              </div>

            </div>

            {/* Category Lists from Completed month */}
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>🏷️ {t('envelopesStatusSheets')}</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {activeHistorySnapshot.categories.map(c => {
                const limit = c.totalLimit !== undefined ? c.totalLimit : c.limit;
                const pct = limit > 0 ? Math.round(((c.spent || 0) / limit) * 100) : 0;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.01)', padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.25rem' }}>{c.icon || '📦'}</span>
                    <span style={{ fontWeight: 600, minWidth: '150px' }}>{c.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {c.type === 'need' ? t('needsLabel') : c.type === 'want' ? t('wantsLabel') : t('savingsLabel')}
                    </span>
                    
                    {/* progress bar */}
                    <div style={{ flex: 1, minWidth: '150px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${Math.min(pct, 100)}%`, 
                          backgroundColor: (c.spent || 0) > limit ? 'var(--color-danger)' : 'var(--color-success)', 
                          borderRadius: '99px' 
                        }} 
                      />
                    </div>

                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: '180px', textAlign: 'right' }}>
                      {formatCurrency(c.spent || 0)} / {formatCurrency(limit)} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Completed Month Transaction ledger */}
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>🧾 {t('snapshotTransactionsLedger')}</h4>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              {activeHistorySnapshot.transactions.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('noTransactionsLoggedMonth')}</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="transaction-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>{t('date')}</th>
                        <th>{t('spender')}</th>
                        <th>{t('category')}</th>
                        <th>{t('notes')}</th>
                        <th style={{ textAlign: 'right' }}>{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeHistorySnapshot.transactions.map(tData => {
                        const cat = activeHistorySnapshot.categories.find(c => c.id === tData.categoryId);
                        return (
                          <tr key={tData.id}>
                            <td>{tData.date}</td>
                            <td>
                              <span className={`spender-badge ${tData.spender}`} style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                                {tData.spender === 'me' ? '👨 ' + t('husband') : tData.spender === 'spouse' ? '👩 ' + t('wife') : '🤝 ' + t('familyView')}
                              </span>
                            </td>
                            <td>{cat?.icon} {cat?.name || t('uncategorized')}</td>
                            <td>{tData.notes || t('noDescription')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatCurrency(tData.amount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* 5. Rollover Transition Wizard Dialog Modal overlay */}
      {isRolloverOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsRolloverOpen(false)}>&times;</button>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚀</span> {t('startNewMonthWizard')}
            </h3>

            <form onSubmit={handleStartNewMonthSubmit}>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', border: '1px solid var(--glass-border)', lineHeight: '1.4' }}>
                {t('transitionWizardDialogDesc').replace('this month', currentMonth).replace('bulan ini', currentMonth)}
              </div>

              {/* Rollover Choices Radio */}
              <div className="form-group">
                <label>{t('chooseRolloverCarryoverRule')}</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.35rem' }}>
                  
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem', 
                      padding: '0.75rem', 
                      background: rolloverChoice === 'rollover' ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)', 
                      border: `1px solid ${rolloverChoice === 'rollover' ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer' 
                    }}
                  >
                    <input 
                      type="radio" 
                      name="rollover-choice" 
                      value="rollover" 
                      checked={rolloverChoice === 'rollover'}
                      onChange={() => setRolloverChoice('rollover')} 
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{t('rolloverRemainingFunds')}</strong>
                      <span style={{ fontSize: '0.75rem' }}>{t('rolloverFundsDesc')}</span>
                    </div>
                  </label>

                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem', 
                      padding: '0.75rem', 
                      background: rolloverChoice === 'fresh' ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.02)', 
                      border: `1px solid ${rolloverChoice === 'fresh' ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer' 
                    }}
                  >
                    <input 
                      type="radio" 
                      name="rollover-choice" 
                      value="fresh" 
                      checked={rolloverChoice === 'fresh'}
                      onChange={() => setRolloverChoice('fresh')} 
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{t('cleanFreshStart')}</strong>
                      <span style={{ fontSize: '0.75rem' }}>{t('freshStartDesc')}</span>
                    </div>
                  </label>

                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRolloverOpen(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('startNewMonth')}</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
