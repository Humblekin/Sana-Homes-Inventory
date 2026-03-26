import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import loginBg from '../assets/login_bg.png';
import '../index.css';

const Login = ({ setIsAuthenticated, showToast, setAuthMode, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showToast('error', 'Login Failed', error.message);
      } else {
        setIsAuthenticated(true);
        showToast('success', 'Login Successful', 'Welcome back to TriLux Admin!');
      }
    } catch (err) {
      showToast('error', 'Login Failed', 'An unexpected error occurred.');
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
      padding: '2rem',
      position: 'relative'
    }}>
      <div className="card-dark" style={{
        background: 'rgba(23, 23, 23, 0.75)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        padding: '3.5rem 2.75rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ color: 'var(--accent)', fontSize: '2.5rem', marginBottom: '1rem' }}>
            <i className="fas fa-tricycle"></i>
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            TriLux Admin
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Sign in to access the dashboard
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-envelope" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
              <input 
                type="email" 
                className="form-control" 
                placeholder="admin@trilux.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', transition: 'all 0.3s' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Password</label>
              <a href="#" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setAuthMode('forgot-password'); }}>Forgot?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', transition: 'all 0.3s' }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Don't have an account? <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); showToast('info', 'Registration', 'Contact the system administrator to sign up.'); }}>Sign Up</a>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }} onClick={(e) => { e.preventDefault(); onBack(); }}>
            <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }}></i>
            Back to Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
