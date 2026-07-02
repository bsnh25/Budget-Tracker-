import React from 'react';

export default function Settings({ budget }) {
  const {
    language,
    currency,
    cycleStartDay,
    dateMetrics,
    selectLanguage,
    selectCurrency,
    selectCycleStartDay,
    user,
    signOut,
    showConfirm,
    exportData,
    importData,
    resetToFresh,
    injectDemoData,
    theme,
    toggleTheme,
    t
  } = budget;

  // Formatting date string nicely for the user (e.g. 2026-06-25 to 25 Juni 2026)
  const formatDatePretty = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const mIdx = parseInt(m) - 1;
    const monthName = language === 'id' ? monthsId[mIdx] : monthsEn[mIdx];
    return `${parseInt(d)} ${monthName} ${y}`;
  };

  const handleImportClick = () => {
    document.getElementById('settings-import-file-input')?.click();
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (content && typeof content === 'string') {
        const success = importData(content);
        if (success) {
          alert(language === 'id' ? 'Cadangan berhasil dipulihkan! Semua data disinkronkan.' : 'Backup restored successfully! All data accounts synced.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app-layout" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div className="main-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', fontFamily: 'Outfit' }}>
            {language === 'id' ? 'Pengaturan Sistem' : 'System Settings'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {language === 'id' 
              ? 'Kelola preferensi bahasa, mata uang, siklus pembayaran payroll, dan sinkronisasi akun' 
              : 'Manage language, currency, payroll billing cycle, and account synchronization'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="settings-grid">
        
        {/* Left Column: Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. Appearance & Preferences Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🎨</span> {language === 'id' ? 'Tampilan & Preferensi' : 'Appearance & Preferences'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Theme Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {language === 'id' ? 'Tema Tampilan' : 'Display Theme'}
                </label>
                <div className="profile-selector" style={{ padding: '0.25rem', width: '100%' }}>
                  <button 
                    className={`profile-tab me ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    🌙 {language === 'id' ? 'Mode Gelap' : 'Dark Mode'}
                  </button>
                  <button 
                    className={`profile-tab spouse ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    ☀️ {language === 'id' ? 'Mode Terang' : 'Light Mode'}
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {language === 'id' ? 'Bahasa Tampilan' : 'Display Language'}
                </label>
                <div className="profile-selector" style={{ padding: '0.25rem', width: '100%' }}>
                  <button 
                    className={`profile-tab me ${language === 'id' ? 'active' : ''}`}
                    onClick={() => selectLanguage('id')}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    🇮🇩 Bahasa Indonesia
                  </button>
                  <button 
                    className={`profile-tab spouse ${language === 'en' ? 'active' : ''}`}
                    onClick={() => selectLanguage('en')}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              {/* Currency Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {language === 'id' ? 'Mata Uang Acuan' : 'System Currency'}
                </label>
                <div className="profile-selector" style={{ padding: '0.25rem', width: '100%' }}>
                  <button 
                    className={`profile-tab me ${currency === 'IDR' ? 'active' : ''}`}
                    onClick={() => selectCurrency('IDR')}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    Rp IDR (Rupiah)
                  </button>
                  <button 
                    className={`profile-tab spouse ${currency === 'USD' ? 'active' : ''}`}
                    onClick={() => selectCurrency('USD')}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    $ USD (Dollar)
                  </button>
                  <button 
                    className={`profile-tab joint ${currency === 'JPY' ? 'active' : ''}`}
                    onClick={() => selectCurrency('JPY')}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    ¥ JPY (Yen)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Custom Billing Cycle (Payroll Day) Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📅</span> {language === 'id' ? 'Siklus Anggaran (Tanggal Payroll)' : 'Custom Budget Cycle (Payroll Day)'}
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '1.25rem' }}>
              {language === 'id'
                ? 'Secara bawaan, anggaran dihitung per bulan kalender (tanggal 1 s/d akhir bulan). Jika Anda menerima gaji (payroll) di pertengahan bulan (misal tanggal 25), Anda dapat menyelaraskan siklus agar anggaran dihitung dari tanggal 25 bulan lalu s/d tanggal 24 bulan berjalan.'
                : 'By default, budgets reset per calendar month (1st to month-end). If you receive your salary mid-month (e.g. 25th), you can align your cycle start so budgets run from the 25th of last month to the 24th of this month.'}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Day Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {language === 'id' ? 'Hari Mulai Siklus' : 'Cycle Start Day'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select 
                    value={cycleStartDay} 
                    onChange={(e) => selectCycleStartDay(parseInt(e.target.value))}
                    className="form-control"
                    style={{ padding: '0.4rem 1.5rem 0.4rem 0.75rem', width: '110px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d} style={{ background: '#0d1222', color: 'white' }}>
                        {d} {d === 1 ? (language === 'id' ? '(Kalender)' : '(Standard)') : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Range Preview */}
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {language === 'id' ? 'Pratinjau Siklus Berjalan (Juli 2026)' : 'Active July 2026 Cycle Preview'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-primary-glow)' }}>
                    📅 {formatDatePretty(dateMetrics.startDate)} — {formatDatePretty(dateMetrics.endDate)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ⏱️ {language === 'id' ? `Durasi total: ${dateMetrics.totalDays} hari` : `Total duration: ${dateMetrics.totalDays} days`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cloud Account & Portability Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 3. Collaborative Family Cloud Account Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: '-20%',
              right: '-20%',
              width: '160px',
              height: '160px',
              background: 'var(--color-primary-glow)',
              filter: 'blur(70px)',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👤</span> {language === 'id' ? 'Akun Finansial Keluarga Bersama' : 'Shared Family Cloud Account'}
              </h3>

              {user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {language === 'id' ? 'Email Terhubung:' : 'Connected Email Address:'}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {user.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {language === 'id' ? 'Sinkronisasi Cloud Real-time Aktif' : 'Real-time Cloud Sync Active'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      justifyContent: 'center',
                      color: 'var(--color-danger)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      background: 'rgba(244, 63, 94, 0.02)',
                      fontSize: '0.9rem'
                    }}
                    onClick={() => {
                      showConfirm({
                        title: language === 'id' ? 'Keluar Sesi' : 'Sign Out',
                        message: language === 'id' 
                          ? 'Apakah Anda yakin ingin keluar? Sesi sinkronisasi real-time akan dihentikan sementara.' 
                          : 'Are you sure you want to sign out? Real-time database sync will be paused.',
                        confirmText: language === 'id' ? 'Ya, Keluar' : 'Sign Out',
                        cancelText: language === 'id' ? 'Batal' : 'Cancel',
                        onConfirm: signOut,
                        isDanger: true
                      });
                    }}
                  >
                    🚪 {language === 'id' ? 'Keluar dari Akun' : 'Sign Out of Account'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {language === 'id' ? 'Menggunakan mode tamu luring' : 'Using guest offline sandbox mode'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Portability Backups & Diagnostics Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '18px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📦</span> {language === 'id' ? 'Portabilitas & Diagnostik Sistem' : 'Portability & Diagnostics'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center' }} 
                onClick={exportData}
              >
                📤 {language === 'id' ? 'Ekspor Cadangan' : 'Export JSON Backup'}
              </button>
              
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.75rem', fontSize: '0.85rem', justifyContent: 'center' }} 
                onClick={handleImportClick}
              >
                📥 {language === 'id' ? 'Impor Cadangan' : 'Import JSON Backup'}
              </button>

              <input 
                type="file" 
                id="settings-import-file-input" 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleImportFileChange} 
              />
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                ⚠️ {language === 'id' ? 'Tindakan Berisiko / Reset Data' : 'Danger Zone / Destructive Actions'}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.65rem', fontSize: '0.8rem', justifyContent: 'center' }}
                  onClick={() => {
                    showConfirm({
                      title: language === 'id' ? 'Muat Data Demo' : 'Load Demo Data',
                      message: language === 'id' 
                        ? 'Apakah Anda yakin ingin memuat ulang data tiruan 3 bulan lalu? Tindakan ini akan menimpa anggaran aktif Anda saat ini.' 
                        : 'Are you sure you want to reload 3-months of preloaded demo data? This will overwrite your active budgets.',
                      confirmText: language === 'id' ? 'Muat Demo' : 'Load Demo',
                      cancelText: language === 'id' ? 'Batal' : 'Cancel',
                      onConfirm: injectDemoData,
                      isDanger: false
                    });
                  }}
                >
                  🎭 {language === 'id' ? 'Muat Data Simulasi' : 'Load Demo Data'}
                </button>

                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.65rem', fontSize: '0.8rem', justifyContent: 'center', color: 'var(--color-danger)', border: '1px solid rgba(244, 63, 94, 0.15)' }}
                  onClick={() => {
                    showConfirm({
                      title: language === 'id' ? 'Reset Total Basis Data' : 'Reset Everything',
                      message: language === 'id' 
                        ? 'PERINGATAN: Menghapus total seluruh transaksi, kategori anggaran, dan riwayat tutup bulan Anda? Data di cloud juga akan dibersihkan.' 
                        : 'WARNING: Completely wipe all transactions, category folders, and historical logs? This clears cloud sync as well.',
                      confirmText: language === 'id' ? 'Hapus Semua' : 'Wipe Data',
                      cancelText: language === 'id' ? 'Batal' : 'Cancel',
                      onConfirm: resetToFresh,
                      isDanger: true
                    });
                  }}
                >
                  🗑️ {language === 'id' ? 'Reset Semua Data' : 'Reset All System'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded slide animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
