import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Orders = ({ orders, setOrders, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderModalActive, setOrderModalActive] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [productList, setProductList] = useState([]);
  const [customerList, setCustomerList] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('name').order('name');
    if (!error) setCustomerList(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('name, price, stock').gt('stock', 0);
    if (!error) setProductList(data || []);
  };

  // Note: fetchOrders is now handled globally in App.jsx via the Sync button

  const filteredOrders = (orders || []).filter(order =>
    Object.values(order).some(val =>
      String(val).toLowerCase().includes(orderSearch.toLowerCase())
    )
  );

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
          quantity: orderData.quantity,
          status: orderData.status,
        })
        .eq('id', editingOrder.id)
        .select();

      if (error) {
        showToast('error', 'Update Failed', error.message);
      } else {
        const updatedOrders = orders.map(o => o.id === editingOrder.id ? data[0] : o);
        setOrders(updatedOrders);
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
          quantity: orderData.quantity || 1,
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
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        showToast('error', 'Delete Failed', error.message);
      } else {
        setOrders(orders.filter(o => o.id !== orderId));
        showToast('success', 'Order Deleted', `Order ${orderId} has been deleted.`);
      }
    }
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

      <div className="table-card" style={{ overflowX: 'auto' }}>
        <div className="table-header">
          <h3 className="table-title">Recent Orders</h3>
          <div className="table-actions">
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
              <i className="fas fa-plus"></i>
              New Order
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td style={{ fontWeight: '600' }}>{order.customer}</td>
                  <td>{order.phone || 'N/A'}</td>
                  <td>{order.product} {order.quantity > 1 ? `(x${order.quantity})` : ''}</td>
                  <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{order.amount}</td>
                  <td>{order.location}</td>
                  <td><span className={`table-status ${order.status}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{order.date}</td>
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
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {orderModalActive && (
        <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) { setOrderModalActive(false); setEditingOrder(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingOrder ? `Edit Order #${editingOrder.id}` : 'Create New Order'}</h2>
              <button className="modal-close" onClick={() => { setOrderModalActive(false); setEditingOrder(null); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Customer *</label>
                  <select className="form-control" name="customerName" defaultValue={editingOrder ? editingOrder.customer : ''} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} required>
                    <option value="" disabled>Choose a customer</option>
                    {customerList.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                    <option value="Guest">-- Walk-in / Guest --</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                  <input type="email" className="form-control" name="email" placeholder="customer@example.com" defaultValue={editingOrder ? editingOrder.email : ''} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                  <input type="tel" className="form-control" name="phone" placeholder="024 XXX XXXX" defaultValue={editingOrder ? editingOrder.phone : ''} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Status *</label>
                  <select className="form-control" name="status" defaultValue={editingOrder ? editingOrder.status : 'pending'} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} required>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Product *</label>
                  <select className="form-control" name="product" defaultValue={editingOrder ? editingOrder.product : ''} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} required>
                    <option value="" disabled>Select a product</option>
                    {productList.map(p => (
                      <option key={p.name} value={p.name}>{p.name} (₵{p.price.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Quantity</label>
                  <input type="number" min="1" className="form-control" name="quantity" defaultValue={editingOrder ? editingOrder.quantity : 1} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Region / City *</label>
                  <input type="text" className="form-control" name="location" placeholder="e.g. Tamale" defaultValue={editingOrder ? editingOrder.location : ''} required style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Detailed Address</label>
                  <input type="text" className="form-control" name="address" placeholder="Street name / Landmark" defaultValue={editingOrder ? editingOrder.address : ''} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={() => { setOrderModalActive(false); setEditingOrder(null); }} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.625rem 1.5rem', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>{editingOrder ? 'Save Changes' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Details Modal */}
      {viewingOrder && (
        <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) setViewingOrder(null); }}>
          <div className="modal-content" style={{ maxWidth: '600px', background: 'rgba(23, 23, 23, 0.95)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2rem' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="modal-title" style={{ fontSize: '1.5rem', fontWeight: '700' }}>Order Details #{viewingOrder.id}</h2>
              <button className="modal-close" onClick={() => setViewingOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="order-details-body" style={{ color: 'var(--text-primary)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Customer</label>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{viewingOrder.customer}</div>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Order Date</label>
                  <div>{viewingOrder.date}</div>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Email</label>
                  <div>{viewingOrder.email || 'None provided'}</div>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>Phone</label>
                  <div style={{ color: 'var(--accent)', fontWeight: '600' }}>{viewingOrder.phone || 'None provided'}</div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--accent)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Shipping & Fulfillment</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Product:</span>
                  <span style={{ fontWeight: '600' }}>{viewingOrder.product}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Quantity:</span>
                  <span>{viewingOrder.quantity || 1} unit(s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{viewingOrder.amount}</span>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Location</label>
                  <div style={{ fontWeight: '500' }}>{viewingOrder.location}</div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Full Address</label>
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginTop: '0.25rem', fontSize: '0.95rem', lineHeight: '1.5' }}>{viewingOrder.address || 'No detailed address provided.'}</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <span className={`table-status ${viewingOrder.status}`} style={{ padding: '0.6rem 2.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                  {viewingOrder.status.charAt(0).toUpperCase() + viewingOrder.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={() => setViewingOrder(null)} style={{ padding: '0.75rem 2rem', background: 'var(--accent)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
