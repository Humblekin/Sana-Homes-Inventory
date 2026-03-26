import React, { useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Header = ({ 
  mobileMenuActive, 
  setMobileMenuActive, 
  globalSearch, 
  setGlobalSearch, 
  showToast, 
  darkMode, 
  toggleDarkMode, 
  userDropdownActive, 
  setUserDropdownActive,
  setIsAuthenticated,
  onRefresh,
  refreshing
}) => {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-profile') && !e.target.closest('.dropdown-menu')) {
        setUserDropdownActive(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setUserDropdownActive]);

  return (
    <header className="header">
      <button className="mobile-menu-toggle" onClick={() => setMobileMenuActive(!mobileMenuActive)}>
        <i className={`fas ${mobileMenuActive ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input 
          type="text" 
          id="globalSearch" 
          placeholder="Search orders, customers, products..." 
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        <button 
          className={`header-btn ${refreshing ? 'fa-spin' : ''}`} 
          style={{ marginLeft: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
          onClick={onRefresh}
          title="Refresh Data"
        >
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      <div className="header-actions">
        <button className="header-btn tooltip" data-tooltip="Notifications" onClick={() => showToast('info', 'Notifications', 'You have 3 new notifications')}>
          <i className="fas fa-bell"></i>
          <span className="notification-badge"></span>
        </button>

        <button className="header-btn tooltip" data-tooltip="Messages" onClick={() => showToast('info', 'Messages', 'You have no new messages')}>
          <i className="fas fa-envelope"></i>
        </button>

        <button className="header-btn tooltip" data-tooltip="Dark Mode" onClick={toggleDarkMode}>
          <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'}`}></i>
        </button>

        <div className={`dropdown ${userDropdownActive ? 'active' : ''}`}>
          <div className="user-profile" onClick={(e) => { e.stopPropagation(); setUserDropdownActive(!userDropdownActive); }}>
            <div className="user-avatar">JD</div>
            <div className="user-info">
              <span className="user-name">John Doe</span>
              <span className="user-role">Administrator</span>
            </div>
            <i className="fas fa-chevron-down" style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}></i>
          </div>
          <div className="dropdown-menu">
            <a href="#" className="dropdown-item"><i className="fas fa-user"></i><span>Profile</span></a>
            <a href="#" className="dropdown-item"><i className="fas fa-cog"></i><span>Settings</span></a>
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-item" onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); setIsAuthenticated(false); }}><i className="fas fa-sign-out-alt"></i><span>Logout</span></a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
