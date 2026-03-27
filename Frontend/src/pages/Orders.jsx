import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const STATUS_OPTIONS = ['pending', 'processing', 'completed', 'cancelled'];

const statusColors = {
  pending: { bg: 'rgba(255,152,0,0.15)', color: '#ff9800', icon: 'fa-clock' },
  processing: { bg: 'rgba(33,150,243,0.15)', color: '#2196f3', icon: 'fa-sync-alt' },
  completed: { bg: 'rgba(76,175,80,0.15)', color: '#4caf50', icon: 'fa-check-circle' },
  cancelled: { bg: 'rgba(244,67,54,0.15)', color: '#f44336', icon: 'fa-times-circle' },
};

const Orders = ({ orders, setOrders, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderModalActive, setOrderModalActive] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [productList, setProductList] = useState([]);       // in-stock only (new orders)
  const [allProductList, setAllProductList] = useState([]);  // all products (edit mode)
  const [customerList, setCustomerList] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('name').order('name');
    if (!error) setCustomerList(data || []);
  };

  const fetchProducts = async () => {
    // In-stock only — for new order creation
    const { data: inStock } = await supabase.from('products').select('name, price, stock').gt('stock', 0);
    if (inStock) setProductList(inStock);
    // All products — so editing an order shows the current product even if out of stock
    const { data: all } = await supabase.from('products').select('name, price, stock').order('name');
    if (all) setAllProductList(all);
  };

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = Object.values(order).some(val =>
      String(val).toLowerCase().includes(orderSearch.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Quick status update directly from the table row
  const quickUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatus(orderId);
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      showToast('error', 'Update Failed', error.message);
    } else {
      setOrders(orders.map(o => o.id === orderId ? data : o));
      // If viewing that order, update viewingOrder too
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder(data);
      }
      showToast('success', 'Status Updated', `Order #${orderId} marked as ${newStatus}.`);
    }
    setUpdatingStatus(null);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setOrderModalActive(true);
  };

  const openCreateModal = () => {
    setEditingOrder(null);
    setOrderModalActive(true);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const orderData = Object.fromEntries(formData.entries());

    if (editingOrder) {
      const { data, error } = await supabase
        .from('orders')
        .update({
          customer: orderData.customerName,
          email: orderData.email,
          phone: orderData.phone,
          address: orderData.address,
          location: orderData.location,
          product: orderData.product,
          quantity: parseInt(orderData.quantity) || 1,
          status: orderData.status,
        })
        .eq('id', editingOrder.id)
        .select();

      if (error) {
        showToast('error', 'Update Failed', error.message);
      } else {
        setOrders(orders.map(o => o.id === editingOrder.id ? data[0] : o));
        showToast('success', 'Order Updated', `Order #${editingOrder.id} successfully updated.`);
        setOrderModalActive(false);
        setEditingOrder(null);
      }
    } else {
      const selectedProduct = productList.find(p => p.name === orderData.product);
      const amountNum = selectedProduct ? selectedProduct.price : 0;
      const amountStr = `₵${amountNum.toLocaleString()}`;

      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer: orderData.customerName || 'Guest',
          email: orderData.email || '',
          phone: orderData.phone || '',
          address: orderData.address || '',
          location: orderData.location || 'N/A',
          product: orderData.product || 'N/A',
          quantity: parseInt(orderData.quantity) || 1,
          amount: amountStr,
          status: orderData.status || 'pending',
          date: new Date().toISOString().split('T')[0]
        }])
        .select();

      if (error) {
        showToast('error', 'Creation Failed', error.message);
      } else {
        setOrders([data[0], ...orders]);
        showToast('success', 'Order Placed', `Order #${data[0].id} recorded.`);
        setOrderModalActive(false);
      }
    }
  };

  const deleteOrder = async (orderId) => {
    if (window.confirm(`Are you sure you want to delete order ${orderId}?`)) {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) {
        showToast('error', 'Delete Failed', error.message);
      } else {
        setOrders(orders.filter(o => o.id !== orderId));
        showToast('success', 'Order Deleted', `Order ${orderId} has been deleted.`);
      }
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px', color: 'var(--text-primary)',
    fontSize: '0.9rem', boxSizing: 'border-box'
  };

  return (
    <div id="ordersPage">
      <div className="page-header">
        <h1 className="page-title">Manage Orders</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Orders</span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3 className="table-title">Orders
            <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: '400', color: 'var(--text-secondary)' }}>
              ({filteredOrders.length} record{filteredOrders.length !== 1 ? 's' : ''})
            </span>
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status filter tabs */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['all', ...STATUS_OPTIONS].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: '600',
                    borderRadius: '20px', border: 'none', cursor: 'pointer',
                    background: statusFilter === s
                      ? (s === 'all' ? 'var(--accent)' : statusColors[s]?.color)
                      : 'rgba(255,255,255,0.06)',
                    color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="table-search">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={openCreateModal}>
              <i className="fas fa-plus"></i> New Order
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th style={{ width: '100px' }}>Qty</th>
                  <th style={{ width: '110px' }}>Amount</th>
                  <th>Location</th>
                  <th style={{ width: '160px' }}>Status</th>
                  <th style={{ width: '100px', whiteSpace: 'nowrap' }}>Date</th>
                  <th style={{ width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const sc = statusColors[order.status] || statusColors.pending;
                  return (
                    <tr key={order.id}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>#{order.id}</td>
                      <td>
                        <div style={{ fontWeight: '600', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{order.phone || '—'}</div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>{order.product}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{order.quantity || 1}</td>
                      <td style={{ fontWeight: '700', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{order.amount}</td>
                      <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{order.location}</td>
                      <td>
                        {/* Quick status dropdown */}
                        <select
                          value={order.status || 'pending'}
                          disabled={updatingStatus === order.id}
                          onChange={(e) => quickUpdateStatus(order.id, e.target.value)}
                          style={{
                            background: sc.bg, color: sc.color,
                            border: `1px solid ${sc.color}40`,
                            borderRadius: '20px', padding: '0.25rem 0.6rem',
                            fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
                            width: '100%', outline: 'none'
                          }}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} style={{ background: '#1a1a1a', color: '#fff' }}>
                              {updatingStatus === order.id && s === (order.status || 'pending') ? 'Saving...' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{order.date}</td>
                      <td>
                        <div className="table-actions-cell">
                          <button className="action-btn view tooltip" data-tooltip="View Details" onClick={() => setViewingOrder(order)}>
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="action-btn edit tooltip" data-tooltip="Edit" onClick={() => openEditModal(order)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="action-btn delete tooltip" data-tooltip="Delete" onClick={() => deleteOrder(order.id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      <i className="fas fa-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}></i>
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Order Modal */}
      {orderModalActive && (
        <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) { setOrderModalActive(false); setEditingOrder(null); } }}>
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingOrder ? `Edit Order #${editingOrder.id}` : 'Create New Order'}</h2>
              <button className="modal-close" onClick={() => { setOrderModalActive(false); setEditingOrder(null); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <select className="form-control" name="customerName" defaultValue={editingOrder ? editingOrder.customer : ''} required>
                    <option value="" disabled>Choose a customer</option>
                    {customerList.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Guest">-- Walk-in / Guest --</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="form-control" name="status" defaultValue={editingOrder ? editingOrder.status : 'pending'} required>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-control" name="phone" placeholder="024 XXX XXXX" defaultValue={editingOrder ? editingOrder.phone : ''} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" placeholder="customer@example.com" defaultValue={editingOrder ? editingOrder.email : ''} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Product *</label>
                  <select className="form-control" name="product" defaultValue={editingOrder ? editingOrder.product : ''} required>
                    <option value="" disabled>Select a product</option>
                    {(editingOrder ? allProductList : productList).map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name} (₵{p.price.toLocaleString()}){p.stock === 0 ? ' — Out of Stock' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input type="number" min="1" className="form-control" name="quantity" defaultValue={editingOrder ? editingOrder.quantity : 1} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Region / City *</label>
                  <input type="text" className="form-control" name="location" placeholder="e.g. Tamale" defaultValue={editingOrder ? editingOrder.location : ''} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Detailed Address</label>
                  <input type="text" className="form-control" name="address" placeholder="Street / Landmark" defaultValue={editingOrder ? editingOrder.address : ''} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => { setOrderModalActive(false); setEditingOrder(null); }}
                  style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingOrder ? 'Save Changes' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingOrder && (() => {
        const sc = statusColors[viewingOrder.status] || statusColors.pending;
        return (
          <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) setViewingOrder(null); }}>
            <div className="modal-content" style={{ maxWidth: '580px', borderRadius: '20px' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>Order #{viewingOrder.id}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{
                      background: sc.bg, color: sc.color,
                      padding: '0.2rem 0.85rem', borderRadius: '20px',
                      fontSize: '0.82rem', fontWeight: '700',
                      border: `1px solid ${sc.color}40`
                    }}>
                      <i className={`fas ${sc.icon}`} style={{ marginRight: '0.35rem' }}></i>
                      {viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{viewingOrder.date}</span>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setViewingOrder(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Customer Info */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                  <i className="fas fa-user" style={{ marginRight: '0.5rem' }}></i>Customer Info
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Name</div>
                    <div style={{ fontWeight: '600' }}>{viewingOrder.customer}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Phone</div>
                    <div style={{ fontWeight: '600', color: 'var(--accent)' }}>{viewingOrder.phone || '—'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Email</div>
                    <div>{viewingOrder.email || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                  <i className="fas fa-shopping-cart" style={{ marginRight: '0.5rem' }}></i>Order Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Product</div>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>{viewingOrder.product}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Quantity</div>
                    <div style={{ fontWeight: '600' }}>{viewingOrder.quantity || 1} unit(s)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Total Amount</div>
                    <div style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '1.1rem' }}>{viewingOrder.amount}</div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0' }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: '0.5rem' }}></i>Delivery Location
                </h4>
                <div style={{ fontWeight: '600', marginBottom: '0.4rem' }}>{viewingOrder.location}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {viewingOrder.address || 'No detailed address provided.'}
                </div>
              </div>

              {/* Quick status update from details */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map(s => {
                  const c = statusColors[s];
                  const isActive = viewingOrder.status === s;
                  return (
                    <button
                      key={s}
                      disabled={isActive || updatingStatus === viewingOrder.id}
                      onClick={() => quickUpdateStatus(viewingOrder.id, s)}
                      style={{
                        flex: 1, padding: '0.45rem 0.5rem', fontSize: '0.8rem', fontWeight: '600',
                        borderRadius: '8px', border: `1px solid ${isActive ? c.color : 'rgba(255,255,255,0.1)'}`,
                        background: isActive ? c.bg : 'transparent',
                        color: isActive ? c.color : 'var(--text-secondary)',
                        cursor: isActive ? 'default' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <i className={`fas ${c.icon}`} style={{ marginRight: '0.3rem' }}></i>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setViewingOrder(null); openEditModal(viewingOrder); }}
                  style={{ padding: '0.625rem 1.25rem', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
                >
                  <i className="fas fa-edit" style={{ marginRight: '0.4rem' }}></i>Edit
                </button>
                <button className="btn-primary" onClick={() => setViewingOrder(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Orders;
