import React from 'react';
import { Server, Cpu, HardDrive, MemoryStick, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import styles from '../../styles/VMCard.module.css';

const VMCard = ({ vm }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'reachable':
        return <CheckCircle className={`${styles.statusIcon} ${styles.success}`} />;
      case 'not reachable':
        return <XCircle className={`${styles.statusIcon} ${styles.error}`} />;
      default:
        return <AlertCircle className={`${styles.statusIcon} ${styles.warning}`} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'reachable':
        return styles.success;
      case 'not reachable':
        return styles.error;
      default:
        return styles.warning;
    }
  };

  const formatDiskUsage = (diskData) => {
    try {
      const disks = typeof diskData === 'string' ? JSON.parse(diskData) : diskData;
      if (Object.keys(disks).length === 0) return 'N/A';
      
      const diskInfo = Object.entries(disks).map(([drive, usage]) => 
        `${drive}: ${usage}%`
      ).join(', ');
      
      return diskInfo;
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`${styles.vmCard} ${getStatusClass(vm.status)}`}>
      <div className={styles.cardHeader}>
        <div className={styles.vmName}>
          <Server className={styles.vmIcon} />
          <h4>{vm.vm_master?.vm_name || 'Unknown VM'}</h4>
        </div>
        <div className={styles.status}>
          {getStatusIcon(vm.status)}
          <span className={styles.statusText}>{vm.status}</span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.vmInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>IP Address:</span>
            <span className={styles.value}>{vm.ip}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>OS:</span>
            <span className={styles.value}>{vm.os}</span>
          </div>
          {vm.vm_master?.cluster && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Cluster:</span>
              <span className={styles.value}>{vm.vm_master.cluster}</span>
            </div>
          )}
        </div>

        {vm.status === 'reachable' && (
          <div className={styles.metricsContainer}>
            <div className={styles.metric}>
              <Cpu className={styles.metricIcon} />
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>CPU</span>
                <div className={styles.metricBar}>
                  <div 
                    className={styles.metricFill}
                    style={{ width: `${vm.cpu_utilization}%` }}
                  />
                </div>
                <span className={styles.metricValue}>{vm.cpu_utilization}%</span>
              </div>
            </div>

            <div className={styles.metric}>
              <MemoryStick className={styles.metricIcon} />
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Memory</span>
                <div className={styles.metricBar}>
                  <div 
                    className={styles.metricFill}
                    style={{ width: `${vm.memory_utilization}%` }}
                  />
                </div>
                <span className={styles.metricValue}>{vm.memory_utilization}%</span>
              </div>
            </div>

            <div className={styles.metric}>
              <HardDrive className={styles.metricIcon} />
              <div className={styles.metricContent}>
                <span className={styles.metricLabel}>Disk</span>
                <span className={styles.diskValue}>{formatDiskUsage(vm.disk_utilization)}</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.timestamp}>
            Last check: {formatDate(vm.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VMCard;