import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // Note: Depending on Supabase settings, users might need to confirm email first
        if (data?.user && data?.session === null) {
          setSuccess('Pendaftaran berhasil! Silakan periksa inbox email Anda untuk melakukan verifikasi akun (jika diaktifkan di dashboard Supabase), lalu silakan login.');
        } else {
          setSuccess('Akun berhasil dibuat dan Anda telah otomatis masuk!');
        }
      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error(err);
      // Translate typical supabase error messages for Indonesian users
      let errMsg = err.message;
      if (err.message === 'Invalid login credentials') {
        errMsg = 'Email atau kata sandi salah. Silakan coba lagi.';
      } else if (err.message === 'User already registered') {
        errMsg = 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
      } else if (err.message === 'Password should be at least 6 characters') {
        errMsg = 'Kata sandi minimal harus terdiri dari 6 karakter.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '1.5rem',
      background: 'radial-gradient(circle at 50% 0%, var(--bg-obsidian-light) 0%, var(--bg-obsidian-dark) 85%)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        borderRadius: '24px',
        animation: 'fadeIn 0.6s ease-out',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '200px',
          height: '200px',
          background: 'var(--color-primary-glow)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '200px',
          height: '200px',
          background: 'var(--color-secondary-glow)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo & Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🌌</span>
            <h1 className="glow-primary" style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              fontFamily: 'Outfit',
              background: 'linear-gradient(to right, #c084fc, #38bdf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.25rem'
            }}>
              KiaBiyu Budget Tracker
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Rencana & Pelacak Keuangan Keluarga Bersama
            </p>
          </div>

          {/* Sliding Tabs */}
          <div className="profile-selector" style={{ marginBottom: '1.75rem', padding: '0.25rem' }}>
            <button
              className={`profile-tab me ${!isSignUp ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.6rem' }}
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccess('');
              }}
            >
              🔑 Masuk (Login)
            </button>
            <button
              className={`profile-tab spouse ${isSignUp ? 'active' : ''}`}
              style={{ flex: 1, padding: '0.6rem' }}
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccess('');
              }}
            >
              📝 Daftar Akun
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="spender-badge me" style={{
              width: '100%',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              whiteSpace: 'normal',
              lineHeight: '1.4'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="spender-badge joint" style={{
              width: '100%',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              whiteSpace: 'normal',
              lineHeight: '1.4'
            }}>
              🎉 {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="email">Email Keluarga Bersama</label>
              <input
                id="email"
                type="email"
                required
                placeholder="contoh: keluarga@email.com"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="password">Kata Sandi</label>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                marginTop: '0.5rem',
                border: 'none',
                position: 'relative'
              }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Memproses...
                </div>
              ) : isSignUp ? (
                'Buat Akun Keluarga'
              ) : (
                'Masuk ke Dasbor'
              )}
            </button>
          </form>

          {/* Helper Note */}
          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            lineHeight: '1.4',
            marginTop: '1.75rem'
          }}>
            {isSignUp
              ? 'Dengan mendaftar, Anda membuat satu basis data cloud pribadi di Supabase yang dapat digunakan bersama dengan pasangan Anda secara sinkron.'
              : 'Gunakan email dan kata sandi yang sama di handphone Anda dan pasangan untuk sinkronisasi pengeluaran real-time.'}
          </p>
        </div>
      </div>

      {/* Spinner animation styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
