import React, { useState, useEffect } from 'react';
import Header from './Header';
import MonitoringGrid from './MonitoringGrid';
import VMMaster from './VMMaster';
import VMStatus from './VMStatus';
import PingStatus from './UnreachableVMs';
import { fetchVMData } from '../../services/api';
import styles from '../../styles/App.module.css';

const VmMonitor = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Shared state for Dashboard
  const [dashboardData, setDashboardData] = useState({
    vms: [],
    loading: false,
    error: null,
    lastUpdated: null,
    initialLoad: true
  });

  // Shared state for VM Status
  const [vmStatusData, setVmStatusData] = useState({
    allStatusData: [],
    loading: false,
    initialLoad: true
  });

  // Shared state for Ping Status
  const [pingStatusData, setPingStatusData] = useState({
    vms: [],
    loading: false,
    error: null,
    lastUpdated: null,
    initialLoad: true
  });

  // Load initial data when app starts
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const promises = [];
    
    // Load Dashboard data
    if (dashboardData.initialLoad) {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      promises.push(
        fetchVMData()
          .then(data => {
            const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setDashboardData(prev => ({
              ...prev,
              vms: sortedData,
              loading: false,
              lastUpdated: new Date(),
              initialLoad: false
            }));
          })
          .catch(err => {
            setDashboardData(prev => ({
              ...prev,
              error: 'Failed to fetch VM data',
              loading: false,
              initialLoad: false
            }));
          })
      );
    }

    // Load VM Status data
    if (vmStatusData.initialLoad) {
      setVmStatusData(prev => ({ ...prev, loading: true }));
      promises.push(
        fetchVMData()
          .then(data => {
            const processedData = processStatusHistory(data);
            setVmStatusData(prev => ({
              ...prev,
              allStatusData: processedData,
              loading: false,
              initialLoad: false
            }));
          })
          .catch(error => {
            console.error('Error fetching status data:', error);
            setVmStatusData(prev => ({
              ...prev,
              loading: false,
              initialLoad: false
            }));
          })
      );
    }

    // Load Ping Status data
    if (pingStatusData.initialLoad) {
      setPingStatusData(prev => ({ ...prev, loading: true, error: null }));
      promises.push(
        loadPingStatusData()
          .then(data => {
            setPingStatusData(prev => ({
              ...prev,
              vms: data,
              loading: false,
              lastUpdated: new Date(),
              initialLoad: false
            }));
          })
          .catch(err => {
            setPingStatusData(prev => ({
              ...prev,
              error: 'Failed to fetch ping status data',
              loading: false,
              initialLoad: false
            }));
          })
      );
    }

    // Execute all promises concurrently for better performance
    await Promise.allSettled(promises);
  };

  const loadPingStatusData = async () => {
    const { fetchVMMasterData } = await import('../../services/api');
    const masterData = await fetchVMMasterData();
    
    // Check ping status for each VM
    const vmDataWithPing = await Promise.all(
      masterData.map(async (vm) => {
        try {
          const pingResponse = await fetch('https://fastapi.phoneme.in/ping-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ip: vm.ip }),
          });
          
          if (pingResponse.ok) {
            const pingResult = await pingResponse.json();
            return {
              ...vm,
              pingStatus: pingResult.reachable,
              pingChecked: true,
              pingError: null
            };
          } else {
            return {
              ...vm,
              pingStatus: false,
              pingChecked: false,
              pingError: 'Failed to check ping'
            };
          }
        } catch (error) {
          return {
            ...vm,
            pingStatus: false,
            pingChecked: false,
            pingError: error.message
          };
        }
      })
    );

    return vmDataWithPing;
  };

  const processStatusHistory = (data) => {
    const groupedByIP = {};
    
    data.forEach(vm => {
      const ip = vm.ip;
      if (!groupedByIP[ip]) {
        groupedByIP[ip] = [];
      }
      groupedByIP[ip].push(vm);
    });

    const processedData = [];
    
    Object.entries(groupedByIP).forEach(([ip, records]) => {
      const sortedRecords = records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      sortedRecords.forEach((current, index) => {
        const previous = sortedRecords[index + 1];
        const statusChange = determineStatusChange(current.status, previous?.status);
        
        processedData.push({
          ip,
          vm_name: current.vm_master?.vm_name || 'Unknown VM',
          current_status: current.status,
          previous_status: previous?.status || 'unknown',
          status_change: statusChange,
          current_time: current.created_at,
          previous_time: previous?.created_at,
          project: current.vm_master?.project_name || 'N/A',
          cluster: current.vm_master?.cluster || 'N/A'
        });
      });
    });

    return processedData.sort((a, b) => new Date(b.current_time) - new Date(a.current_time));
  };

  const determineStatusChange = (currentStatus, previousStatus) => {
    if (!previousStatus) return 'new';
    
    if (currentStatus === previousStatus) {
      return currentStatus === 'reachable' ? 'no change' : 'still down';
    }
    
    if (currentStatus === 'reachable' && previousStatus === 'not reachable') {
      return 'came back';
    }
    
    if (currentStatus === 'not reachable' && previousStatus === 'reachable') {
      return 'went down';
    }
    
    return 'changed';
  };

  // Refresh functions
  const refreshDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchVMData();
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDashboardData(prev => ({
        ...prev,
        vms: sortedData,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (err) {
      setDashboardData(prev => ({
        ...prev,
        error: 'Failed to fetch VM data',
        loading: false
      }));
    }
  };

  const refreshVMStatusData = async () => {
    setVmStatusData(prev => ({ ...prev, loading: true }));
    try {
      const data = await fetchVMData();
      const processedData = processStatusHistory(data);
      setVmStatusData(prev => ({
        ...prev,
        allStatusData: processedData,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching status data:', error);
      setVmStatusData(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const refreshPingStatusData = async () => {
    setPingStatusData(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await loadPingStatusData();
      setPingStatusData(prev => ({
        ...prev,
        vms: data,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (err) {
      setPingStatusData(prev => ({
        ...prev,
        error: 'Failed to fetch ping status data',
        loading: false
      }));
    }
  };

  // Optimized refresh function that runs both refreshes concurrently
  const refreshAllData = async () => {
    await Promise.allSettled([
      refreshDashboardData(),
      refreshVMStatusData(),
      refreshPingStatusData()
    ]);
  };

  // Render active component based on tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <MonitoringGrid 
            dashboardData={dashboardData}
            vmStatusData={vmStatusData}
            onRefresh={refreshAllData}
          />
        );
      case 'vm-master':
        return <VMMaster />;
      case 'vm-status':
        return (
          <VMStatus 
            vmStatusData={vmStatusData}
            onRefresh={refreshVMStatusData}
          />
        );
      case 'unreachable-vms':
        return (
          <PingStatus 
            pingStatusData={pingStatusData}
            onRefresh={refreshPingStatusData}
          />
        );
      default:
        return (
          <MonitoringGrid 
            dashboardData={dashboardData}
            vmStatusData={vmStatusData}
            onRefresh={refreshAllData}
          />
        );
    }
  };

  return (
    <div className={styles.app}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className={styles.main}>
        {renderActiveComponent()}
      </main>
    </div>
  );
};

export default VmMonitor;