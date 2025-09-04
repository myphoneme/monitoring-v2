import React from 'react';
import MonitoringGrid from './MonitoringGrid';
import VMMaster from './VMMaster';
import VMStatus from './VMStatus';
import PingStatus from './UnreachableVMs';

const Router = ({ 
  activeTab, 
  dashboardData, 
  vmStatusData, 
  onRefreshDashboard, 
  onRefreshVMStatus 
}) => {
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <MonitoringGrid 
            dashboardData={dashboardData}
            vmStatusData={vmStatusData}
            onRefresh={onRefreshDashboard}
          />
        );
      case 'vm-master':
        return <VMMaster />;
      case 'vm-status':
        return (
          <VMStatus 
            vmStatusData={vmStatusData}
            onRefresh={onRefreshVMStatus}
          />
        );
      case 'unreachable-vms':
        return <PingStatus />;
      default:
        return (
          <MonitoringGrid 
            dashboardData={dashboardData}
            vmStatusData={vmStatusData}
            onRefresh={onRefreshDashboard}
          />
        );
    }
  };

  return renderActiveComponent();
};

export default Router;