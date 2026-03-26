import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Settings = ({ showToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: 'TriLux',
    contact_email: 'admin@trilux.com',
    language: 'en',
    email_notifications: true,
    sms_alerts: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (data && !error) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Attempt an upsert (id=1 is our unique global row)
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...settings, updated_at: new Date() });

    if (error) {
      showToast('error', 'Update Failed', error.message);
    } else {
      showToast('success', 'Settings Saved', 'Your preferences have been updated.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '10rem 4rem' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--accent)' }}></i>
        <p className="animate-pulse" style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Loading secure settings...</p>
      </div>
    );
  }

  return (
    <div id="settingsPage" className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title glow-text">Platform Settings</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Settings</span>
        </div>
      </div>

      <div className="table-card glass-card hover-glow" style={{ maxWidth: '800px' }}>
        <h3 className="table-title" style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          General Configuration
        </h3>
        
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                className="form-control" 
                name="company_name"
                value={settings.company_name} 
                onChange={handleChange}
                placeholder="Business Name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input 
                type="email" 
                className="form-control" 
                name="contact_email"
                value={settings.contact_email} 
                onChange={handleChange}
                placeholder="admin@example.com"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Platform Language</label>
            <select 
              className="form-control" 
              name="language"
              value={settings.language} 
              onChange={handleChange}
            >
              <option value="en">English (US)</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
            </select>
          </div>

          <h3 className="table-title" style={{ marginTop: '2.5rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
            Notifications
          </h3>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <input 
              type="checkbox" 
              id="email_notifications" 
              name="email_notifications"
              checked={settings.email_notifications} 
              onChange={handleChange}
              className="hover-glow"
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent)' }} 
            />
            <label htmlFor="email_notifications" style={{ color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>Email Notifications for New Orders</label>
          </div>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <input 
              type="checkbox" 
              id="sms_alerts" 
              name="sms_alerts"
              checked={settings.sms_alerts} 
              onChange={handleChange}
              className="hover-glow"
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent)' }} 
            />
            <label htmlFor="sms_alerts" style={{ color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>SMS Alerts for Low Stock</label>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
              {saving ? ' Saving...' : ' Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
