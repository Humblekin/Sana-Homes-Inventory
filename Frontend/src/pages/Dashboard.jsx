import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';

const Dashboard = ({ orders, totalRevenue, customerCount, productCount, chartPeriod, setChartPeriod, getLineChartData, lineChartOptions, doughnutChartData, doughnutChartOptions, handleDownloadChart, chartRef, showToast }) => {
  return (
    <div id="dashboardPage" className="animate-fade-in-up">
      <div className="page-header">
        <h1 className="page-title glow-text">Dashboard Overview</h1>
        <div className="breadcrumb">
          <a href="#">Home</a>
          <i className="fas fa-chevron-right" style={{ fontSize: '0.75rem' }}></i>
          <span>Dashboard</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card glass-card hover-glow animate-stagger-1">
          <div className="stat-header">
            <div className="stat-icon primary"><i className="fas fa-dollar-sign"></i></div>
            <button className="header-btn tooltip" data-tooltip="More details" style={{ fontSize: '1rem' }} onClick={() => showToast('info', 'Stats', 'Detailed statistics coming soon!')}>
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="stat-value">₵{totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-change positive"><i className="fas fa-arrow-up"></i><span>12.5% from last month</span></div>
        </div>
        
        <div className="stat-card glass-card hover-glow animate-stagger-2">
          <div className="stat-header">
            <div className="stat-icon success"><i className="fas fa-shopping-cart"></i></div>
            <button className="header-btn tooltip" data-tooltip="More details" style={{ fontSize: '1rem' }} onClick={() => showToast('info', 'Stats', 'Detailed statistics coming soon!')}>
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Total Orders</div>
          <div className="stat-change positive"><i className="fas fa-arrow-up"></i><span>8.2% from last month</span></div>
        </div>

        <div className="stat-card glass-card hover-glow animate-stagger-3">
          <div className="stat-header">
            <div className="stat-icon warning"><i className="fas fa-users"></i></div>
            <button className="header-btn tooltip" data-tooltip="More details" style={{ fontSize: '1rem' }} onClick={() => showToast('info', 'Stats', 'Detailed statistics coming soon!')}>
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="stat-value">{customerCount}</div>
          <div className="stat-label">Active Customers</div>
          <div className="stat-change positive"><i className="fas fa-arrow-up"></i><span>5.7% from last month</span></div>
        </div>

        <div className="stat-card glass-card hover-glow animate-stagger-4">
          <div className="stat-header">
            <div className="stat-icon info"><i className="fas fa-box"></i></div>
            <button className="header-btn tooltip" data-tooltip="More details" style={{ fontSize: '1rem' }} onClick={() => showToast('info', 'Stats', 'Detailed statistics coming soon!')}>
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="stat-value">{productCount}</div>
          <div className="stat-label">Products in Stock</div>
          <div className="stat-change negative"><i className="fas fa-arrow-down"></i><span>3.1% from last month</span></div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card glass-card hover-glow animate-stagger-2">
          <div className="chart-header">
            <h3 className="chart-title">Sales Overview</h3>
            <div className="chart-options">
              <button className={`chart-btn ${chartPeriod === 'week' ? 'active' : ''}`} onClick={() => setChartPeriod('week')}>Week</button>
              <button className={`chart-btn ${chartPeriod === 'month' ? 'active' : ''}`} onClick={() => setChartPeriod('month')}>Month</button>
              <button className={`chart-btn ${chartPeriod === 'year' ? 'active' : ''}`} onClick={() => setChartPeriod('year')}>Year</button>
            </div>
          </div>
          <div className="chart-container">
            <Line data={getLineChartData()} options={lineChartOptions} />
          </div>
        </div>

        <div className="chart-card glass-card hover-glow animate-stagger-3">
          <div className="chart-header">
            <h3 className="chart-title">Product Distribution</h3>
            <div className="chart-options">
              <button className="chart-btn" onClick={handleDownloadChart}>
                <i className="fas fa-download"></i>
              </button>
            </div>
          </div>
          <div className="chart-container">
            <Doughnut ref={chartRef} data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
