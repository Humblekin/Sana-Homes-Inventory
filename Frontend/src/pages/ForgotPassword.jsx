import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import loginBg from '../assets/login_bg.png';
import '../index.css';

const ForgotPassword = ({ setAuthMode, showToast, onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        showToast('error', 'Request Failed', error.message);
      } else {
        showToast('success', 'Email Sent', 'Check your inbox for the reset link.');
        setAuthMode('login');
      }
    } catch (err) {
      showToast('error', 'Error', 'An unexpected error occurred.');
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
      backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${loginBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      padding: '2rem'
    }}>
      <div className="card-dark" style={{
        background: 'rgba(23, 23, 23, 0.75)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        padding: '3.5rem 2.75rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            We'll send you a link to get back into your account.
          </p>
        </div>

        <form onSubmit={handleReset}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="name@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('login'); }} style={{ color: 'var(--accent)', fontSize: '0.9rem', textDecoration: 'none' }}>
            Back to Login
          </a>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }} onClick={(e) => { e.preventDefault(); onBack(); }}>
            Back to Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
