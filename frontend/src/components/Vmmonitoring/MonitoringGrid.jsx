import React, { useState, useEffect } from 'react';
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Calendar,
  MapPin,
  User,
  FileText,
  X,
  Sun,
  Moon,
  Search,
  RefreshCw,
  Filter,
  FolderOpen
} from 'lucide-react';
import { fetchVMMasterData, fetchRealtimePingStatus } from '../../services/api';
import { getLast30Days, formatDateForDisplay, formatDateForAPI, getTodayFormatted } from '../../utils/dateUtils';
import styles from '../../styles/MonitoringGrid.module.css';

const MonitoringGrid = ({ dashboardData, vmStatusData, onRefresh }) => {
  const { vms, loading } = dashboardData;
  const { allStatusData } = vmStatusData;
  
  const [selectedDate, setSelectedDate] = useState(getTodayFormatted());
  const [availableDates, setAvailableDates] = useState(getLast30Days());
  const [gridData, setGridData] = useState({});
  const [selectedModal, setSelectedModal] = useState(null);
  const [timeMode, setTimeMode] = useState('AM');
  const [stats, setStats] = useState({ total: 0, reachable: 0, unreachable: 0 });
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [availableProjects, setAvailableProjects] = useState([]);
  const [vmMasterData, setVmMasterData] = useState([]);
  
  // Real-time status state
  const [realtimeStatus, setRealtimeStatus] = useState({});
  const [realtimeLoading, setRealtimeLoading] = useState(false);

    // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load VM master data on component mount
  useEffect(() => {
    const loadVMMasterData = async () => {
      try {
        const masterData = await fetchVMMasterData();
        setVmMasterData(masterData);
      } catch (error) {
        console.error('Error loading VM master data:', error);
      }
    };
    loadVMMasterData();
  }, []);

  // Real-time status polling
  useEffect(() => {
    const fetchRealtimeStatus = async () => {
      try {
        setRealtimeLoading(true);
        const statusData = await fetchRealtimePingStatus();
        
        // Convert array to object for easier lookup
        const statusMap = {};
        statusData.forEach(item => {
          const key = `${item.vm_ip}-${item.vm_name}`;
          statusMap[key] = {
            reachable: item.reachable,
            vm_ip: item.vm_ip,
            vm_name: item.vm_name
          };
        });
        
        setRealtimeStatus(statusMap);
      } catch (error) {
        console.error('Error fetching real-time status:', error);
      } finally {
        setRealtimeLoading(false);
      }
    };

    // Initial fetch
    fetchRealtimeStatus();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchRealtimeStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Generate hours for AM/PM
  const getHoursForMode = (mode) => {
    if (mode === 'AM') {
      return Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        return `${hour}:00 AM`;
      });
    } else {
      return Array.from({ length: 12 }, (_, i) => {
        const hour = i === 0 ? 12 : i;
        return `${hour}:00 PM`;
      });
    }
  };

  const hours = getHoursForMode(timeMode);

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
    if (allStatusData.length > 0 || vmMasterData.length > 0) {
      // Get unique projects
      const statusProjects = allStatusData.map(item => item.project).filter(p => p && p !== 'N/A');
      const masterProjects = vmMasterData.map(vm => vm.project_name).filter(p => p && p !== 'N/A');
      const projects = [...new Set([...statusProjects, ...masterProjects])];
      setAvailableProjects(projects.sort());
    }
  }, [allStatusData, vmMasterData]);

  useEffect(() => {
    if (selectedDate && (allStatusData.length > 0 || vms.length > 0)) {
      processGridData();
      calculateStats();
    }
  }, [selectedDate, allStatusData, vms, vmMasterData, timeMode, searchTerm, statusFilter, onlineFilter, severityFilter, projectFilter]);

  const processGridData = () => {
    // Get all VMs from master data, status data, and current monitoring data
    const allVMsMap = new Map();
    
    // Add VMs from master data first (this ensures we get ALL VMs)
    vmMasterData.forEach(vm => {
      const vmKey = `${vm.ip}-${vm.vm_name}`;
      allVMsMap.set(vmKey, {
        ip: vm.ip,
        vm_name: vm.vm_name,
        project: vm.project_name || 'N/A',
        cluster: vm.cluster || 'N/A',
        hasStatusData: false,
        hasMasterData: true
      });
    });
    
    // Add VMs from status data
    allStatusData.forEach(item => {
      const vmKey = `${item.ip}-${item.vm_name}`;
      if (allVMsMap.has(vmKey)) {
        // Update existing entry
        const existing = allVMsMap.get(vmKey);
        allVMsMap.set(vmKey, {
          ...existing,
          hasStatusData: true
        });
      } else {
        // Add new entry
        allVMsMap.set(vmKey, {
          ip: item.ip,
          vm_name: item.vm_name,
          project: item.project,
          cluster: item.cluster,
          hasStatusData: true,
          hasMasterData: false
        });
      }
    });
    
    // Update with current monitoring data
    vms.forEach(vm => {
      const vmKey = `${vm.ip}-${vm.vm_master?.vm_name || 'Unknown VM'}`;
      if (allVMsMap.has(vmKey)) {
        // Update existing entry
        const existing = allVMsMap.get(vmKey);
        allVMsMap.set(vmKey, {
          ...existing,
          currentStatus: vm.status,
          hasCurrentData: true
        });
      } else {
        // Add new entry
        allVMsMap.set(vmKey, {
          ip: vm.ip,
          vm_name: vm.vm_master?.vm_name || 'Unknown VM',
          project: vm.vm_master?.project_name || 'N/A',
          cluster: vm.vm_master?.cluster || 'N/A',
          hasStatusData: false,
          hasMasterData: false,
          currentStatus: vm.status,
          hasCurrentData: true
        });
      }
    });
    
    // Filter status data by date first
    let filtered = allStatusData.filter(item => {
      const itemDate = new Date(item.current_time);
      const itemDateStr = formatDateForAPI(itemDate);
      return itemDateStr === selectedDate;
    });

    // Apply status change filter to status data only
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status_change === statusFilter);
    }

    const grouped = {};
    
    // Initialize all VMs in the grid
    allVMsMap.forEach((vmData, vmKey) => {
      grouped[vmKey] = {
        vm_name: vmData.vm_name,
        ip: vmData.ip,
        project: vmData.project,
        cluster: vmData.cluster,
        hasStatusData: vmData.hasStatusData,
        hasMasterData: vmData.hasMasterData,
        hasCurrentData: vmData.hasCurrentData,
        currentStatus: vmData.currentStatus,
        hourlyData: {}
      };
    });

    // Process hourly data
    filtered.forEach(item => {
      const vmKey = `${item.ip}-${item.vm_name}`;
      const date = new Date(item.current_time);
      const hour = date.getHours();
      const isPM = hour >= 12;
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const hourKey = `${displayHour}:00 ${isPM ? 'PM' : 'AM'}`;
      
      if (grouped[vmKey]) {
        if (!grouped[vmKey].hourlyData[hourKey]) {
          grouped[vmKey].hourlyData[hourKey] = [];
        }
        grouped[vmKey].hourlyData[hourKey].push(item);
      }
    });

    // Now apply VM-level filters (these will filter which VMs are shown)
    let finalGrouped = { ...grouped };
    
    // Apply search filter to VM list
    if (searchTerm) {
      const searchFilteredGrouped = {};
      Object.entries(finalGrouped).forEach(([vmKey, vmData]) => {
        if (vmData.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vmData.vm_name.toLowerCase().includes(searchTerm.toLowerCase())) {
          searchFilteredGrouped[vmKey] = vmData;
        }
      });
      finalGrouped = searchFilteredGrouped;
    }
    
    // Apply project filter to VM list
    if (projectFilter !== 'all') {
      const projectFilteredGrouped = {};
      Object.entries(finalGrouped).forEach(([vmKey, vmData]) => {
        if (vmData.project === projectFilter) {
          projectFilteredGrouped[vmKey] = vmData;
        }
      });
      finalGrouped = projectFilteredGrouped;
    }
    
    // Apply online filter to VM list
    if (onlineFilter !== 'all') {
      const onlineFilteredGrouped = {};
      Object.entries(finalGrouped).forEach(([vmKey, vmData]) => {
        const latestStatus = getLatestVMStatus(vmData.ip, vmData.vm_name);
        const isOnline = latestStatus === 'reachable';
        
        if ((onlineFilter === 'online' && isOnline) || 
            (onlineFilter === 'offline' && !isOnline)) {
          onlineFilteredGrouped[vmKey] = vmData;
        }
      });
      finalGrouped = onlineFilteredGrouped;
    }
    
    // Apply severity filter to VM list
    if (severityFilter !== 'all') {
      const severityFilteredGrouped = {};
      Object.entries(finalGrouped).forEach(([vmKey, vmData]) => {
        const severity = getVMSeverity(vmData);
        if (severity === severityFilter) {
          severityFilteredGrouped[vmKey] = vmData;
        }
      });
      finalGrouped = severityFilteredGrouped;
    }
    
    setGridData(finalGrouped);
  };

  const calculateStats = () => {
    // Get all unique VMs from all data sources
    const allVMsMap = new Map();
    
    // Add from master data
    vmMasterData.forEach(vm => {
      const vmKey = `${vm.ip}-${vm.vm_name}`;
      allVMsMap.set(vmKey, {
        ip: vm.ip,
        vm_name: vm.vm_name,
        status: 'unknown'
      });
    });
    
    // Update with current monitoring data
    vms.forEach(vm => {
      const vmKey = `${vm.ip}-${vm.vm_master?.vm_name || 'Unknown VM'}`;
      allVMsMap.set(vmKey, {
        ip: vm.ip,
        vm_name: vm.vm_master?.vm_name || 'Unknown VM',
        status: vm.status
      });
    });
    
    // Update with latest status data
    const latestStatuses = {};
    
    allStatusData.forEach(item => {
      const vmKey = `${item.ip}-${item.vm_name}`;
      const currentTime = new Date(item.current_time);
      
      if (!latestStatuses[vmKey] || new Date(latestStatuses[vmKey].current_time) < currentTime) {
        latestStatuses[vmKey] = item;
      }
    });
    
    // Update VM statuses with latest status data
    Object.entries(latestStatuses).forEach(([vmKey, statusData]) => {
      if (allVMsMap.has(vmKey)) {
        const vmData = allVMsMap.get(vmKey);
        allVMsMap.set(vmKey, {
          ...vmData,
          status: statusData.current_status
        });
      }
    });

    const total = allVMsMap.size;
    const reachable = Array.from(allVMsMap.values()).filter(vm => vm.status === 'reachable').length;
    const unreachable = total - reachable;

    setStats({ total, reachable, unreachable });
  };
  
  const getLatestVMStatus = (ip, vmName) => {
    // First check current monitoring data
    const currentVM = vms.find(vm => vm.ip === ip);
    if (currentVM) {
      return currentVM.status;
    }
    
    // Then check status history
    const vmStatuses = allStatusData.filter(item => 
      item.ip === ip && item.vm_name === vmName
    ).sort((a, b) => new Date(b.current_time) - new Date(a.current_time));
    
    return vmStatuses.length > 0 ? vmStatuses[0].current_status : 'unknown';
  };

  const getRealtimeStatus = (ip, vmName) => {
    const key = `${ip}-${vmName}`;
    return realtimeStatus[key] || null;
  };

  const RealtimeStatusIndicator = ({ ip, vmName }) => {
    const status = getRealtimeStatus(ip, vmName);
    
    if (!status) {
      return <div className={styles.statusIndicator} style={{ background: '#64748b' }} title="Status Unknown"></div>;
    }
    
    return (
      <div 
        className={`${styles.statusIndicator} ${status.reachable ? styles.reachable : styles.unreachable}`}
        title={`Real-time Status: ${status.reachable ? 'Reachable' : 'Unreachable'}`}
      />
    );
  };

  const getStatusIcon = (hourData) => {
    if (!hourData || hourData.length === 0) {
      return <div className={styles.emptyCell}></div>;
    }

    // Get the latest status for this hour
    const latestStatus = hourData.sort((a, b) => new Date(b.current_time) - new Date(a.current_time))[0];
    
    const iconProps = {
      className: styles.statusIcon,
      onClick: () => setSelectedModal(latestStatus)
    };

    switch (latestStatus.status_change) {
      case 'came back':
        return <TrendingUp {...iconProps} style={{ color: '#10b981' }} title="Came Back" />;
      case 'went down':
        return <TrendingDown {...iconProps} style={{ color: '#ff6b35' }} title="Went Down" />;
      case 'still down':
        return <XCircle {...iconProps} style={{ color: '#e5512a' }} title="Still Down" />;
      case 'no change':
        return latestStatus.current_status === 'reachable' 
          ? <CheckCircle {...iconProps} style={{ color: '#10b981' }} title="Reachable" />
          : <XCircle {...iconProps} style={{ color: '#ff6b35' }} title="Unreachable" />;
      default:
        return <Info {...iconProps} style={{ color: '#ffd700' }} title="New" />;
    }
  };
  
  const getVMStatusIcon = (vmData) => {
    // Show current status for VMs
    if (!vmData.hasStatusData || !vmData.hasCurrentData) {
      const latestStatus = getLatestVMStatus(vmData.ip, vmData.vm_name);
      const iconProps = {
        className: styles.statusIcon,
        onClick: () => setSelectedModal({
          ip: vmData.ip,
          vm_name: vmData.vm_name,
          current_status: latestStatus,
          current_time: new Date().toISOString(),
          project: vmData.project,
          cluster: vmData.cluster,
          status_change: 'current'
        })
      };
      
      return latestStatus === 'reachable'
        ? <CheckCircle {...iconProps} style={{ color: '#10b981' }} title="Currently Reachable" />
        : latestStatus === 'not reachable'
        ? <XCircle {...iconProps} style={{ color: '#ef4444' }} title="Currently Unreachable" />
        : <div className={styles.emptyCell} title="Status Unknown"></div>;
    }
    
    return <div className={styles.emptyCell}></div>;
  };

  const getVMSeverity = (vmData) => {
    // Find the last reachable time for this VM
    const vmStatuses = allStatusData.filter(item => 
      item.ip === vmData.ip && item.vm_name === vmData.vm_name
    ).sort((a, b) => new Date(b.current_time) - new Date(a.current_time));

    const latestStatus = vmStatuses[0];
    if (!latestStatus || latestStatus.current_status === 'reachable') {
      return 'healthy';
    }

    // Find last reachable time
    const lastReachable = vmStatuses.find(status => status.current_status === 'reachable');
    if (!lastReachable) {
      return 'hazardous'; // Never been reachable
    }

    const daysSinceReachable = (new Date() - new Date(lastReachable.current_time)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceReachable <= 1) return 'warning';
    if (daysSinceReachable <= 3) return 'sensitive';
    return 'hazardous';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'healthy': return '#10b981';
      case 'warning': return '#ffd700';
      case 'sensitive': return '#ff8f65';
      case 'hazardous': return '#e5512a';
      default: return '#64748b';
    }
  };

  const formatDiskUsage = (diskData) => {
    try {
      const disks = typeof diskData === 'string' ? JSON.parse(diskData) : diskData;
      if (!disks || Object.keys(disks).length === 0) return 'N/A';
      
      return Object.entries(disks).map(([drive, usage]) => 
        `${drive}: ${usage}%`
      ).join(', ');
    } catch {
      return 'N/A';
    }
  };

  const getLastReachableTime = (vmData) => {
    const vmStatuses = allStatusData.filter(item => 
      item.ip === vmData.ip && item.vm_name === vmData.vm_name && item.current_status === 'reachable'
    ).sort((a, b) => new Date(b.current_time) - new Date(a.current_time));

    return vmStatuses.length > 0 ? vmStatuses[0].current_time : null;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOnlineFilter('all');
    setSeverityFilter('all');
    setProjectFilter('all');
  };

  return (
    <div className={styles.monitoringGrid}>
      {/* Combined Control Panel */}
      <div className={styles.controlPanel}>
        {/* Title and Stats Row */}
        <div className={styles.titleStatsRow}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>VM Monitoring Grid</h2>
            <p className={styles.subtitle}>Real-time virtual machine status monitoring</p>
          </div>
          
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total VMs</div>
            </div>
            <div className={`${styles.statCard} ${styles.success}`}>
              <CheckCircle className={styles.statIcon} />
              <div className={styles.statValue}>{stats.reachable}</div>
              <div className={styles.statLabel}>Online</div>
            </div>
            <div className={`${styles.statCard} ${styles.error}`}>
              <XCircle className={styles.statIcon} />
              <div className={styles.statValue}>{stats.unreachable}</div>
              <div className={styles.statLabel}>Offline</div>
            </div>
          </div>
        </div>

        {/* Controls and Filters Row */}
        <div className={styles.controlsFiltersRow}>
          <div className={styles.primaryControls}>
            <div className={styles.dateContainer}>
              <Calendar className={styles.controlIcon} />
              <select
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setSelectedDate(newDate);
                  onRefresh(newDate);
                }}
                className={styles.dateSelect}
              >
                {availableDates.map(date => {
                  const dateValue = formatDateForAPI(date);
                  return (
                    <option key={dateValue} value={dateValue}>
                      {formatDateForDisplay(date)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className={styles.timeModeToggle}>
              <button
                className={`${styles.toggleButton} ${timeMode === 'AM' ? styles.active : ''}`}
                onClick={() => setTimeMode('AM')}
              >
                <Sun className={styles.toggleIcon} />
                AM
              </button>
              <button
                className={`${styles.toggleButton} ${timeMode === 'PM' ? styles.active : ''}`}
                onClick={() => setTimeMode('PM')}
              >
                <Moon className={styles.toggleIcon} />
                PM
              </button>
            </div>

            <button 
              onClick={onRefresh} 
              className={styles.refreshButton}
              disabled={loading}
            >
              <RefreshCw className={loading ? styles.spinning : ''} />
              Refresh
            </button>
          </div>

          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search VM name or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Filters and Legend Row */}
        <div className={styles.filtersLegendRow}>
          <div className={styles.filterGroup}>
            <div className={styles.filterContainer}>
              <Filter className={styles.filterIcon} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="no change">No Change</option>
                <option value="came back">Came Back</option>
                <option value="went down">Went Down</option>
                <option value="still down">Still Down</option>
              </select>
            </div>

            <div className={styles.filterContainer}>
              <CheckCircle className={styles.filterIcon} />
              <select
                value={onlineFilter}
                onChange={(e) => setOnlineFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All VMs</option>
                <option value="online">Online Only</option>
                <option value="offline">Offline Only</option>
              </select>
            </div>

            <div className={styles.filterContainer}>
              <AlertTriangle className={styles.filterIcon} />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Severity</option>
                <option value="healthy">Healthy</option>
                <option value="warning">Warning</option>
                <option value="sensitive">Sensitive</option>
                <option value="hazardous">Hazardous</option>
              </select>
            </div>

            <div className={styles.filterContainer}>
              <FolderOpen className={styles.filterIcon} />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Projects</option>
                {availableProjects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>

            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>

          <div className={styles.legendContainer}>
            <div className={styles.legend}>
              <div className={styles.legendTitle}>Real-time Status:</div>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <div className={`${styles.statusIndicator} ${styles.reachable}`}></div>
                  <span>Currently Reachable</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.statusIndicator} ${styles.unreachable}`}></div>
                  <span>Currently Unreachable</span>
                </div>
              </div>
            </div>
            
            <div className={styles.legend}>
              <div className={styles.legendTitle}>Historical Status:</div>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <CheckCircle style={{ color: '#10b981' }} />
                  <span>Reachable</span>
                </div>
                <div className={styles.legendItem}>
                  <XCircle style={{ color: '#ef4444' }} />
                  <span>Unreachable</span>
                </div>
                <div className={styles.legendItem}>
                  <TrendingUp style={{ color: '#10b981' }} />
                  <span>Came Back</span>
                </div>
                <div className={styles.legendItem}>
                  <TrendingDown style={{ color: '#ef4444' }} />
                  <span>Went Down</span>
                </div>
              </div>
            </div>
            
            {/* <div className={styles.severityLegend}>
              <div className={styles.legendTitle}>VM Health:</div>
              <div className={styles.legendItems}>
                <div className={styles.legendItem}>
                  <div className={styles.severityIndicator} style={{ background: '#10b981' }}></div>
                  <span>Healthy</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.severityIndicator} style={{ background: '#f59e0b' }}></div>
                  <span>Warning (&lt;1 day)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.severityIndicator} style={{ background: '#ef4444' }}></div>
                  <span>Sensitive (1-3 days)</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.severityIndicator} style={{ background: '#7c2d12' }}></div>
                  <span>Hazardous (&gt;3 days)</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Compact Grid Table */}
      <div className={styles.gridContainer}>
        <div className={styles.gridTable}>
          {/* Header Row */}
          <div className={styles.gridHeader}>
            <div className={styles.vmNameHeader}>
              <Server className={styles.headerIcon} />
              VM Details
            </div>
            {hours.map(hour => (
              <div key={hour} className={styles.hourHeader}>
                <Clock className={styles.hourIcon} />
                <span className={styles.hourText}>{hour.replace(':00', '')}</span>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          <div className={styles.gridBody}>
            {Object.entries(gridData)
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map(([vmKey, vmData]) => {
              const severity = getVMSeverity(vmData);
              return (
                <div key={vmKey} className={styles.gridRow}>
                  <div 
                    className={styles.vmNameCell}
                    style={{ borderLeft: `3px solid ${getSeverityColor(severity)}` }}
                  >
                    <div className={styles.vmInfo}>
                      <div className={styles.vmIconContainer}>
                        <Server 
                          className={styles.vmIcon} 
                          style={{ color: getSeverityColor(severity) }}
                        />
                        {vmData.project && vmData.project !== 'N/A' && (
                          <div className={styles.projectTooltip}>
                            <FolderOpen className={styles.projectIcon} />
                            Project: {vmData.project}
                          </div>
                        )}
                      </div>
                      <div className={styles.vmDetails}>
                        <div className={styles.vmNameRow}>
                          <RealtimeStatusIndicator ip={vmData.ip} vmName={vmData.vm_name} />
                          <span className={styles.vmName}>{vmData.vm_name}</span>
                        </div>
                        <span className={styles.vmIp}>{vmData.ip}</span>
                      </div>
                    </div>
                  </div>
                  
                  {hours.map(hour => (
                    <div key={hour} className={styles.statusCell}>
                      {vmData.hourlyData[hour] && vmData.hourlyData[hour].length > 0 
                        ? getStatusIcon(vmData.hourlyData[hour])
                        : getVMStatusIcon(vmData)
                      }
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>


{/* Pagination Controls */}
      {Object.keys(gridData).length > 0 && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationInfo}>
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, Object.keys(gridData).length)} to {Math.min(currentPage * itemsPerPage, Object.keys(gridData).length)} of {Object.keys(gridData).length} VMs
          </div>

          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              Previous
            </button>

            <div className={styles.pageNumbers}>
              {Array.from(
                { length: Math.ceil(Object.keys(gridData).length / itemsPerPage) },
                (_, i) => i + 1
              ).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`${styles.pageNumber} ${currentPage === page ? styles.activePage : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(Object.keys(gridData).length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(Object.keys(gridData).length / itemsPerPage)}
              className={styles.paginationButton}
            >
              Next
            </button>
          </div>

          <div className={styles.itemsPerPageSelector}>
            <label>Items per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={styles.itemsPerPageSelect}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      
      {/* Detail Modal */}
      {selectedModal && (
        <div className={styles.modalOverlay} onClick={() => setSelectedModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>VM Status Details</h3>
              <button 
                onClick={() => setSelectedModal(null)}
                className={styles.closeButton}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.modalSection}>
                <h4>Basic Information</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <Server className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>VM Name</span>
                      <span className={styles.infoValue}>{selectedModal.vm_name}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <MapPin className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>IP Address</span>
                      <span className={styles.infoValue}>{selectedModal.ip}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Info className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Current Status</span>
                      <span className={`${styles.infoValue} ${selectedModal.current_status === 'reachable' ? styles.success : styles.error}`}>
                        {selectedModal.current_status}
                      </span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <Clock className={styles.infoIcon} />
                    <div>
                      <span className={styles.infoLabel}>Check Time</span>
                      <span className={styles.infoValue}>
                        {new Date(selectedModal.current_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedModal.project && selectedModal.project !== 'N/A' && (
                <div className={styles.modalSection}>
                  <h4>Project Information</h4>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <FileText className={styles.infoIcon} />
                      <div>
                        <span className={styles.infoLabel}>Project</span>
                        <span className={styles.infoValue}>{selectedModal.project}</span>
                      </div>
                    </div>
                    {selectedModal.cluster && selectedModal.cluster !== 'N/A' && (
                      <div className={styles.infoItem}>
                        <Server className={styles.infoIcon} />
                        <div>
                          <span className={styles.infoLabel}>Cluster</span>
                          <span className={styles.infoValue}>{selectedModal.cluster}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedModal.current_status === 'not reachable' && (
                <div className={styles.modalSection}>
                  <h4>Unreachable Information</h4>
                  <div className={styles.infoGrid}>
                    {getLastReachableTime(selectedModal) && (
                      <div className={styles.infoItem}>
                        <Clock className={styles.infoIcon} />
                        <div>
                          <span className={styles.infoLabel}>Last Reachable</span>
                          <span className={styles.infoValue}>
                            {new Date(getLastReachableTime(selectedModal)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={styles.infoItem}>
                      <AlertTriangle className={styles.infoIcon} />
                      <div>
                        <span className={styles.infoLabel}>Severity</span>
                        <span 
                          className={styles.infoValue}
                          style={{ color: getSeverityColor(getVMSeverity(selectedModal)) }}
                        >
                          {getVMSeverity(selectedModal).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Find corresponding VM data for metrics */}
              {(() => {
                const vmMetrics = vms.find(vm => vm.ip === selectedModal.ip);
                return vmMetrics && vmMetrics.status === 'reachable' && (
                  <div className={styles.modalSection}>
                    <h4>System Metrics</h4>
                    <div className={styles.metricsGrid}>
                      <div className={styles.metricCard}>
                        <Cpu className={styles.metricIcon} />
                        <div className={styles.metricContent}>
                          <span className={styles.metricLabel}>CPU Usage</span>
                          <div className={styles.metricBar}>
                            <div 
                              className={styles.metricFill}
                              style={{ width: `${vmMetrics.cpu_utilization}%` }}
                            />
                          </div>
                          <span className={styles.metricValue}>{vmMetrics.cpu_utilization}%</span>
                        </div>
                      </div>

                      <div className={styles.metricCard}>
                        <MemoryStick className={styles.metricIcon} />
                        <div className={styles.metricContent}>
                          <span className={styles.metricLabel}>Memory Usage</span>
                          <div className={styles.metricBar}>
                            <div 
                              className={styles.metricFill}
                              style={{ width: `${vmMetrics.memory_utilization}%` }}
                            />
                          </div>
                          <span className={styles.metricValue}>{vmMetrics.memory_utilization}%</span>
                        </div>
                      </div>

                      <div className={styles.metricCard}>
                        <HardDrive className={styles.metricIcon} />
                        <div className={styles.metricContent}>
                          <span className={styles.metricLabel}>Disk Usage</span>
                          <span className={styles.diskValue}>{formatDiskUsage(vmMetrics.disk_utilization)}</span>
                        </div>
                      </div>

                      <div className={styles.infoItem}>
                        <Info className={styles.infoIcon} />
                        <div>
                          <span className={styles.infoLabel}>Operating System</span>
                          <span className={styles.infoValue}>{vmMetrics.os}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringGrid;