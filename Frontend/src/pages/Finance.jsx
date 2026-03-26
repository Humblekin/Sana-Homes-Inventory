import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Finance = ({ showToast }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalActive, setModalActive] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('finance')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      showToast('error', 'Fetch Failed', error.message);
    } else {
      setTransactions(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  };

  const [stats, setStats] = useState({ profit: 0, expenses: 0, margin: 0 });

  const calculateStats = (txnList) => {
    let profit = 0;
    let expenses = 0;

    txnList.forEach(t => {
      // Clean string "- ₵1,200" or "₵5,000"
      const amountStr = String(t.amount).replace(/[₵,\s-]/g, '').trim();
      const amount = parseFloat(amountStr) || 0;
      
      if (t.isNegative || t.type === 'Withdrawal') {
        expenses += amount;
      } else {
        profit += amount;
      }
    });

    const net = profit - expenses;
    const margin = profit > 0 ? (net / profit) * 100 : 0;

    setStats({ profit, expenses, margin });
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    const formattedAmount = Number(data.amount).toLocaleString();
    
    const { data: newData, error } = await supabase
      .from('finance')
      .insert([{
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        ref: 'TRX-' + String(Math.floor(Math.random() * 90000) + 10000),
        desc: data.description,
        type: 'Withdrawal',
        amount: `- ₵${formattedAmount}`,
        status: 'Clearing',
        isNegative: true
      }])
      .select();

    if (error) {
      showToast('error', 'Recording Failed', error.message);
    } else {
      const updatedTxns = [newData[0], ...transactions];
      setTransactions(updatedTxns);
      calculateStats(updatedTxns);
      showToast('success', 'Expense Recorded', `Expense for ${data.description} added.`);
      setModalActive(false);
    }
  };

  return (
    <div id="financePage" className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title glow-text">Financial Records</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Finance</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-card hover-glow animate-stagger-1">
          <div className="stat-header">
            <div className="stat-icon success"><i className="fas fa-arrow-up"></i></div>
          </div>
          <div className="stat-value">₵{stats.profit.toLocaleString()}</div>
          <div className="stat-label">Total Gross Profit</div>
          <div className="stat-change positive">From all deposits</div>
        </div>
        <div className="stat-card glass-card hover-glow animate-stagger-2">
          <div className="stat-header">
            <div className="stat-icon danger"><i className="fas fa-arrow-down" style={{ color: 'var(--danger)' }}></i></div>
          </div>
          <div className="stat-value">₵{stats.expenses.toLocaleString()}</div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-change negative">From all withdrawals</div>
        </div>
        <div className="stat-card glass-card hover-glow animate-stagger-3">
          <div className="stat-header">
            <div className="stat-icon info"><i className="fas fa-percent"></i></div>
          </div>
          <div className="stat-value">{stats.margin.toFixed(1)}%</div>
          <div className="stat-label">Net Profit Margin</div>
          <div className="stat-change info">Calculated from total records</div>
        </div>
      </div>

      <div className="table-card glass-card hover-glow">
        <div className="table-header">
          <h3 className="table-title">Recent Transactions</h3>
          <div className="table-actions">
            <button className="btn-primary" style={{ background: 'var(--secondary-dark)' }} onClick={() => setModalActive(true)}>
              <i className="fas fa-file-invoice"></i> Add Expense
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
                  <th>Date</th>
                  <th>Reference ID</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="hover-glow">
                    <td style={{ opacity: 0.8 }}>{t.date}</td>
                    <td style={{ fontWeight: '600', fontSize: '0.85rem' }}>{t.ref}</td>
                    <td style={{ fontWeight: '500' }}>{t.desc}</td>
                    <td><span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t.type}</span></td>
                    <td style={{ color: t.isNegative ? 'var(--danger)' : 'var(--success)', fontWeight: '700' }}>{t.amount}</td>
                    <td><span className={`table-status ${t.status === 'Settled' ? 'completed' : 'pending'}`}>{t.status}</span></td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No recent transactions</td>
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
              <h2 className="modal-title">Record New Expense</h2>
              <button className="modal-close" onClick={() => setModalActive(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Expense Description *</label>
                <input type="text" className="form-control" name="description" placeholder="e.g. Server Hosting" required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₵) *</label>
                <input type="number" className="form-control" name="amount" min="1" step="0.01" required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalActive(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--danger)' }}>Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
