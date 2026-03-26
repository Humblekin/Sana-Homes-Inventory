import React from 'react';
import loginBg from '../assets/login_bg.png';
import '../index.css';

const VerifyEmail = ({ setAuthMode, onBack }) => {
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ color: 'var(--accent)', fontSize: '3rem', marginBottom: '1.5rem' }}>
            <i className="fas fa-envelope-open-text"></i>
          </div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Check your email
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            We've sent a verification link to your inbox. Please click the link to activate your account.
          </p>
        </div>

        <button 
           className="btn-primary" 
           style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }} 
           onClick={() => setAuthMode('login')}
        >
          Back to Login
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem' }} onClick={(e) => { e.preventDefault(); onBack(); }}>
            Back to Website
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
