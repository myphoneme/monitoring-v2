import { useState, useEffect } from 'react'
import MonthSelector from './MonthSelector'
import TabularView from './TabularView'
import BackupStatusSummary from './BackupStatusSummary'
import styles from './BackupDashboard.module.css'

function BackupDashboard({ onDataUpdate }) {
  const [backupData, setBackupData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [activeView, setActiveView] = useState('dashboard') // ✅ Default is dashboard

  useEffect(() => {
    fetchBackupData()
  }, [])

  useEffect(() => {
    if (onDataUpdate && backupData && selectedMonth) {
      onDataUpdate(backupData, selectedMonth)
    }
  }, [backupData, selectedMonth, onDataUpdate])

  const fetchBackupData = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://fastapi.phoneme.in/veeam')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Raw API data:', data)

      // Group data by month, then by parent_directory, then by unique VM name, then by date
      const groupedData = groupBackupsByMonthDirectoryVMAndDate(data)
      console.log('Grouped data:', groupedData)
      setBackupData(groupedData)

      // Set the first available month as selected
      const months = Object.keys(groupedData).sort((a, b) => new Date(b + '-01') - new Date(a + '-01'))
      if (months.length > 0) {
        setSelectedMonth(months[0])
      }

      setError(null)
    } catch (err) {
      console.error('Error fetching backup data:', err)
      setError('Failed to fetch backup data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const groupBackupsByMonthDirectoryVMAndDate = (data) => {
    const grouped = {}

    data.forEach((backup) => {
      const date = backup.last_modified.split(' ')[0]
      const month = date.substring(0, 7)
      const day = parseInt(date.substring(8, 10))

      if (!grouped[month]) {
        grouped[month] = {}
      }

      const directory = backup.parent_directory

      if (!grouped[month][directory]) {
        grouped[month][directory] = {}
      }

      const uniqueVmName = extractUniqueVmName(backup.vm)

      if (!grouped[month][directory][uniqueVmName]) {
        grouped[month][directory][uniqueVmName] = {
          uniqueName: uniqueVmName,
          dates: {}
        }
      }

      const vmGroup = grouped[month][directory][uniqueVmName]

      if (!vmGroup.dates[day]) {
        vmGroup.dates[day] = {
          metadata: false,
          full_backup: false,
          incremental_backup: false,
          files: [],
          last_modified: backup.last_modified
        }
      }

      const dayData = vmGroup.dates[day]
      if (backup.metadata) dayData.metadata = true
      if (backup.full_backup) dayData.full_backup = true
      if (backup.incremental_backup) dayData.incremental_backup = true

      dayData.files.push({
        filename: backup.vm,
        metadata: backup.metadata,
        full_backup: backup.full_backup,
        incremental_backup: backup.incremental_backup,
        last_modified: backup.last_modified
      })

      if (new Date(backup.last_modified) > new Date(dayData.last_modified)) {
        dayData.last_modified = backup.last_modified
      }
    })

    Object.keys(grouped).forEach(month => {
      Object.keys(grouped[month]).forEach(directory => {
        grouped[month][directory] = Object.values(grouped[month][directory])
      })
    })

    return grouped
  }

  const extractUniqueVmName = (vmFileName) => {
    let cleanName = vmFileName.replace(/\.(vbk|vib|vbm)$/i, '')
    cleanName = cleanName.replace(/\.\d+D\d{4}-\d{2}-\d{2}T\d{6}_[A-F0-9]+$/i, '')
    cleanName = cleanName.replace(/\.vm-\d+D\d{4}-\d{2}-\d{2}T\d{6}_[A-F0-9]+$/i, '')
    cleanName = cleanName.replace(/_[A-F0-9]{4,6}$/i, '')
    cleanName = cleanName.replace(/D\d{4}-\d{2}-\d{2}T\d{6}.*$/i, '')
    cleanName = cleanName.replace(/\d{4}-\d{2}-\d{2}T\d{6}.*$/i, '')
    cleanName = cleanName.replace(/\.[A-F0-9]{8,}$/i, '')
    cleanName = cleanName.replace(/[._]+$/, '')
    return cleanName.trim()
  }

  const formatMonth = (monthString) => {
    return new Date(monthString + '-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const getSelectedMonthStats = () => {
    if (!selectedMonth || !backupData[selectedMonth]) {
      return { totalGroups: 0, totalVMs: 0, totalDays: 0 }
    }

    const monthData = backupData[selectedMonth]
    const totalGroups = Object.keys(monthData).length
    let totalVMs = 0
    const daysSet = new Set()

    Object.values(monthData).forEach(vms => {
      totalVMs += vms.length
      vms.forEach(vm => {
        Object.keys(vm.dates).forEach(day => {
          daysSet.add(day)
        })
      })
    })

    return { totalGroups, totalVMs, totalDays: daysSet.size }
  }

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading backup data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.errorTitle}>Error Loading Data</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={fetchBackupData}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const selectedMonthStats = getSelectedMonthStats()
  const availableMonths = Object.keys(backupData).sort((a, b) => new Date(b + '-01') - new Date(a + '-01'))

  return (
    <div className={styles.dashboard}>
      <header className={styles.compactHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => window.history.back()} title="Go Back">
            ←
          </button>
          <h1 className={styles.compactTitle}>
            <span className={styles.veeamLogo}>🔒</span>
            Veeam Backup Dashboard
          </h1>
        </div>

        <div className={styles.headerRight}>
          {/* ✅ Toggle Buttons */}
          <button 
            className={`${styles.navButton} ${activeView === 'dashboard' ? styles.activeNav : ''}`} 
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`${styles.navButton} ${activeView === 'status' ? styles.activeNav : ''}`} 
            onClick={() => setActiveView('status')}
          >
            Status
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* ✅ Keep MonthSelector + Refresh always visible */}
        <div className={styles.compactControls}>
          <MonthSelector
            months={availableMonths}
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            formatMonth={formatMonth}
          />
          <button 
            className={styles.refreshButton}
            onClick={fetchBackupData}
            disabled={loading}
          >
            <span className={styles.refreshIcon}>🔄</span>
            Refresh
          </button>
        </div>

        {/* ✅ Show TabularView or BackupStatusSummary based on activeView */}
        {activeView === 'dashboard' && selectedMonth && backupData[selectedMonth] && (
          <TabularView 
            data={backupData[selectedMonth]}
            selectedMonth={selectedMonth}
            formatMonth={formatMonth}
            stats={selectedMonthStats}
          />
        )}

        {activeView === 'status' && (
          <BackupStatusSummary 
            data={backupData} 
            selectedMonth={selectedMonth} 
            formatMonth={formatMonth} 
          />
        )}

        {availableMonths.length === 0 && (
          <div className={styles.noDataContainer}>
            <div className={styles.noDataIcon}>📊</div>
            <h3 className={styles.noDataTitle}>No Backup Data Found</h3>
            <p className={styles.noDataMessage}>
              No backup records available. Try refreshing.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default BackupDashboard
