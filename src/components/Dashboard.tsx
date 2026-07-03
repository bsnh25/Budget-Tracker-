import React, { useState } from 'react';
import { useBudgetController } from '../controllers/useBudgetController';

interface DashboardProps {
  budget: ReturnType<typeof useBudgetController>;
  openLogger: () => void;
}

export default function Dashboard({ budget, openLogger }: DashboardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const { 
    dateMetrics, 
    budgetMetrics, 
    monthlyIncome, 
    activeProfile,
    t,
    formatCurrency
  } = budget;

  const { 
    enrichedCategories, 
    totalPlannedLimit, 
    totalSpent, 
    totalProjected, 
    groupMetrics, 
    isOverpace 
  } = budgetMetrics;

  const totalRemaining = totalPlannedLimit - totalSpent;
  const elapsedPercent = Math.round(dateMetrics.pacingRatio * 100);

  const warningCategories = enrichedCategories.filter(
    c => c.pacingStatus === 'yellow' || c.pacingStatus === 'red'
  );

  return (
    <div className="app-layout">
      {/* 1. Header Hero Banner */}
      <div className="main-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{t('monthlyDashboard')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {budget.language === 'id' 
              ? 'Melacak anggaran keluarga bersama untuk' 
              : 'Tracking collective family budgets for'}{' '}
            <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{budget.currentMonth}</span>
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={openLogger}>
          <span>➕</span> {t('logExpense')}
        </button>
      </div>

      {/* 2. Month Calendar Progress & Pacing Banner */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🗓️</span>
            <strong>{t('monthProgress')}</strong>
            <span style={{ color: 'var(--text-secondary)' }}>({dateMetrics.elapsedDays} of {dateMetrics.totalDays} {t('daysPassed')})</span>
          </div>
          <span style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{elapsedPercent}% {t('elapsed')}</span>
        </div>
        
        <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${elapsedPercent}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '99px' }} />
        </div>

        {/* Real-time Pacing Banner Warning */}
        <div className={`pacing-banner ${totalSpent > totalPlannedLimit ? 'danger' : isOverpace ? 'danger' : 'success'}`} style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '1.5rem' }}>
            {totalSpent > totalPlannedLimit ? '🚨' : isOverpace ? '⚠️' : '🟢'}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>
              {totalSpent > totalPlannedLimit 
                ? t('budgetExceeded') 
                : isOverpace 
                ? t('pacingWarning') 
                : t('spendingOnTrack')}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.3' }}>
              {totalSpent > totalPlannedLimit
                ? `${t('budgetExceeded')} ${formatCurrency(totalSpent)} / ${formatCurrency(totalPlannedLimit)}.`
                : isOverpace
                ? `${t('pacingWarning')} ${t('elapsed')} ${elapsedPercent}%, spent ${Math.round((totalSpent / (totalPlannedLimit || 1)) * 100)}%.`
                : `${t('spendingOnTrack')} ${formatCurrency(totalSpent)} (${Math.round((totalSpent / (totalPlannedLimit || 1)) * 100)}%) ${t('ofJointIncome')}.`}
            </p>
            <button 
              onClick={() => setShowExplanation(true)} 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '0',
                marginTop: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                textDecoration: 'underline'
              }}
            >
              ℹ️ {t('howIsThisCalculated')}
            </button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('projectedMonthEnd')}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: totalProjected > totalPlannedLimit ? 'var(--color-danger)' : 'var(--color-success)' }}>
              {formatCurrency(totalProjected)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Metrics Row */}
      <div className="metrics-grid dashboard-metrics-grid">
        <div className="glass-panel glass-panel-interactive">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('totalMonthlyLimit')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit' }}>{formatCurrency(totalPlannedLimit)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {t('ofJointIncome')}: <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatCurrency(monthlyIncome)}</span>
          </div>
        </div>
        
        <div className="glass-panel glass-panel-interactive" style={{ borderBottom: `2px solid ${totalSpent > totalPlannedLimit ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('actualSpent')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit', color: totalSpent > totalPlannedLimit ? 'var(--color-danger)' : 'var(--color-success)' }}>
            {formatCurrency(totalSpent)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {t('remaining')}: <span style={{ color: totalRemaining < 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'bold' }}>
              {formatCurrency(totalRemaining)}
            </span>
          </div>
        </div>

        <div className="glass-panel glass-panel-interactive">
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{t('pacingBurnRate')}</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'Outfit', color: isOverpace ? 'var(--color-warning)' : 'var(--text-primary)' }}>
            {formatCurrency(dateMetrics.elapsedDays > 0 ? Math.round(totalSpent / dateMetrics.elapsedDays) : 0)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/ {t('day')}</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {dateMetrics.daysRemaining} {t('daysRemainingThisMonth')}
          </div>
        </div>
      </div>

      {/* 4. Main Grid: Category Progress Bars & Alerts */}
      <div className="dashboard-layout-grid" style={{ gap: '1.5rem' }}>
        
        {/* Progress Bars (Left Side) */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📊 {t('budgetProgressCategory')}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('pacingLineRepresentedBy')} 📅</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {enrichedCategories.map(c => {
              const spentPercent = Math.round((c.spentRatio || 0) * 100);
              
              return (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{c.icon}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                      {c.bonus && c.bonus > 0 ? (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '1px 6px', borderRadius: '4px' }}>
                          +{formatCurrency(c.bonus)} rollover
                        </span>
                      ) : null}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <span style={{ color: (c.spent || 0) > (c.totalLimit || 0) ? 'var(--color-danger)' : 'var(--text-primary)', fontWeight: 'bold' }}>
                        {formatCurrency(c.spent || 0)}
                      </span>
                      <span> / {formatCurrency(c.totalLimit || 0)}</span>
                    </div>
                  </div>

                  {/* Progress Container with pacing marker */}
                  <div className="progress-container">
                    {dateMetrics.isCurrentRealMonth && (
                      <div 
                        className="pacing-line" 
                        style={{ left: `${elapsedPercent}%` }} 
                        title={`Day ${dateMetrics.elapsedDays} Pacing Needle (${elapsedPercent}%)`}
                      />
                    )}
                    
                    {/* Filled Bar */}
                    <div 
                      className={`progress-fill ${c.pacingStatus}`} 
                      style={{ 
                        width: `${Math.min(spentPercent, 100)}%`,
                        background: c.pacingStatus === 'red' 
                          ? 'linear-gradient(90deg, #f43f5e, #e11d48)' 
                          : c.pacingStatus === 'yellow' 
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                          : `linear-gradient(90deg, ${c.color}, ${c.color}cc)`
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>
                      {(c.spent || 0) > (c.totalLimit || 0) 
                        ? `Over by ${formatCurrency((c.spent || 0) - (c.totalLimit || 0))}` 
                        : `${formatCurrency((c.totalLimit || 0) - (c.spent || 0))} ${t('remaining')}`}
                    </span>
                    <span>
                      {spentPercent}% spent • Projected {formatCurrency(c.projectedSpend || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Alerts / Allocation (Right Side) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Group Budgets Summary */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
              📁 {t('spendingGroups')}
            </h3>
            
            {['need', 'want', 'saving'].map(type => {
              const metrics = groupMetrics[type as 'need' | 'want' | 'saving'];
              const pct = metrics.planned > 0 ? Math.round((metrics.spent / metrics.planned) * 100) : 0;
              const typeLabel = type === 'need' ? `🏠 ${t('essentialNeeds')}` : type === 'want' ? `🍔 ${t('personalWants')}` : `🛡️ ${t('savingsGoalsInvestments')}`;
              const themeColor = type === 'need' ? 'var(--color-primary)' : type === 'want' ? 'var(--color-secondary)' : 'var(--color-joint)';

              return (
                <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{typeLabel}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {formatCurrency(metrics.spent)} / {formatCurrency(metrics.planned)}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: themeColor, borderRadius: '99px' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {pct}% spent
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time warnings ledger */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
              ⚠️ {t('pacingWarnings')}
            </h3>

            {warningCategories.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem 0', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {t('greatJobPacing')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px' }}>
                {warningCategories.map(c => (
                  <div 
                    key={c.id} 
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: '10px', 
                      background: c.pacingStatus === 'red' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      border: `1px solid ${c.pacingStatus === 'red' ? 'rgba(244,63,94,0.15)' : 'rgba(245,158,11,0.15)'}`,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{c.pacingStatus === 'red' ? '🔴' : '⚠️'}</span>
                    <div>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                        {c.name} {c.pacingStatus === 'red' ? t('warningOverpace') : t('warningSlightlyAhead')}
                      </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Spent {Math.round((c.spentRatio || 0) * 100)}% ({formatCurrency(c.spent || 0)}) against pace ({elapsedPercent}%). Projected {formatCurrency(c.projectedSpend || 0)}.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {showExplanation && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '92%', maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setShowExplanation(false)}>&times;</button>
            
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {t('calcExplanationTitle')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
              <p>{t('calcExplanationIntro')}</p>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.25rem 0' }} />

              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>📈</span> {t('calcProjTitle')}
                </h4>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.75rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-secondary)', marginBottom: '0.5rem', border: '1px solid var(--glass-border)' }}>
                  {t('calcProjFormula')}
                </div>
                <p>{t('calcProjDesc')}</p>
                
                <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px dashed rgba(168, 85, 247, 0.3)', padding: '0.8rem', borderRadius: '10px', marginTop: '0.6rem' }}>
                  <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.25rem' }}>{t('calcFixedExAnomaly')}</strong>
                  <span style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{t('calcFixedExAnomalyDesc')}</span>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '0.25rem 0' }} />

              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>⏱️</span> {t('calcPacingTitle')}
                </h4>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.75rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-warning)', marginBottom: '0.5rem', border: '1px solid var(--glass-border)' }}>
                  {t('calcPacingFormula')}
                </div>
                <p>{t('calcPacingDesc')}</p>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px dashed rgba(16, 185, 129, 0.3)', padding: '0.8rem', borderRadius: '10px', marginTop: '0.6rem' }}>
                  <strong style={{ color: 'var(--color-success)', display: 'block', marginBottom: '0.25rem' }}>{t('calcPacingFriendlyTip')}</strong>
                  <span style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{t('calcPacingFriendlyTipDesc')}</span>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => setShowExplanation(false)}>
                  {t('closeBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
