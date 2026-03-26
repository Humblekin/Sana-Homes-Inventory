import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Finance from './pages/Finance';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import Landing from './pages/Landing';
import { supabase } from './supabaseClient';
import './index.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login, forgot-password, verify-email
  const [userRole, setUserRole] = useState('user'); // admin or user
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuActive, setMobileMenuActive] = useState(false);
  const [userDropdownActive, setUserDropdownActive] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);

  const [chartPeriod, setChartPeriod] = useState('week');
  const [globalSearch, setGlobalSearch] = useState('');

  const [toast, setToast] = useState({ show: false, type: 'success', title: '', message: '' });
  const [showAdmin, setShowAdmin] = useState(false);

  const chartRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) fetchUserRole(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase.from('user_roles').select('role').eq('id', userId).single();
    if (data && !error) setUserRole(data.role);
  };

  const notifyAdmin = async (message) => {
    // Securely trigger Edge Function for SMS/Email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to: 'admin@trilux.com', subject: 'Admin Alert', html: `<p>${message}</p>` },
    });
    return { data, error };
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated]);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOrders(),
      fetchCustomerCount(),
      fetchProductCount()
    ]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from('orders').select('*').order('date', { ascending: false });
    if (error) {
      console.error('App: Fetch Orders Error:', error);
      showToast('error', 'Fetch Error', error.message);
    } else {
      console.log('App: Fetched', data?.length || 0, 'orders.');
      if (data) {
        setOrders(data);
        calculateRevenue(data);
      }
    }
  };

  const calculateRevenue = (orderList) => {
    const total = orderList.reduce((sum, order) => {
      // Clean string "₵12,500" -> 12500
      const amountStr = String(order.amount).replace(/[₵,]/g, '').trim();
      const amount = parseFloat(amountStr) || 0;
      return sum + amount;
    }, 0);
    setTotalRevenue(total);
  };

  const fetchCustomerCount = async () => {
    const { count, error } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    if (!error) setCustomerCount(count || 0);
  };

  const fetchProductCount = async () => {
    const { data, error } = await supabase.from('products').select('stock');
    if (!error && data) {
      const totalStock = data.reduce((sum, p) => sum + (p.stock || 0), 0);
      setProductCount(totalStock);
    }
  };

  const showToast = (type, title, message) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.body.style.background = '#f5f5f5';
      document.body.style.color = '#333';
      showToast('info', 'Theme', 'Light mode coming soon!');
    } else {
      document.body.style.background = '';
      document.body.style.color = '';
      showToast('info', 'Theme', 'Dark mode restored');
    }
    setDarkMode(!darkMode);
  };

  const getLineChartData = () => {
    let labels = [];
    let data = [];

    // Simple grouping logic for orders based on 'date' (YYYY-MM-DD)
    const ordersByDate = {};
    orders.forEach(order => {
      const date = order.date;
      const amountStr = String(order.amount).replace(/[₵,]/g, '').trim();
      const amount = parseFloat(amountStr) || 0;
      ordersByDate[date] = (ordersByDate[date] || 0) + amount;
    });

    if (chartPeriod === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(dayLabel);
        data.push(ordersByDate[dateStr] || 0);
      }
    } else if (chartPeriod === 'month') {
      // Last 4 weeks (simplified)
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      // This is a placeholder for more complex distribution, 
      // but let's at least show real totals distributed
      const total = orders.reduce((sum, o) => sum + (parseFloat(String(o.amount).replace(/[₵,]/g, '')) || 0), 0);
      data = [total * 0.2, total * 0.3, total * 0.25, total * 0.25];
    } else {
      // Year view (Months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      labels = months;
      const monthlyTotals = new Array(12).fill(0);
      orders.forEach(order => {
        const m = new Date(order.date).getMonth();
        const amount = parseFloat(String(order.amount).replace(/[₵,]/g, '')) || 0;
        monthlyTotals[m] += amount;
      });
      data = monthlyTotals;
    }

    // Default if no data
    if (data.every(v => v === 0)) {
        data = [0, 0, 0, 0, 0, 0, 0];
        if (chartPeriod === 'year') data = new Array(12).fill(0);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Sales (₵)',
          data: data,
          borderColor: '#ff6b35',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff6b35',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#252525',
        titleColor: '#fff',
        bodyColor: '#b0b0b0',
        borderColor: '#ff6b35',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return '₵' + context.parsed.y.toLocaleString();
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: { color: '#b0b0b0', font: { size: 12 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: {
          color: '#b0b0b0',
          font: { size: 12 },
          callback: function (value) { return '₵' + (value / 1000) + 'k'; }
        },
        beginAtZero: true
      }
    },
    layout: { padding: { top: 10, right: 20, bottom: 10, left: 10 } }
  };

  const getDoughnutChartData = () => {
    const counts = {};
    orders.forEach(o => {
      counts[o.product] = (counts[o.product] || 0) + (o.quantity || 1);
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (labels.length === 0) {
      return {
        labels: ['No Sales Yet'],
        datasets: [{
          data: [1],
          backgroundColor: ['#2a2a2a'],
          borderWidth: 0
        }]
      };
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: ['#ff6b35', '#ff8c42', '#ffa65c', '#ffc18c', '#ffd9bd'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    };
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#b0b0b0',
          padding: 20,
          font: { size: 13, weight: '500' },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#252525',
        titleColor: '#fff',
        bodyColor: '#b0b0b0',
        borderColor: '#ff6b35',
        borderWidth: 1,
        padding: 12,
        bodyFont: { size: 13 },
        titleFont: { size: 14, weight: '600' },
        callbacks: {
          label: function (context) {
            return context.label + ': ' + context.parsed + '%';
          }
        }
      }
    },
    layout: { padding: { top: 20, right: 20, bottom: 20, left: 20 } }
  };

  const handleDownloadChart = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = 'product-distribution.png';
      link.href = chartRef.current.toBase64Image();
      link.click();
      showToast('success', 'Download', 'Chart downloaded successfully');
    }
  };

  const handleNavClick = (page) => {
    setActivePage(page);
    setMobileMenuActive(false);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            orders={orders}
            totalRevenue={totalRevenue}
            customerCount={customerCount}
            productCount={productCount}
            chartPeriod={chartPeriod}
            setChartPeriod={setChartPeriod}
            getLineChartData={getLineChartData}
            lineChartOptions={lineChartOptions}
            doughnutChartData={getDoughnutChartData()}
            doughnutChartOptions={doughnutChartOptions}
            handleDownloadChart={handleDownloadChart}
            chartRef={chartRef}
            showToast={showToast}
          />
        );
      case 'orders':
        return <Orders orders={orders} setOrders={setOrders} showToast={showToast} />;
      case 'products':
        return <Products showToast={showToast} />;
      case 'customers':
        return <Customers showToast={showToast} />;
      case 'inventory':
        return <Inventory showToast={showToast} />;
      case 'reports':
        return <Reports showToast={showToast} />;
      case 'finance':
        return <Finance showToast={showToast} />;
      case 'employees':
        return <Employees showToast={showToast} />;
      case 'settings':
        return <Settings showToast={showToast} />;
      default:
        return (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2 style={{ color: 'var(--text-secondary)' }}>404 - Page Not Found</h2>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActivePage('dashboard')}>
              Return to Dashboard
            </button>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    if (!showAdmin) {
      return <Landing onLoginClick={() => setShowAdmin(true)} />;
    }

    if (authMode === 'forgot-password') {
      return <ForgotPassword setAuthMode={setAuthMode} showToast={showToast} onBack={() => setShowAdmin(false)} />;
    }
    if (authMode === 'verify-email') {
      return <VerifyEmail setAuthMode={setAuthMode} onBack={() => setShowAdmin(false)} />;
    }
    return <Login setIsAuthenticated={setIsAuthenticated} showToast={showToast} setAuthMode={setAuthMode} onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="admin-container">
      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuActive={mobileMenuActive}
        activePage={activePage}
        handleNavClick={handleNavClick}
        isAdmin={userRole === 'admin'}
        orderCount={orders.length}
      />

      {/* Main Content */}
      <main className="main-content">
        <Header
          mobileMenuActive={mobileMenuActive}
          setMobileMenuActive={setMobileMenuActive}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          showToast={showToast}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          userDropdownActive={userDropdownActive}
          setUserDropdownActive={setUserDropdownActive}
          setIsAuthenticated={setIsAuthenticated}
          onRefresh={fetchInitialData}
          refreshing={loading}
        />

        {/* Page Content */}
        <div className="page-content">
          {renderActivePage()}
        </div>
      </main>

      {/* Toast Notification */}
      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>
        <i className={`toast-icon fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-times-circle' : 'fa-info-circle'}`}></i>
        <div className="toast-content">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-message">{toast.message}</div>
        </div>
        <button className="toast-close" onClick={() => setToast({ ...toast, show: false })}>
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default App;
