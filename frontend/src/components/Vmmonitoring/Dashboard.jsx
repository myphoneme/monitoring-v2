import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, CheckCircle, Calendar, Filter, ChevronDown, ChevronRight, Clock, ChevronUp } from 'lucide-react';
import VMCard from './VMCard';
import styles from '../../styles/Dashboard.module.css';

const Dashboard = ({ dashboardData, onRefresh }) => {
  const { vms, loading, error, lastUpdated } = dashboardData;
  
  const [filteredVms, setFilteredVms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);
  const [collapsedHours, setCollapsedHours] = useState({});
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Set up available dates and default selection when vms data changes
  useEffect(() => {
    if (vms.length > 0) {
      const dates = [...new Set(vms.map(vm => new Date(vm.created_at).toDateString()))];
      const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
      setAvailableDates(sortedDates);
      
      // Set latest date as default if not already selected
      if (!selectedDate && sortedDates.length > 0) {
        setSelectedDate(sortedDates[0]);
      }
    }
  }, [vms, selectedDate]);

  // Scroll event listener for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    let filtered = vms;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vm => 
        vm.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.vm_master?.vm_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(vm => 
        new Date(vm.created_at).toDateString() === selectedDate
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vm => vm.status === statusFilter);
    }

    setFilteredVms(filtered);

    // Set all hours as collapsed by default when data changes
    const grouped = groupVMsByHour(filtered);
    const initialCollapsedState = {};
    Object.keys(grouped).forEach(hour => {
      initialCollapsedState[hour] = true; // All collapsed by default
    });
    setCollapsedHours(initialCollapsedState);
  }, [searchTerm, vms, selectedDate, statusFilter]);

  const groupVMsByHour = (vms) => {
    const grouped = {};
    vms.forEach(vm => {
      const date = new Date(vm.created_at);
      const hour = date.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!grouped[hourKey]) {
        grouped[hourKey] = [];
      }
      grouped[hourKey].push(vm);
    });
    
    // Sort hours in descending order (latest first)
    const sortedGrouped = {};
    Object.keys(grouped)
      .sort((a, b) => {
        const hourA = parseInt(a.split(':')[0]);
        const hourB = parseInt(b.split(':')[0]);
        return hourB - hourA;
      })
      .forEach(key => {
        sortedGrouped[key] = grouped[key];
      });
    
    return sortedGrouped;
  };

  const getHourlyStats = (vms) => {
    const total = vms.length;
    const reachable = vms.filter(vm => vm.status === 'reachable').length;
    const unreachable = total - reachable;
    
    return { total, reachable, unreachable };
  };

  const toggleHourCollapse = (hour) => {
    setCollapsedHours(prev => ({
      ...prev,
      [hour]: !prev[hour]
    }));
  };

  const getOverallStats = () => {
    const total = filteredVms.length;
    const reachable = filteredVms.filter(vm => vm.status === 'reachable').length;
    const unreachable = total - reachable;
    
    return { total, reachable, unreachable };
  };

  const overallStats = getOverallStats();
  const groupedVms = groupVMsByHour(filteredVms);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>VM Monitoring Dashboard</h2>
          {lastUpdated && (
            <p className={styles.lastUpdated}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className={styles.controls}>
          <div className={styles.filterContainer}>
            <Calendar className={styles.filterIcon} />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.dateSelect}
            >
              <option value="">All Dates</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterContainer}>
            <Filter className={styles.filterIcon} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.statusSelect}
            >
              <option value="all">All Status</option>
              <option value="reachable">Reachable</option>
              <option value="not reachable">Unreachable</option>
            </select>
          </div>

          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by IP or VM name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <button
            onClick={() => onRefresh(null)}
            className={styles.refreshButton}
            disabled={loading}
          >
            <RefreshCw className={loading ? styles.spinning : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{overallStats.total}</div>
          <div className={styles.statLabel}>Total VMs</div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <CheckCircle className={styles.statIcon} />
          <div className={styles.statValue}>{overallStats.reachable}</div>
          <div className={styles.statLabel}>Reachable</div>
        </div>
        <div className={`${styles.statCard} ${styles.error}`}>
          <AlertCircle className={styles.statIcon} />
          <div className={styles.statValue}>{overallStats.unreachable}</div>
          <div className={styles.statLabel}>Unreachable</div>
        </div>
      </div>

      {error && (
        <div className={styles.errorContainer}>
          <AlertCircle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className={styles.loadingContainer}>
          <RefreshCw className={`${styles.loadingIcon} ${styles.spinning}`} />
          <p>Loading VM data...</p>
        </div>
      )}

      <div className={styles.content}>
        {Object.keys(groupedVms).length === 0 && !loading && vms.length === 0 ? (
          <div className={styles.noData}>
            <p>No VM data available. Click refresh to load data.</p>
          </div>
        ) : Object.keys(groupedVms).length === 0 && !loading ? (
          <div className={styles.noData}>
            <p>No VMs found matching your search criteria</p>
          </div>
        ) : (
          <div className={styles.dateSection}>
            <h3 className={styles.dateTitle}>
              {selectedDate || 'All Dates'} - Hourly Data
            </h3>
            
            {Object.entries(groupedVms).map(([hour, vms]) => {
              const hourStats = getHourlyStats(vms);
              const isCollapsed = collapsedHours[hour];
              
              return (
                <div key={hour} className={styles.hourGroup}>
                  <div 
                    className={styles.hourHeader}
                    onClick={() => toggleHourCollapse(hour)}
                  >
                    <div className={styles.hourInfo}>
                      <div className={styles.hourTitle}>
                        {isCollapsed ? <ChevronRight className={styles.chevron} /> : <ChevronDown className={styles.chevron} />}
                        <Clock className={styles.clockIcon} />
                        <span className={styles.hourText}>{hour}</span>
                      </div>
                      
                      <div className={styles.hourStats}>
                        <span className={styles.hourStat}>
                          Total: <strong>{hourStats.total}</strong>
                        </span>
                        <span className={`${styles.hourStat} ${styles.success}`}>
                          Reachable: <strong>{hourStats.reachable}</strong>
                        </span>
                        <span className={`${styles.hourStat} ${styles.error}`}>
                          Unreachable: <strong>{hourStats.unreachable}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!isCollapsed && (
                    <div className={styles.vmGrid}>
                      {vms.map(vm => (
                        <VMCard key={vm.id} vm={vm} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          onClick={scrollToTop}
          className={styles.backToTop}
          title="Back to top"
        >
          <ChevronUp className={styles.backToTopIcon} />
        </button>
      )}
    </div>
  );
};

export default Dashboard;