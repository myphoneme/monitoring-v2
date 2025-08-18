import React, { useState } from 'react'
import styles from './TabularView.module.css'
import fullBackupIcon from '../../assets/icons/full-backup.png'
import incrementalBackupIcon from '../../assets/icons/incremental-backup.png'
import metadataIcon from '../../assets/icons/metadata.png'
import noBackupIcon from '../../assets/icons/no-backup.svg'
import noDataIcon from '../../assets/icons/no-data.png'

function TabularView({ data, selectedMonth, formatMonth, stats }) {
  const [collapsedGroups, setCollapsedGroups] = useState(new Set(Object.keys(data)))

  // Generate all days 1-31 for the month
  const getAllDaysInMonth = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1)
  }

  const toggleGroup = (groupName) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName)
    } else {
      newCollapsed.add(groupName)
    }
    setCollapsedGroups(newCollapsed)
  }

  const getGroupStats = (vms, selectedMonth) => {
    let totalVMs = vms.length
    let incrementalCount = 0
    let fullCount = 0
    let metadataCount = 0
    let failedCount = 0

    const currentDate = new Date()
    const threeDaysAgo = new Date(currentDate.getTime() - (3 * 24 * 60 * 60 * 1000))

    vms.forEach(vm => {
      let hasIncremental = false
      let hasFull = false
      let hasMetadata = false
      let hasRecentBackup = false
      let lastBackupDate = null
      let lastBackupType = null

      Object.entries(vm.dates).forEach(([day, dayData]) => {
        const backupDate = new Date(selectedMonth + '-' + String(day).padStart(2, '0'))
        
        if (dayData.incremental_backup) {
          hasIncremental = true
          if (backupDate >= threeDaysAgo && backupDate <= currentDate) {
            hasRecentBackup = true
          }
          if (!lastBackupDate || backupDate > lastBackupDate) {
            lastBackupDate = backupDate
            lastBackupType = 'incremental'
          }
        }
        if (dayData.full_backup) {
          hasFull = true
          if (backupDate >= threeDaysAgo && backupDate <= currentDate) {
            hasRecentBackup = true
          }
          if (!lastBackupDate || backupDate > lastBackupDate) {
            lastBackupDate = backupDate
            lastBackupType = 'full'
          }
        }
        if (dayData.metadata) {
          hasMetadata = true
          if (!lastBackupDate || backupDate > lastBackupDate) {
            lastBackupDate = backupDate
            lastBackupType = 'metadata'
          }
        }
      })

      // Check if backup failed (has metadata but no recent full/incremental)
      if (hasMetadata && !hasRecentBackup) {
        failedCount++
      }

      if (hasIncremental) incrementalCount++
      if (hasFull) fullCount++
      if (hasMetadata) metadataCount++
    })

    return { totalVMs, incrementalCount, fullCount, metadataCount, failedCount }
  }

  const getCombinedIcon = (dayData) => {
    if (!dayData) return <img src={noDataIcon} alt="No data" className={styles.dayIcon} />
    
    let icons = []
    if (dayData.full_backup) icons.push(<img key="full" src={fullBackupIcon} alt="Full backup" className={styles.dayIcon} />)
    if (dayData.incremental_backup) icons.push(<img key="incremental" src={incrementalBackupIcon} alt="Incremental backup" className={styles.dayIcon} />)
    if (dayData.metadata) icons.push(<img key="metadata" src={metadataIcon} alt="Metadata" className={styles.dayIcon} />)
    
    if (icons.length === 0) return <img src={noBackupIcon} alt="No backup" className={styles.dayIcon} />
    return <div className={styles.iconGroup}>{icons}</div>
  }

  const allDays = getAllDaysInMonth()

  return (
    <div className={styles.tabularView}>
      <div className={styles.monthHeader}>
        <h2 className={styles.monthTitle}>📅 {formatMonth(selectedMonth)}</h2>
        <div className={styles.quickStats}>
          <span className={styles.statItem}>📁 {stats.totalGroups} Groups</span>
          <span className={styles.statItem}>💻 {stats.totalVMs} VMs</span>
          <span className={styles.statItem}>📊 {stats.totalDays} Active Days</span>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>🔍 Legend:</div>
        <div className={styles.legendItems}>
          <span className={styles.legendItem}>
            <img src={fullBackupIcon} alt="Full backup" />
            Full Backup
          </span>
          <span className={styles.legendItem}>
            <img src={incrementalBackupIcon} alt="Incremental backup" />
            Incremental Backup
          </span>
          <span className={styles.legendItem}>
            <img src={metadataIcon} alt="Metadata" />
            Metadata
          </span>
          <span className={styles.legendItem}>
            <img src={noBackupIcon} alt="No backup" />
            No Backup
          </span>
          <span className={styles.legendItem}>
            <img src={noDataIcon} alt="No data" />
            No Data
          </span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.backupTable}>
          <thead>
            <tr>
              <th className={styles.groupHeader}>
                <div className={styles.headerContent}>
                  <span>Group / VM</span>
                </div>
              </th>
              {/* <th className={styles.dayHeader}>Status</th> */}
              {/* {allDays.map(day => (
                <th key={day} className={styles.dayHeader}>{day}</th>
              ))} */}
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([groupName, vms]) => {
              const isCollapsed = collapsedGroups.has(groupName)
              const groupStats = getGroupStats(vms, selectedMonth)
              
              return (
                <React.Fragment key={groupName}>
                  <tr className={styles.groupRow} onClick={() => toggleGroup(groupName)}>
                    <td className={styles.groupCell}>
                      <div className={styles.groupInfo}>
                        <span className={styles.groupIcon}>📁</span>
                        <span className={styles.groupName}>{groupName}</span>
                      </div>
                    </td>
                    <td className={styles.groupStatsCell} colSpan={31}>
                      <div className={styles.mergedStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon}>💻</span>
                          <span>Total: {groupStats.totalVMs}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon}>🔷</span>
                          <span>Full: {groupStats.fullCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon}>🔶</span>
                          <span>Incremental: {groupStats.incrementalCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon}>📄</span>
                          <span>Metadata: {groupStats.metadataCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statIcon}>⚠️</span>
                          <span>Failed: {groupStats.failedCount}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.expandCell}>
                      <span className={styles.expandIcon}>
                        {isCollapsed ? '▶️' : '🔽'}
                      </span>
                    </td>
                  </tr>
                  {!isCollapsed && (
                    <>
                    <tr className={styles.dayHeaderRow}>
                      <td> </td>
                      {allDays.map(day => (
                      <th key={day} className={styles.dayHeader}>{day}</th>
                    ))}
                    <td></td>
                    </tr>
                    {vms.map((vm, index) => (
                    <tr key={`${vm.uniqueName}-${index}`} className={styles.vmRow}>
                      <td className={styles.vmCell}>
                        <div className={styles.vmInfo}>
                          <span className={styles.vmIcon}>💻</span>
                          <span className={styles.vmName}>{vm.uniqueName}</span>
                        </div>
                      </td>
                      {allDays.map(day => (
                        <td key={day} className={styles.dayCell}>
                          <div 
                            className={styles.dayIconContainer}
                            title={
                              vm.dates[day] ? 
                              `Full: ${vm.dates[day].full_backup ? 'Yes' : 'No'}, Incremental: ${vm.dates[day].incremental_backup ? 'Yes' : 'No'}, Metadata: ${vm.dates[day].metadata ? 'Yes' : 'No'}` : 
                              'No backup data'
                            }
                          >
                            {getCombinedIcon(vm.dates[day])}
                          </div>
                        </td>
                      ))}
                      <td></td>
                      {/* <td className={styles.expandCell}></td> */}
                    </tr>
                  ))}
                  </>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TabularView