import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Customers = ({ showToast }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [modalActive, setModalActive] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'joined', direction: 'desc' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*');

    if (error) {
      showToast('error', 'Fetch Failed', error.message);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = React.useMemo(() => {
    let sortableItems = [...customers];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Custom handling for 'spent' string (e.g., "₵1,200")
        if (sortConfig.key === 'spent') {
          aVal = parseFloat(String(aVal).replace(/[₵,]/g, '')) || 0;
          bVal = parseFloat(String(bVal).replace(/[₵,]/g, '')) || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [customers, sortConfig]);

  const filteredCustomers = sortedCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.id.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const isNewCustomer = (dateStr) => {
    const joined = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - joined);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleCreateOrUpdateCustomer = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!validateEmail(data.email)) {
      showToast('error', 'Invalid Email', 'Please provide a valid email address.');
      return;
    }

    if (editingCustomer) {
      const { data: updatedData, error } = await supabase
        .from('customers')
        .update({
          name: data.name,
          email: data.email
        })
        .eq('id', editingCustomer.id)
        .select();

      if (error) {
        showToast('error', 'Update Failed', error.message);
      } else {
        setCustomers(customers.map(c => c.id === editingCustomer.id ? updatedData[0] : c));
        showToast('success', 'Profile Updated', `${data.name}'s details saved.`);
        setModalActive(false);
        setEditingCustomer(null);
      }
    } else {
      const { data: newData, error } = await supabase
        .from('customers')
        .insert([{
          name: data.name,
          email: data.email,
          orders: 0,
          spent: '₵0',
          joined: new Date().toISOString().split('T')[0]
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          showToast('error', 'Registration Failed', 'This email is already registered.');
        } else {
          showToast('error', 'Registration Failed', error.message);
        }
      } else {
        setCustomers([newData[0], ...customers]);
        showToast('success', 'Customer Added', `${data.name} is now in the directory.`);
        setModalActive(false);
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Permanently remove ${name}? History will be kept for accounting.`)) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        showToast('error', 'Delete Failed', error.message);
      } else {
        setCustomers(customers.filter(c => c.id !== id));
        showToast('success', 'Deleted', 'Customer removed successfully.');
      }
    }
  };

  const openCreateModal = () => { setEditingCustomer(null); setModalActive(true); };
  const openEditModal = (customer) => { setEditingCustomer(customer); setModalActive(true); };

  return (
    <div id="customersPage">
      <div className="page-header">
        <h1 className="page-title">Customers Directory</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Customers</span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3 className="table-title">Registered Contacts</h3>
          <div className="table-actions">
            <div className="table-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by name, email, or id..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={openCreateModal}>
              <i className="fas fa-user-plus"></i>
              New Customer
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}></i>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>ID <i className={`fas fa-sort-${sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? 'up' : 'down') : 'down'}`} style={{ fontSize: '0.7rem', opacity: sortConfig.key === 'id' ? 1 : 0.3 }}></i></th>
                <th style={{ minWidth: '200px' }}>Details</th>
                <th onClick={() => handleSort('orders')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Orders <i className={`fas fa-sort-${sortConfig.key === 'orders' ? (sortConfig.direction === 'asc' ? 'up' : 'down') : 'down'}`} style={{ fontSize: '0.7rem', opacity: sortConfig.key === 'orders' ? 1 : 0.3 }}></i></th>
                <th onClick={() => handleSort('spent')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>LTV <i className={`fas fa-sort-${sortConfig.key === 'spent' ? (sortConfig.direction === 'asc' ? 'up' : 'down') : 'down'}`} style={{ fontSize: '0.7rem', opacity: sortConfig.key === 'spent' ? 1 : 0.3 }}></i></th>
                <th onClick={() => handleSort('joined')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>Joined <i className={`fas fa-sort-${sortConfig.key === 'joined' ? (sortConfig.direction === 'asc' ? 'up' : 'down') : 'down'}`} style={{ fontSize: '0.7rem', opacity: sortConfig.key === 'joined' ? 1 : 0.3 }}></i></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontSize: '0.8rem', opacity: 0.6, whiteSpace: 'nowrap' }}>#{c.id.substring(0, 8)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.name} {isNewCustomer(c.joined) && <span className="table-status completed" style={{ fontSize: '0.65rem', padding: '1px 6px', marginLeft: '5px' }}>NEW</span>}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.email}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{c.orders} sales</td>
                  <td style={{ fontWeight: '600', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{c.spent}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.joined}</td>
                  <td>
                    <div className="table-actions-cell">
                      <button className="action-btn edit tooltip" data-tooltip="Place Order" onClick={() => showToast('info', 'Redirecting', 'Linking to Orders page...')}><i className="fas fa-shopping-bag"></i></button>
                      <button className="action-btn edit tooltip" data-tooltip="Edit" onClick={() => openEditModal(c)}><i className="fas fa-edit"></i></button>
                      <button className="action-btn delete tooltip" data-tooltip="Delete" onClick={() => handleDelete(c.id, c.name)}><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No matches found in directory.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalActive && (
        <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) { setModalActive(false); setEditingCustomer(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingCustomer ? `Edit Profile` : 'Register New Customer'}</h2>
              <button className="modal-close" onClick={() => { setModalActive(false); setEditingCustomer(null); }}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleCreateOrUpdateCustomer}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
                <input type="text" className="form-control" name="name" defaultValue={editingCustomer ? editingCustomer.name : ''} required placeholder="e.g. Ama Serwaa" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address *</label>
                <input type="email" className="form-control" name="email" defaultValue={editingCustomer ? editingCustomer.email : ''} required placeholder="client@example.com" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => { setModalActive(false); setEditingCustomer(null); }} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingCustomer ? 'Save Changes' : 'Create Profile'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
