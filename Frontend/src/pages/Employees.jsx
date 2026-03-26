import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Employees = ({ showToast }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalActive, setModalActive] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('started', { ascending: false });
    
    if (error) {
      showToast('error', 'Fetch Failed', error.message);
    } else {
      setEmployees(data || []);
    }
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingEmployee(null);
    setModalActive(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setModalActive(true);
  };

  const handleCreateOrUpdateEmployee = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    if (editingEmployee) {
      const { data: updatedData, error } = await supabase
        .from('employees')
        .update({
          name: data.name,
          role: data.role,
          department: data.department,
          status: data.status
        })
        .eq('id', editingEmployee.id)
        .select();

      if (error) {
        showToast('error', 'Update Failed', error.message);
      } else {
        setEmployees(employees.map(emp => emp.id === editingEmployee.id ? updatedData[0] : emp));
        showToast('success', 'Employee Updated', `${data.name}'s profile has been updated.`);
        setModalActive(false);
        setEditingEmployee(null);
      }
    } else {
      const { data: newData, error } = await supabase
        .from('employees')
        .insert([{
          name: data.name,
          role: data.role,
          department: data.department,
          started: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: 'Active'
        }])
        .select();

      if (error) {
        showToast('error', 'Registration Failed', error.message);
      } else {
        setEmployees([newData[0], ...employees]);
        showToast('success', 'Employee Added', `${data.name} is now part of the team.`);
        setModalActive(false);
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Remove ${name} from the employee directory?`)) {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        showToast('error', 'Delete Failed', error.message);
      } else {
        setEmployees(employees.filter(e => e.id !== id));
        showToast('success', 'Deleted', `${name} has been removed.`);
      }
    }
  };

  return (
    <div id="employeesPage" className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title glow-text">Employees Management</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Employees</span>
        </div>
      </div>

      <div className="table-card glass-card hover-glow">
        <div className="table-header">
          <h3 className="table-title">Our Staff</h3>
          <div className="table-actions">
            <button className="btn-primary" onClick={openCreateModal}>
              <i className="fas fa-plus"></i> New Employee
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
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Term Started</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} className="hover-glow">
                    <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>#{String(e.id).substring(0, 8)}</td>
                    <td style={{ fontWeight: '700' }}>{e.name}</td>
                    <td>{e.role}</td>
                    <td><span style={{ opacity: 0.8 }}>{e.department}</span></td>
                    <td>{e.started}</td>
                    <td><span className={`table-status ${e.status === 'Active' ? 'completed' : 'pending'}`}>{e.status}</span></td>
                    <td>
                      <div className="table-actions-cell">
                        <button className="action-btn edit tooltip" data-tooltip="Edit" onClick={() => openEditModal(e)}><i className="fas fa-edit"></i></button>
                        <button className="action-btn delete tooltip" data-tooltip="Delete" onClick={() => handleDelete(e.id, e.name)}><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No staff enrolled</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalActive && (
        <div className="modal active" onClick={(e) => { if (e.target.className.includes('modal active')) { setModalActive(false); setEditingEmployee(null); } }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingEmployee ? `Edit ${editingEmployee.name}` : 'Register New Employee'}</h2>
              <button className="modal-close" onClick={() => { setModalActive(false); setEditingEmployee(null); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdateEmployee}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-control" name="name" defaultValue={editingEmployee ? editingEmployee.name : ''} required placeholder="e.g. Kofi Annan" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <input type="text" className="form-control" name="role" defaultValue={editingEmployee ? editingEmployee.role : ''} required placeholder="e.g. Senior Driver" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-control" name="department" defaultValue={editingEmployee ? editingEmployee.department : ''} required>
                    <option value="" disabled>Select a Dept</option>
                    <option value="Sales">Sales</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Management">Management</option>
                    <option value="Support">Support</option>
                  </select>
                </div>
              </div>
              
              {editingEmployee && (
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="form-control" name="status" defaultValue={editingEmployee.status} required>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setModalActive(false); setEditingEmployee(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingEmployee ? 'Update Record' : 'Register Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
