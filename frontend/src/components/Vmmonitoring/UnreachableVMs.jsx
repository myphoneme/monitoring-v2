import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, ChevronUp, FolderOpen, Play, Loader, Filter } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import styles from '../../styles/UnreachableVMs.module.css';

const PingStatus = ({ pingStatusData, onRefresh }) => {
  const { vms, loading, error, lastUpdated } = pingStatusData;
  
  const [filteredVMs, setFilteredVMs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availableProjects, setAvailableProjects] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualChecking, setManualChecking] = useState(false);
  const [manualResult, setManualResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(8); // Reduced page size for better screen fit
  const [pageTransition, setPageTransition] = useState('');

  // Set up available projects when vms data changes
  useEffect(() => {
    if (vms.length > 0) {
      const projects = [...new Set(vms.map(vm => vm.project_name).filter(p => p && p !== 'N/A'))];
      setAvailableProjects(projects.sort());
    }
  }, [vms]);

  // Filter VMs based on search and project
  useEffect(() => {
    let filtered = vms;

    if (searchTerm) {
      filtered = vms.filter(vm => 
        vm.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.vm_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(vm => vm.project_name === projectFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'reachable') {
        filtered = filtered.filter(vm => vm.pingChecked && vm.pingStatus);
      } else if (statusFilter === 'unreachable') {
        filtered = filtered.filter(vm => vm.pingChecked && !vm.pingStatus);
      } else if (statusFilter === 'failed') {
        filtered = filtered.filter(vm => !vm.pingChecked);
      }
    }

    setFilteredVMs(filtered);
    setCurrentPage(0); // Reset to first page when filtering
  }, [vms, searchTerm, projectFilter, statusFilter]);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkManualIP = async () => {
    if (!manualIp.trim()) return;
    
    try {
      setManualChecking(true);
      setManualResult(null);
      
      const response = await fetch('https://fastapi.phoneme.in/ping-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip: manualIp.trim() }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setManualResult({
          ip: result.ip,
          reachable: result.reachable,
          error: null
        });
      } else {
        setManualResult({
          ip: manualIp.trim(),
          reachable: false,
          error: 'Failed to check ping status'
        });
      }
    } catch (error) {
      setManualResult({
        ip: manualIp.trim(),
        reachable: false,
        error: error.message
      });
    } finally {
      setManualChecking(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handlePageClick = (event) => {
    const newPage = event.selected;
    
    // Add slide-out animation
    setPageTransition('slide-out');
    
    setTimeout(() => {
      setCurrentPage(newPage);
      setPageTransition('slide-in');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        setPageTransition('');
      }, 300);
    }, 150);
  };

  const getPingStatusIcon = (vm) => {
    if (!vm.pingChecked) {
      return <AlertCircle className={styles.statusIcon} style={{ color: '#f59e0b' }} />;
    }
    return vm.pingStatus 
      ? <CheckCircle className={styles.statusIcon} style={{ color: '#10b981' }} />
      : <XCircle className={styles.statusIcon} style={{ color: '#ef4444' }} />;
  };

  const getPingStatusText = (vm) => {
    if (!vm.pingChecked) {
      return vm.pingError || 'Check Failed';
    }
    return vm.pingStatus ? 'Reachable' : 'Unreachable';
  };

  const getPingStatusClass = (vm) => {
    if (!vm.pingChecked) return styles.warning;
    return vm.pingStatus ? styles.success : styles.error;
  };

  const getStats = () => {
    const total = vms.length;
    const reachable = vms.filter(vm => vm.pingChecked && vm.pingStatus).length;
    const unreachable = vms.filter(vm => vm.pingChecked && !vm.pingStatus).length;
    const failed = vms.filter(vm => !vm.pingChecked).length;
    
    return { total, reachable, unreachable, failed };
  };

  const stats = getStats();
  
  // Pagination logic
  const offset = currentPage * pageSize;
  const currentPageData = filteredVMs.slice(offset, offset + pageSize);
  const pageCount = Math.ceil(filteredVMs.length / pageSize);

  return (
    <div className={styles.unreachableVMs}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Ping Status Monitor</h2>
          <p className={styles.subtitle}>Real-time ping status monitoring for all virtual machines</p>
        </div>
      </div>

      {/* Compact Control Panel */}
      <div className={styles.controlPanel}>
        {/* Stats and Controls Row */}
        <div className={styles.statsControlsRow}>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total</div>
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
            <div className={`${styles.statCard} ${styles.warning}`}>
              <AlertCircle className={styles.statIcon} />
              <div className={styles.statValue}>{stats.failed}</div>
              <div className={styles.statLabel}>Failed</div>
            </div>
          </div>
          
          <div className={styles.primaryControls}>
            <button 
              onClick={onRefresh} 
              className={styles.refreshButton}
              disabled={loading}
            >
              <RefreshCw className={loading ? styles.spinning : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters and Manual Check Row */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <div className={styles.filterContainer}>
              <Filter className={styles.filterIcon} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="reachable">Reachable</option>
                <option value="unreachable">Unreachable</option>
                <option value="failed">Check Failed</option>
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
            
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search VM or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
          
          {/* Compact Manual IP Check */}
          <div className={styles.manualCheckCompact}>
            <input
              type="text"
              placeholder="Check IP manually..."
              value={manualIp}
              onChange={(e) => setManualIp(e.target.value)}
              className={styles.manualIpInput}
              onKeyPress={(e) => e.key === 'Enter' && checkManualIP()}
            />
            <button 
              onClick={checkManualIP}
              className={styles.checkButton}
              disabled={manualChecking || !manualIp.trim()}
              title="Check IP Status"
            >
              {manualChecking ? <Loader className={styles.spinning} /> : <Play />}
            </button>
          </div>
        </div>
        
        {/* Manual Result */}
        {manualResult && (
          <div className={`${styles.manualResultCompact} ${manualResult.reachable ? styles.success : styles.error}`}>
            <div className={styles.resultIcon}>
              {manualResult.reachable 
                ? <CheckCircle style={{ color: '#10b981' }} />
                : <XCircle style={{ color: '#ef4444' }} />
              }
            </div>
            <span className={styles.resultText}>
              {manualResult.ip}: {manualResult.error || (manualResult.reachable ? 'Reachable' : 'Unreachable')}
            </span>
          </div>
        )}
        
        {lastUpdated && (
          <div className={styles.lastUpdatedCompact}>
            <Clock className={styles.timeIcon} />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer}>
          <AlertCircle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      )}

      {/* Main Content Container */}
      <div className={styles.mainContentContainer}>
        {/* Compact Table */}
        {loading && vms.length === 0 ? (
          <div className={styles.loadingContainer}>
            <RefreshCw className={`${styles.loadingIcon} ${styles.spinning}`} />
            <p>Loading and checking ping status for all VMs...</p>
          </div>
        ) : filteredVMs.length === 0 && !loading ? (
          <div className={styles.noData}>
            <AlertCircle className={styles.noDataIcon} />
            <p>No VMs found matching your criteria</p>
          </div>
        ) : (
          <>
            {/* Loading overlay for refresh */}
            {loading && vms.length > 0 && (
              <div className={styles.refreshOverlay}>
                <div className={styles.refreshIndicator}>
                  <RefreshCw className={`${styles.refreshIcon} ${styles.spinning}`} />
                  <span>Refreshing ping status...</span>
                </div>
              </div>
            )}
            
            <div className={styles.compactTableContainer}>
              <div className={`${styles.tableWrapper} ${pageTransition ? styles[pageTransition] : ''}`}>
                <table className={styles.compactTable}>
                  <thead>
                    <tr>
                      <th>VM Name</th>
                      <th>IP Address</th>
                      <th>Project</th>
                      <th>Ping Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageData.map(vm => (
                      <tr key={vm.id} className={styles.compactTableRow}>
                        <td className={styles.vmName}>{vm.vm_name}</td>
                        <td className={styles.ip}>{vm.ip}</td>
                        <td>{vm.project_name || 'N/A'}</td>
                        <td className={styles.compactStatusCell}>
                          <div className={`${styles.compactStatusBadge} ${getPingStatusClass(vm)}`}>
                            {getPingStatusIcon(vm)}
                            <span>{getPingStatusText(vm)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredVMs.length === 0 && (
                <div className={styles.noData}>
                  <AlertCircle className={styles.noDataIcon} />
                  <p>No VMs found matching your search criteria</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modern Pagination - Now part of main content */}
        {pageCount > 1 && !loading && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              Showing {offset + 1}-{Math.min(offset + pageSize, filteredVMs.length)} of {filteredVMs.length} VMs
            </div>
            <ReactPaginate
              previousLabel="← Previous"
              nextLabel="Next →"
              breakLabel="..."
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={styles.pagination}
              activeClassName={styles.active}
              previousClassName={styles.previous}
              nextClassName={styles.next}
              disabledClassName={styles.disabled}
              breakClassName={styles.break}
              forcePage={currentPage}
            />
          </div>
        )}
      </div>

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

export default PingStatus;