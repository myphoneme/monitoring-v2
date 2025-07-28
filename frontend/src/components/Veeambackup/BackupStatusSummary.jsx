import React, { useState } from 'react'
import styles from './BackupStatusSummary.module.css'

function BackupStatusSummary({ data, selectedMonth, formatMonth }) {
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  // Function to find the latest backup date across all months for a VM
  const getLatestBackupDate = (vmUniqueName, groupName) => {
    let latestDate = null
    let latestType = null
    
    // Search through all months in the data
    Object.entries(data).forEach(([month, monthData]) => {
      if (monthData[groupName]) {
        const vm = monthData[groupName].find(v => v.uniqueName === vmUniqueName)
        if (vm) {
          Object.entries(vm.dates).forEach(([day, dayData]) => {
            if (dayData.full_backup || dayData.incremental_backup) {
              const backupDate = new Date(month + '-' + String(day).padStart(2, '0'))
              if (!latestDate || backupDate > latestDate) {
                latestDate = backupDate
                latestType = dayData.full_backup ? 'Full' : 'Incremental'
              }
            }
          })
        }
      }
    })
    
    return { latestDate, latestType }
  }

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const getBackupStatus = () => {
    if (!selectedMonth || !data[selectedMonth]) {
      return { workingByGroup: {}, stoppedByGroup: {} }
    }

    const workingByGroup = {}
    const stoppedByGroup = {}
    const currentDate = new Date()
    const threeDaysAgo = new Date(currentDate.getTime() - (3 * 24 * 60 * 60 * 1000))

    Object.entries(data[selectedMonth]).forEach(([groupName, vms]) => {
      vms.forEach(vm => {
        const vmDates = Object.keys(vm.dates)
        let hasRecentBackup = false
        let lastBackupDate = null
        let lastBackupType = null

        // Check if VM has backup in last 3 days
        Object.entries(vm.dates).forEach(([day, dayData]) => {
          const backupDate = new Date(selectedMonth + '-' + String(day).padStart(2, '0'))
          
          // Update last backup info (only for full/incremental, not metadata)
          if (dayData.full_backup || dayData.incremental_backup) {
            if (!lastBackupDate || backupDate > lastBackupDate) {
              lastBackupDate = backupDate
              lastBackupType = dayData.full_backup ? 'Full' : 'Incremental'
            }
            
            // Check if it's recent
            if (backupDate >= threeDaysAgo && backupDate <= currentDate) {
              hasRecentBackup = true
            }
          }
        })

        const vmInfo = {
          uniqueName: vm.uniqueName,
          groupName: groupName,
          lastBackupDate: lastBackupDate,
          lastBackupType: lastBackupType,
          totalBackups: vmDates.length,
          hasFullBackup: Object.values(vm.dates).some(d => d.full_backup),
          hasIncrementalBackup: Object.values(vm.dates).some(d => d.incremental_backup),
          hasMetadata: Object.values(vm.dates).some(d => d.metadata)
        }

        if (hasRecentBackup) {
          if (!workingByGroup[groupName]) {
            workingByGroup[groupName] = []
          }
          workingByGroup[groupName].push(vmInfo)
        } else {
          if (!stoppedByGroup[groupName]) {
            stoppedByGroup[groupName] = []
          }
          
          // Get the latest backup date from all available data
          const { latestDate, latestType } = getLatestBackupDate(vm.uniqueName, groupName)
          
          stoppedByGroup[groupName].push({
            ...vmInfo,
            lastBackupDate: latestDate,
            lastBackupType: latestType
          })
        }
      })
    })

    return { workingByGroup, stoppedByGroup }
  }

  const { workingByGroup, stoppedByGroup } = getBackupStatus()
  const totalWorking = Object.values(workingByGroup).reduce((sum, vms) => sum + vms.length, 0)
  const totalStopped = Object.values(stoppedByGroup).reduce((sum, vms) => sum + vms.length, 0)

  const formatDate = (date) => {
    if (!date) return 'Never'
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusIcon = (vm) => {
    if (vm.hasFullBackup && vm.hasIncrementalBackup) return '🟢'
    if (vm.hasFullBackup) return '🔵'
    if (vm.hasIncrementalBackup) return '🟡'
    return '🔴'
  }

  const renderGroupCard = (groupName, vms, isWorking) => {
    const isExpanded = expandedGroups.has(groupName)
    const statusColor = isWorking ? 'success' : 'error'
    
    return (
      <div key={groupName} className={`${styles.groupCard} ${styles[statusColor]}`}>
        <div 
          className={styles.groupCardHeader}
          onClick={() => toggleGroup(groupName)}
        >
          <div className={styles.groupInfo}>
            <div className={styles.groupIcon}>
              <span className={styles.folderIcon}>📁</span>
            </div>
            <div className={styles.groupDetails}>
              <h4 className={styles.groupName}>{groupName}</h4>
              <span className={styles.groupCount}>{vms.length} Virtual Machines</span>
            </div>
          </div>
          <div className={styles.groupActions}>
            <div className={styles.statusIndicator}>
              <span className={`${styles.statusDot} ${styles[statusColor]}`}></span>
              <span className={styles.statusText}>
                {isWorking ? 'Active' : 'Stopped'}
              </span>
            </div>
            <button className={styles.expandButton}>
              <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className={styles.vmList}>
            {vms.map((vm, index) => (
              <div key={`${vm.groupName}-${vm.uniqueName}-${index}`} className={styles.vmCard}>
                <div className={styles.vmHeader}>
                  <div className={styles.vmInfo}>
                    <span className={styles.vmStatusIcon}>{getStatusIcon(vm)}</span>
                    <div className={styles.vmDetails}>
                      <span className={styles.vmName}>{vm.uniqueName}</span>
                      <span className={styles.vmLastBackup}>
                        Last backup: {formatDate(vm.lastBackupDate)} {vm.lastBackupType && `(${vm.lastBackupType})`}
                      </span>
                    </div>
                  </div>
                  <div className={styles.vmStats}>
                    <div className={styles.backupTypeIndicators}>
                      {vm.hasFullBackup && (
                        <span className={`${styles.backupType} ${styles.full}`} title="Full Backup">
                          F
                        </span>
                      )}
                      {vm.hasIncrementalBackup && (
                        <span className={`${styles.backupType} ${styles.incremental}`} title="Incremental Backup">
                          I
                        </span>
                      )}
                      {vm.hasMetadata && (
                        <span className={`${styles.backupType} ${styles.metadata}`} title="Metadata">
                          M
                        </span>
                      )}
                    </div>
                    <div className={styles.totalBackups}>
                      <span className={styles.backupCount}>{vm.totalBackups}</span>
                      <span className={styles.backupLabel}>backups</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Backup Status Overview</h1>
          <p className={styles.subtitle}>{formatMonth(selectedMonth)}</p>
        </div>
        <div className={styles.summaryStats}>
          <div className={`${styles.statCard} ${styles.success}`}>
            <div className={styles.statNumber}>{totalWorking}</div>
            <div className={styles.statLabel}>Working</div>
          </div>
          <div className={`${styles.statCard} ${styles.error}`}>
            <div className={styles.statNumber}>{totalStopped}</div>
            <div className={styles.statLabel}>Stopped</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.statusTable}>
          <thead>
            <tr>
              <th className={styles.workingHeader}>
                <span className={styles.headerIcon}>✅</span>
                Working Backups ({totalWorking})
              </th>
              <th className={styles.issuesHeader}>
                <span className={styles.headerIcon}>⚠️</span>
                Stopped Backups ({totalStopped})
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.workingColumn}>
                {Object.keys(workingByGroup).length > 0 ? (
                  Object.entries(workingByGroup).map(([groupName, vms]) => 
                    renderGroupCard(groupName, vms, true)
                  )
                ) : (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <span className={styles.emptyText}>No active backups</span>
                  </div>
                )}
              </td>
              <td className={styles.issuesColumn}>
                {Object.keys(stoppedByGroup).length > 0 ? (
                  Object.entries(stoppedByGroup).map(([groupName, vms]) => 
                    renderGroupCard(groupName, vms, false)
                  )
                ) : (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🎉</span>
                    <span className={styles.emptyText}>All backups working!</span>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BackupStatusSummary