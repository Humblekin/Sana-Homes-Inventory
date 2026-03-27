import React from 'react';

const Sidebar = ({ sidebarCollapsed, setSidebarCollapsed, mobileMenuActive, activePage, handleNavClick, isAdmin, orderCount }) => {
  const adminOnlyItems = ['finance', 'employees'];
  
  const menuItems = [
    { id: 'dashboard', icon: 'fa-home', text: 'Dashboard' },
    { id: 'orders', icon: 'fa-shopping-cart', text: 'Orders', badge: orderCount > 0 ? orderCount.toString() : null },
    { id: 'products', icon: 'fa-box', text: 'Products' },
    { id: 'customers', icon: 'fa-users', text: 'Customers' },
    { id: 'inventory', icon: 'fa-warehouse', text: 'Inventory' },
    { id: 'reports', icon: 'fa-chart-line', text: 'Reports' },
    { id: 'finance', icon: 'fa-wallet', text: 'Finance' },
    { id: 'employees', icon: 'fa-user-tie', text: 'Employees' },
    { id: 'settings', icon: 'fa-cog', text: 'Settings' }
  ].filter(item => isAdmin || !adminOnlyItems.includes(item.id));

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuActive ? 'active' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <a href="#" className="logo">
          <img src="/Images/sana_logo.png" alt="Sana Logo" style={{ height: '32px', width: 'auto' }} />
          <span className="logo-text">Sana Admin</span>
        </a>
        <button className="toggle-sidebar" id="toggleSidebar" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <i className={`fas ${sidebarCollapsed ? 'fa-align-right' : 'fa-align-left'}`}></i>
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(item => (
          <div className="menu-item" key={item.id}>
            <a 
              href={`#${item.id}`} 
              className={`menu-link ${activePage === item.id ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNavClick(item.id); }}
            >
              <i className={`fas ${item.icon} menu-icon`}></i>
              <span className="menu-text">{item.text}</span>
              {item.badge && <span className="menu-badge">{item.badge}</span>}
            </a>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
