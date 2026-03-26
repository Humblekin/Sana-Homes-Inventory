import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Reports = ({ showToast }) => {
  const [modalActive, setModalActive] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      showToast('error', 'Fetch Failed', error.message);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    const { data: newData, error } = await supabase
      .from('reports')
      .insert([{
        name: data.reportName,
        description: data.description || 'Custom generated report configuration.',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        freq: data.frequency
      }])
      .select();

    if (error) {
      showToast('error', 'Generation Failed', error.message);
    } else {
      setReports([newData[0], ...reports]);
      showToast('success', 'Report Generated', `Your custom report '${data.reportName}' is ready.`);
      setModalActive(false);
    }
  };

  return (
    <div id="reportsPage" className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title glow-text">Analytics & Reports</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Reports</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card hover-glow animate-stagger-1">
          <div className="stat-header">
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Generated Reports</h3>
          </div>
          <div className="stat-value">{reports.length + 21}</div>
          <div className="stat-change positive">This Month</div>
        </div>
        <div className="stat-card glass-card hover-glow animate-stagger-2">
          <div className="stat-header">
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom Queries</h3>
          </div>
          <div className="stat-value">{reports.length}</div>
          <div className="stat-change info">Saved Views</div>
        </div>
      </div>

      <div className="table-card glass-card hover-glow">
        <div className="table-header">
          <h3 className="table-title">Available Reports</h3>
          <div className="table-actions">
            <button className="btn-primary" onClick={() => setModalActive(true)}>
              <i className="fas fa-plus"></i>
              Create Custom Report
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
          </div>
        ) : (
          <div className="table-container-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Description</th>
                  <th>Last Generated</th>
                  <th>Frequency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r, index) => (
                  <tr key={index} className="hover-glow">
                    <td style={{ fontWeight: '700' }}>{r.name}</td>
                    <td style={{ fontSize: '0.9rem', opacity: 0.8 }}>{r.description}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td><span className="table-status processing" style={{ fontSize: '0.7rem' }}>{r.freq}</span></td>
                    <td>
                      <div className="table-actions-cell">
                        <button className="btn-primary hover-glow" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => showToast('success', 'Download', 'Report downloading...')}>
                          <i className="fas fa-download"></i> PDF
                        </button>
                        <button className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--secondary-dark)', borderRadius: '8px' }} onClick={() => showToast('info', 'View', 'Opening Report in new tab...')}>
                          <i className="fas fa-eye"></i> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No custom reports generated</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalActive && (
        <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) setModalActive(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create Custom Report</h2>
              <button className="modal-close" onClick={() => setModalActive(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateReport}>
              <div className="form-group">
                <label className="form-label">Report Name *</label>
                <input type="text" className="form-control" name="reportName" required placeholder="e.g. Q1 Sales Performance" />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-control" name="frequency">
                  <option value="One-time">One-time</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" name="description" rows="3" placeholder="Describe the focus of this report..."></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalActive(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Generate Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
