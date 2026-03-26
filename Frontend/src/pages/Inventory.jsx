import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Inventory = ({ showToast }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventorySearch, setInventorySearch] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      showToast('error', 'Fetch Failed', error.message);
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  };

  const handleMasterSync = async () => {
    setLoading(true);
    showToast('info', 'Master Syncing...', 'Aligning Stock with Products catalog.');
    
    // Call the database function to copy missing products to inventory
    const { error } = await supabase.rpc('master_sync_inventory');
    
    if (error) {
      showToast('error', 'Sync Failed', error.message);
    } else {
      await fetchInventory(); // Refresh view
      showToast('success', 'Perfect Sync', 'Inventory is now 100% aligned with Sales.');
    }
    setLoading(false);
  };

  const filteredInventory = inventory.filter(item => 
    item.product.toLowerCase().includes(inventorySearch.toLowerCase()) || 
    item.sku.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const adjustStock = async (id, currentStock, productName) => {
    const amount = window.prompt(`Adjust stock for ${productName}. Current: ${currentStock}. Enter new total stock:`);
    if (amount !== null && !isNaN(amount)) {
      const newStock = parseInt(amount);
      const status = newStock < 10 ? 'low' : 'instock';
      
      const { data, error } = await supabase
        .from('inventory')
        .update({ stock: newStock, status: status })
        .eq('id', id)
        .select();

      if (error) {
        showToast('error', 'Adjustment Failed', error.message);
      } else {
        setInventory(inventory.map(item => item.id === id ? data[0] : item));
        showToast('success', 'Stock Adjusted', `${productName} stock is now ${newStock}.`);
      }
    }
  };

  return (
    <div id="inventoryPage" className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title glow-text">Inventory Management</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Inventory</span>
        </div>
      </div>

      <div className="table-card glass-card hover-glow">
        <div className="table-header">
          <h3 className="table-title">Stock Levels</h3>
          <div className="table-actions">
            <div className="table-search">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search inventory..." 
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
              />
            </div>
            <button className="btn-primary" style={{ background: 'var(--secondary-dark)' }} onClick={handleMasterSync}>
              <i className="fas fa-sync"></i>
              Sync Stock
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
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>In Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => (
                  <tr key={item.id} className="hover-glow">
                    <td style={{ fontWeight: '700', fontSize: '0.85rem' }}>{item.sku}</td>
                    <td style={{ fontWeight: '500' }}>{item.product}</td>
                    <td style={{ opacity: 0.8 }}>{item.category}</td>
                    <td style={{ fontWeight: '700', color: item.status === 'low' ? 'var(--danger)' : 'inherit' }}>{item.stock}</td>
                    <td>
                      <span className={`table-status ${item.status === 'low' ? 'pending' : 'completed'}`}>
                        {item.status === 'low' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-primary hover-glow" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }} onClick={() => adjustStock(item.id, item.stock, item.product)}>
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No inventory items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
