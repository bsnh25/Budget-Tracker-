import React, { useState, useMemo } from 'react';

const PRESET_ICONS = ['🏠', '🛒', '⚡', '🚗', '🍔', '🎬', '🛍️', '✈️', '🛡️', '📈', '🧸', '💊', '🎓', '🐾', '💈', '☕', '🎁', '💐'];
const PRESET_COLORS = ['#ec4899', '#f43f5e', '#eab308', '#a855f7', '#3b82f6', '#06b6d4', '#14b8a6', '#f97316', '#10b981', '#059669', '#6366f1', '#64748b'];

export default function Categories({ budget }) {
  const { 
    categories, 
    monthlyIncome, 
    updateIncome, 
    saveCategory, 
    deleteCategory,
    t,
    formatCurrency,
    currency,
    showConfirm
  } = budget;

  // Local Category Builder modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('need');
  const [formLimit, setFormLimit] = useState('');
  const [formColor, setFormColor] = useState('#a855f7');
  const [formIcon, setFormIcon] = useState('🏠');

  // Local Joint Income edit state
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(monthlyIncome.toString());

  // Aggregate Category allocation limits
  const allocationMetrics = useMemo(() => {
    let totalAllocated = 0;
    let needsSum = 0;
    let wantsSum = 0;
    let savingsSum = 0;

    categories.forEach(c => {
      totalAllocated += c.limit;
      if (c.type === 'need') needsSum += c.limit;
      if (c.type === 'want') wantsSum += c.limit;
      if (c.type === 'saving') savingsSum += c.limit;
    });

    const unallocated = Math.max(0, monthlyIncome - totalAllocated);
    
    // Percentage ratios
    const needsPct = monthlyIncome > 0 ? Math.round((needsSum / monthlyIncome) * 100) : 0;
    const wantsPct = monthlyIncome > 0 ? Math.round((wantsSum / monthlyIncome) * 100) : 0;
    const savingsPct = monthlyIncome > 0 ? Math.round((savingsSum / monthlyIncome) * 100) : 0;
    const unallocatedPct = monthlyIncome > 0 ? Math.round((unallocated / monthlyIncome) * 100) : 0;

    return {
      totalAllocated,
      unallocated,
      needsSum,
      wantsSum,
      savingsSum,
      needsPct,
      wantsPct,
      savingsPct,
      unallocatedPct,
    };
  }, [categories, monthlyIncome]);

  // Open modal for adding category
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType('need');
    setFormLimit('');
    setFormColor('#a855f7');
    setFormIcon('🏠');
    setIsModalOpen(true);
  };

  // Open modal for editing category
  const handleOpenEdit = (c) => {
    setEditingCategory(c);
    setFormName(c.name);
    setFormType(c.type);
    setFormLimit(c.limit.toString());
    setFormColor(c.color);
    setFormIcon(c.icon);
    setIsModalOpen(true);
  };

  // Submit category form
  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert(t('categoryEnvelopeName'));
      return;
    }
    if (!formLimit || isNaN(formLimit) || parseFloat(formLimit) < 0) {
      alert(t('clearFiltersSearch'));
      return;
    }

    const catData = {
      id: editingCategory ? editingCategory.id : undefined,
      name: formName.trim(),
      type: formType,
      limit: parseFloat(formLimit),
      color: formColor,
      icon: formIcon,
    };

    saveCategory(catData);
    setIsModalOpen(false);
  };

  // Income save
  const handleSaveIncome = (e) => {
    e.preventDefault();
    const parsed = parseFloat(incomeInput);
    if (!isNaN(parsed) && parsed >= 0) {
      updateIncome(parsed);
      setIsEditingIncome(false);
    } else {
      alert(t('jointMonthlyIncome'));
    }
  };

  // Calculate SVG Donut segment dash offsets
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const donutSegments = useMemo(() => {
    const { needsSum, wantsSum, savingsSum, unallocated } = allocationMetrics;
    const total = monthlyIncome || 1; // avoid divide by zero
    
    const needsRatio = needsSum / total;
    const wantsRatio = wantsSum / total;
    const savingsRatio = savingsSum / total;
    const unallocatedRatio = Math.max(0, unallocated) / total;

    // Offsets are cumulative
    const needsDash = circumference * needsRatio;
    const wantsDash = circumference * wantsRatio;
    const savingsDash = circumference * savingsRatio;
    const unallocatedDash = circumference * unallocatedRatio;

    return {
      needs: {
        strokeDasharray: `${needsDash} ${circumference - needsDash}`,
        strokeDashoffset: 0,
      },
      wants: {
        strokeDasharray: `${wantsDash} ${circumference - wantsDash}`,
        strokeDashoffset: -needsDash,
      },
      savings: {
        strokeDasharray: `${savingsDash} ${circumference - savingsDash}`,
        strokeDashoffset: -(needsDash + wantsDash),
      },
      unallocated: {
        strokeDasharray: `${unallocatedDash} ${circumference - unallocatedDash}`,
        strokeDashoffset: -(needsDash + wantsDash + savingsDash),
      }
    };
  }, [allocationMetrics, monthlyIncome, circumference]);

  return (
    <div className="app-layout">
      {/* 1. Header Area */}
      <div className="main-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{t('categoryPlanner')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('customizeEnvelopesDesc')}
          </p>
        </div>
        
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <span>➕</span> {t('addCustomCategory')}
        </button>
      </div>

      {/* 2. Top Allocation Donut & Joint Income Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Income Settings Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyGap: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💰</span> {t('jointMonthlyIncome')}
            </h3>
            
            {isEditingIncome ? (
              <form onSubmit={handleSaveIncome} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  className="form-control" 
                  value={incomeInput} 
                  onChange={(e) => setIncomeInput(e.target.value)}
                  placeholder={t('jointMonthlyIncome')}
                  required
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.4rem' }}>{t('save')}</button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem' }} onClick={() => setIsEditingIncome(false)}>{t('cancel')}</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Outfit', color: 'var(--color-success)' }}>
                  {formatCurrency(monthlyIncome)}
                </span>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px' }}
                  onClick={() => { setIncomeInput(monthlyIncome.toString()); setIsEditingIncome(true); }}
                >
                  ✏️ {t('edit')}
                </button>
              </div>
            )}
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem', lineHeight: '1.4' }}>
              {t('jointIncomeDesc')}
            </p>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('totalAllocated')}:</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(allocationMetrics.totalAllocated)} ({Math.round((allocationMetrics.totalAllocated / (monthlyIncome || 1)) * 100)}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t('unallocatedSurplus')}:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>{formatCurrency(allocationMetrics.unallocated)}</span>
            </div>
          </div>
        </div>

        {/* 50/30/20 Visual Allocation Insight Card */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* Circular Donut Visual */}
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg width="100%" height="100%" viewBox="0 0 120 120" className="donut-svg">
              {/* Needs segment */}
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke="var(--color-primary)" 
                strokeWidth={strokeWidth}
                strokeDasharray={donutSegments.needs.strokeDasharray}
                strokeDashoffset={donutSegments.needs.strokeDashoffset}
                className="donut-segment"
              />
              {/* Wants segment */}
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke="var(--color-secondary)" 
                strokeWidth={strokeWidth}
                strokeDasharray={donutSegments.wants.strokeDasharray}
                strokeDashoffset={donutSegments.wants.strokeDashoffset}
                className="donut-segment"
              />
              {/* Savings segment */}
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke="var(--color-joint)" 
                strokeWidth={strokeWidth}
                strokeDasharray={donutSegments.savings.strokeDasharray}
                strokeDashoffset={donutSegments.savings.strokeDashoffset}
                className="donut-segment"
              />
              {/* Unallocated surplus segment */}
              <circle 
                cx="60" cy="60" r={radius} 
                fill="transparent" 
                stroke="#1f2937" 
                strokeWidth={strokeWidth}
                strokeDasharray={donutSegments.unallocated.strokeDasharray}
                strokeDashoffset={donutSegments.unallocated.strokeDashoffset}
                className="donut-segment"
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.65rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                {Math.round((allocationMetrics.totalAllocated / (monthlyIncome || 1)) * 100)}%
              </span>
            </div>
          </div>

          {/* Allocation Legend Insights */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{t('jointTargets')}</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--color-primary)' }} />
                <span>🏠 {t('needsLabel')}: <strong>{allocationMetrics.needsPct}%</strong> ({t('targetFifty')})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--color-secondary)' }} />
                <span>🍔 {t('wantsLabel')}: <strong>{allocationMetrics.wantsPct}%</strong> ({t('targetThirty')})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--color-joint)' }} />
                <span>📈 {t('savingsLabel')}: <strong>{allocationMetrics.savingsPct}%</strong> ({t('targetTwenty')})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#1f2937' }} />
                <span>{t('surplusLabel')}: <strong style={{ color: 'var(--color-success)' }}>{allocationMetrics.unallocatedPct}%</strong></span>
              </div>

            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
              💡 {allocationMetrics.needsPct > 55 ? t('insightsNeedsHigh') : t('insightsNormal')} {allocationMetrics.savingsPct < 20 ? t('insightsSavingsLow') : t('insightsSavingsGood')}
            </p>
          </div>

        </div>

      </div>

      {/* 3. Category Groups Boards */}
      {['need', 'want', 'saving'].map(group => {
        const list = categories.filter(c => c.type === group);
        const groupLabel = group === 'need' ? '🏠 ' + t('essentialNeeds') : group === 'want' ? '🍔 ' + t('personalWants') : '🛡️ ' + t('savingsGoalsInvestments');
        const groupDesc = group === 'need' ? t('needsDesc') : group === 'want' ? t('wantsDesc') : t('savingsDesc');

        return (
          <div key={group} style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
              {groupLabel}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>{groupDesc}</p>
            
            <div className="categories-grid">
              {list.map(c => (
                <div key={c.id} className="glass-panel glass-panel-interactive" style={{ borderLeft: `4px solid ${c.color}`, padding: '1rem 1.25rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.3rem', borderRadius: '10px' }}>{c.icon}</span>
                      <div>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{c.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('monthlyDollarBudget')}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 'bold' }}>{formatCurrency(c.limit)}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t('jointMonth')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px' }}
                      onClick={() => handleOpenEdit(c)}
                    >
                      ✏️ {t('edit')}
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '6px', border: 'none' }}
                      onClick={() => {
                        showConfirm({
                          title: t('delete') + ' ' + t('category'),
                          message: t('confirmDeleteCategory').replace('{name}', c.name),
                          isDanger: true,
                          onConfirm: () => deleteCategory(c.id)
                        });
                      }}
                    >
                      🗑️ {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 4. Category Customizer Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📦</span> {editingCategory ? t('editCategoryEnvelope') : t('createCategory')}
            </h3>

            <form onSubmit={handleCategorySubmit}>
              
              {/* Name */}
              <div className="form-group">
                <label>{t('categoryEnvelopeName')}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Pet Care, Hobbies, Gym"
                  className="form-control"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              {/* Type Grid */}
              <div className="form-group">
                <label>{t('groupingClassification')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${formType === 'need' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem', fontSize: '0.75rem', background: formType === 'need' ? 'var(--color-primary)' : 'rgba(255,255,255,0.03)' }}
                    onClick={() => setFormType('need')}
                  >
                    🏠 {t('needsLabel')}
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${formType === 'want' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem', fontSize: '0.75rem', background: formType === 'want' ? 'var(--color-secondary)' : 'rgba(255,255,255,0.03)' }}
                    onClick={() => setFormType('want')}
                  >
                    🍔 {t('wantsLabel')}
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${formType === 'saving' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.4rem', fontSize: '0.75rem', background: formType === 'saving' ? 'var(--color-joint)' : 'rgba(255,255,255,0.03)' }}
                    onClick={() => setFormType('saving')}
                  >
                    🛡️ {t('savingsLabel')}
                  </button>
                </div>
              </div>

              {/* Limit */}
              <div className="form-group">
                <label>{t('monthlyDollarBudget')} ({currency})</label>
                <input 
                  type="number" 
                  min="0"
                  step={currency === 'USD' ? '0.01' : '1'}
                  placeholder={currency === 'USD' ? 'e.g. 350' : currency === 'JPY' ? 'e.g. 50000' : 'e.g. 5000000'}
                  className="form-control"
                  required
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                />
              </div>

              {/* Icon Selector preset */}
              <div className="form-group">
                <label>Icon Selector: {formIcon}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  {PRESET_ICONS.map(ic => (
                    <button 
                      key={ic}
                      type="button"
                      style={{ 
                        fontSize: '1.25rem', 
                        background: formIcon === ic ? 'rgba(255,255,255,0.1)' : 'transparent', 
                        border: formIcon === ic ? '1px solid var(--color-primary)' : 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '6px'
                      }}
                      onClick={() => setFormIcon(ic)}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Presets */}
              <div className="form-group">
                <label>{t('accentColor')}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
                  {PRESET_COLORS.map(col => (
                    <button 
                      key={col}
                      type="button"
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '99px', 
                        backgroundColor: col, 
                        border: formColor === col ? '2px solid white' : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => setFormColor(col)}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={formColor} 
                    onChange={(e) => setFormColor(e.target.value)}
                    style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? t('updateEnvelope') : t('createCategory')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
