import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Products = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productModalActive, setProductModalActive] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });
    
    if (error) {
      showToast('error', 'Fetch Failed', error.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductModalActive(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductModalActive(true);
  };

  const handleCreateOrUpdateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    if (editingProduct) {
      const { data: updatedData, error } = await supabase
        .from('products')
        .update({
          name: data.name,
          category: data.category,
          price: data.price,
          stock: data.stock,
          status: parseInt(data.stock) > 5 ? 'instock' : 'lowstock',
          description: data.description
        })
        .eq('id', editingProduct.id)
        .select();

      if (error) {
        showToast('error', 'Update Failed', error.message);
      } else {
        setProducts(products.map(p => p.id === editingProduct.id ? updatedData[0] : p));
        showToast('success', 'Product Updated', `${data.name} has been updated.`);
        setProductModalActive(false);
        setEditingProduct(null);
      }
    } else {
      const { data: newData, error } = await supabase
        .from('products')
        .insert([{
          name: data.name,
          category: data.category,
          price: data.price,
          stock: data.stock || 0,
          sales: 0,
          status: parseInt(data.stock) > 5 ? 'instock' : 'lowstock',
          description: data.description
        }])
        .select();

      if (error) {
        showToast('error', 'Creation Failed', error.message);
      } else {
        setProducts([newData[0], ...products]);
        showToast('success', 'Product Added', `${data.name} is now available.`);
        setProductModalActive(false);
      }
    }
  };

  const deleteProduct = async (productId, name) => {
    if (window.confirm(`Permanently remove ${name} from catalog?`)) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        showToast('error', 'Delete Failed', error.message);
      } else {
        setProducts(products.filter(p => p.id !== productId));
        showToast('success', 'Product Removed', `${name} has been deleted.`);
      }
    }
  };

  return (
    <div id="productsPage" className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title glow-text">Products Catalog</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Products</span>
        </div>
      </div>

      <div className="table-card glass-card hover-glow">
        <div className="table-header">
          <h3 className="table-title">Our Vehicles</h3>
          <div className="table-actions">
            <div className="table-search">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search products..." 
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={openCreateModal}>
              <i className="fas fa-plus"></i>
              Add Product
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
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Inventory</th>
                  <th>Sales</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover-glow">
                    <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>#{p.id}</td>
                    <td style={{ fontWeight: '700' }}>{p.name}</td>
                    <td><span style={{ opacity: 0.8 }}>{p.category}</span></td>
                    <td style={{ fontWeight: '700', color: 'var(--accent)' }}>₵{p.price.toLocaleString()}</td>
                    <td style={{ fontWeight: '600' }}>
                      <span style={{ color: p.stock < 5 ? 'var(--danger)' : 'inherit' }}>
                        {p.stock || 0} units
                      </span>
                    </td>
                    <td>{p.sales || 0}</td>
                    <td><span className={`table-status ${p.stock > 5 ? 'completed' : 'pending'}`}>{p.stock > 5 ? 'In Stock' : 'Low Stock'}</span></td>
                    <td>
                      <div className="table-actions-cell">
                        <button className="action-btn edit tooltip" data-tooltip="Edit" onClick={() => openEditModal(p)}><i className="fas fa-edit"></i></button>
                        <button className="action-btn delete tooltip" data-tooltip="Delete" onClick={() => deleteProduct(p.id, p.name)}><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No products found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {productModalActive && (
        <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) { setProductModalActive(false); setEditingProduct(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? `Edit Product` : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => { setProductModalActive(false); setEditingProduct(null); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input type="text" className="form-control" name="name" defaultValue={editingProduct ? editingProduct.name : ''} required placeholder="e.g. Sana Cruiser X" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" name="category" defaultValue={editingProduct ? editingProduct.category : ''} required>
                    <option value="" disabled>Select a Category</option>
                    <option value="Cargo">Cargo</option>
                    <option value="Passenger">Passenger</option>
                    <option value="Electric">Electric</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₵) *</label>
                  <input type="number" className="form-control" name="price" defaultValue={editingProduct ? editingProduct.price : ''} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Count *</label>
                  <input type="number" className="form-control" name="stock" defaultValue={editingProduct ? editingProduct.stock : 0} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" name="description" rows="3" defaultValue={editingProduct ? editingProduct.description : ''}></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setProductModalActive(false); setEditingProduct(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingProduct ? 'Update Product' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
