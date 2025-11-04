import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, ArrowRight, Calendar, Filter, ChevronDown, ChevronRight, Clock, RefreshCw, ChevronUp } from 'lucide-react';
import styles from '../../styles/VMStatus.module.css';

const VMStatus = ({ vmStatusData, onRefresh }) => {
  const { allStatusData, loading } = vmStatusData;
  
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);
  const [collapsedHours, setCollapsedHours] = useState({});
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Set up available dates and default selection when data changes
  useEffect(() => {
    if (allStatusData.length > 0) {
      const dates = [...new Set(allStatusData.map(item => new Date(item.current_time).toDateString()))];
      const sortedDates = dates.sort((a, b) => new Date(b) - new Date(a));
      setAvailableDates(sortedDates);
      
      // Set latest date as default if not already selected
      if (!selectedDate && sortedDates.length > 0) {
        setSelectedDate(sortedDates[0]);
      }
    }
  }, [allStatusData, selectedDate]);

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
    let filtered = allStatusData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vm_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(item => 
        new Date(item.current_time).toDateString() === selectedDate
      );
    }

    // Filter by status change
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status_change === statusFilter);
    }

    setFilteredData(filtered);

    // Set all hours as collapsed by default when data changes
    const grouped = groupByHour(filtered);
    const initialCollapsedState = {};
    Object.keys(grouped).forEach(hour => {
      initialCollapsedState[hour] = true; // All collapsed by default
    });
    setCollapsedHours(initialCollapsedState);
  }, [searchTerm, allStatusData, selectedDate, statusFilter]);

  const groupByHour = (data) => {
    const grouped = {};
    data.forEach(item => {
      const date = new Date(item.current_time);
      const hour = date.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!grouped[hourKey]) {
        grouped[hourKey] = [];
      }
      grouped[hourKey].push(item);
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

  const toggleHourCollapse = (hour) => {
    setCollapsedHours(prev => ({
      ...prev,
      [hour]: !prev[hour]
    }));
  };

  const getStatusIcon = (change) => {
    switch (change) {
      case 'came back':
        return <TrendingUp className={`${styles.statusIcon} ${styles.success}`} />;
      case 'went down':
        return <TrendingDown className={`${styles.statusIcon} ${styles.error}`} />;
      case 'still down':
        return <Minus className={`${styles.statusIcon} ${styles.error}`} />;
      case 'no change':
        return <Minus className={`${styles.statusIcon} ${styles.success}`} />;
      default:
        return <ArrowRight className={`${styles.statusIcon} ${styles.info}`} />;
    }
  };

  const getStatusClass = (change) => {
    switch (change) {
      case 'came back':
      case 'no change':
        return styles.success;
      case 'went down':
      case 'still down':
        return styles.error;
      default:
        return styles.info;
    }
  };

  const getHourlyStatusStats = (items) => {
    const stats = {
      total: items.length,
      'no change': 0,
      'still down': 0,
      'came back': 0,
      'went down': 0,
      'new': 0
    };
    
    items.forEach(item => {
      if (stats.hasOwnProperty(item.status_change)) {
        stats[item.status_change]++;
      }
    });
    
    return stats;
  };

  const groupedData = groupByHour(filteredData);

  return (
    <div className={styles.vmStatus}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>VM Status History</h2>
          <p className={styles.subtitle}>Track status changes and trends over time</p>
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
              <option value="all">All Changes</option>
              <option value="no change">No Change</option>
              <option value="still down">Still Down</option>
              <option value="came back">Came Back</option>
              <option value="went down">Went Down</option>
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

      {loading && (
        <div className={styles.loadingContainer}>
          <RefreshCw className={`${styles.loadingIcon} ${styles.spinning}`} />
          <p>Loading status history...</p>
        </div>
      )}

      <div className={styles.content}>
        {Object.keys(groupedData).length === 0 && !loading && allStatusData.length === 0 ? (
          <div className={styles.noData}>
            <p>No status history available. Click refresh to load data.</p>
          </div>
        ) : Object.keys(groupedData).length === 0 && !loading ? (
          <div className={styles.noData}>
            <p>No status changes found matching your search criteria</p>
          </div>
        ) : (
          <div className={styles.dateSection}>
            <h3 className={styles.dateTitle}>
              {selectedDate || 'All Dates'} - Hourly Status Changes
            </h3>
            
            {Object.entries(groupedData).map(([hour, items]) => {
              const hourStats = getHourlyStatusStats(items);
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
                          No Change: <strong>{hourStats['no change']}</strong>
                        </span>
                        <span className={`${styles.hourStat} ${styles.error}`}>
                          Still Down: <strong>{hourStats['still down']}</strong>
                        </span>
                        <span className={`${styles.hourStat} ${styles.success}`}>
                          Came Back: <strong>{hourStats['came back']}</strong>
                        </span>
                        <span className={`${styles.hourStat} ${styles.error}`}>
                          Went Down: <strong>{hourStats['went down']}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!isCollapsed && (
                    <div className={styles.statusGrid}>
                      {items.map((item, index) => (
                        <div key={`${item.ip}-${index}`} className={`${styles.statusCard} ${getStatusClass(item.status_change)}`}>
                          <div className={styles.cardHeader}>
                            <div className={styles.vmInfo}>
                              <h4 className={styles.vmName}>{item.vm_name}</h4>
                              <span className={styles.ip}>{item.ip}</span>
                            </div>
                            <div className={styles.statusChange}>
                              {getStatusIcon(item.status_change)}
                              <span className={styles.changeText}>{item.status_change}</span>
                            </div>
                          </div>

                          <div className={styles.cardContent}>
                            <div className={styles.statusComparison}>
                              <div className={styles.statusItem}>
                                <span className={styles.label}>Current Status:</span>
                                <span className={`${styles.status} ${item.current_status === 'reachable' ? styles.reachable : styles.unreachable}`}>
                                  {item.current_status}
                                </span>
                              </div>
                              
                              {item.previous_status && item.previous_status !== 'unknown' && (
                                <div className={styles.statusItem}>
                                  <span className={styles.label}>Previous Status:</span>
                                  <span className={`${styles.status} ${item.previous_status === 'reachable' ? styles.reachable : styles.unreachable}`}>
                                    {item.previous_status}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className={styles.timestamps}>
                              <div className={styles.timestamp}>
                                <span className={styles.label}>Current Check:</span>
                                <span className={styles.time}>
                                  {new Date(item.current_time).toLocaleString()}
                                </span>
                              </div>
                              
                              {item.previous_time && (
                                <div className={styles.timestamp}>
                                  <span className={styles.label}>Previous Check:</span>
                                  <span className={styles.time}>
                                    {new Date(item.previous_time).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {(item.project !== 'N/A' || item.cluster !== 'N/A') && (
                              <div className={styles.additionalInfo}>
                                {item.project !== 'N/A' && (
                                  <span className={styles.tag}>Project: {item.project}</span>
                                )}
                                {item.cluster !== 'N/A' && (
                                  <span className={styles.tag}>Cluster: {item.cluster}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
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

export default VMStatus;