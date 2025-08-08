import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Activity, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import styles from './IpCheck.module.css';

const IpCheck = () => {
  const [manualIp, setManualIp] = useState('');
  const [vmResults, setVmResults] = useState({});
  const [manualResult, setManualResult] = useState(null);
  const [vmLoading, setVmLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const navigate = useNavigate();

  // Ping function
  const checkPing = async (ip) => {
    try {
      const res = await fetch('https://fastapi.phoneme.in/ping-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      return data.reachable === true ? '✅ true' : '❌ false';
    } catch (err) {
      return '⚠️ error';
    }
  };

  // Check all VMs
  const handleCheckAllVMs = async () => {
    setVmLoading(true);
    setVmResults({}); // clear old results
    try {
      const res = await fetch('https://fastapi.phoneme.in/vm/master_vms');
      const vms = await res.json();

      const results = {};
      for (const vm of vms) {
        const ip = vm.ip;
        const result = await checkPing(ip);
        results[ip] = result;
      }

      setVmResults(results);
    } catch (err) {
      console.error('VM fetch error:', err);
    } finally {
      setVmLoading(false);
    }
  };

  // Manual IP check
  const handleManualCheck = async () => {
    if (!manualIp.trim()) return;
    setManualLoading(true);
    const result = await checkPing(manualIp);
    setManualResult({ [manualIp]: result }); 
    setManualIp('');
    setManualLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualCheck();
    }
  };

  const getStatusIcon = (result) => {
    if (result === '✅ true') return <CheckCircle className={styles.iconSuccess} />;
    if (result === '❌ false') return <XCircle className={styles.iconError} />;
    return <AlertCircle className={styles.iconWarning} />;
  };

  const getStatusClass = (result) => {
    if (result === '✅ true') return styles.statusSuccess;
    if (result === '❌ false') return styles.statusError;
    return styles.statusWarning;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          onClick={() => navigate(-1)}
          className={styles.backButton}
          aria-label="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>
          <Activity className={styles.titleIcon} />
          VM IP <span className={styles.titleAccent}>Checker</span>
        </h1>
      </div>

      <div className={styles.content}>
        {/* Manual IP Check Section */}
        <div className={styles.manualSection}>
          <div className={styles.inputGroup}>
            <div className={styles.inputWrapper}>
              <Search className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={manualIp}
                onChange={(e) => setManualIp(e.target.value)}
                onKeyPress={handleKeyPress}
                className={styles.input}
              />
            </div>
            <button
              onClick={handleManualCheck}
              disabled={manualLoading || !manualIp.trim()}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {manualLoading ? (
                <>
                  <div className={styles.spinner} />
                  Checking...
                </>
              ) : (
                'Check IP'
              )}
            </button>
          </div>
        </div>

        {/* Manual Result Table */}
        {manualResult && (
          <div className={styles.tableSection}>
            <h3 className={styles.sectionTitle}>Manual Check Result</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(manualResult).map(([ip, result]) => (
                    <tr key={ip}>
                      <td className={styles.ipCell}>{ip}</td>
                      <td className={styles.statusCell}>
                        {getStatusIcon(result)}
                      </td>
                      <td className={`${styles.resultCell} ${getStatusClass(result)}`}>
                        {result.replace(/[✅❌⚠️]/g, '').trim()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Check All VMs Button */}
        <div className={styles.actionSection}>
          <button
            onClick={handleCheckAllVMs}
            disabled={vmLoading}
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonLarge}`}
          >
            {vmLoading ? (
              <>
                <Loader2 className={styles.loadingIcon} />
                Checking All VMs...
              </>
            ) : (
              <>
                <Activity size={18} />
                Check All VMs
              </>
            )}
          </button>
        </div>

        {/* Loading Overlay for VM Check */}
        {vmLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingCard}>
              <Loader2 className={styles.loadingSpinner} />
              <h3 className={styles.loadingTitle}>Checking All VMs</h3>
              <p className={styles.loadingText}>
                Please wait while we ping all VM instances...
              </p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
            </div>
          </div>
        )}

        {/* VM Results Table */}
        {Object.keys(vmResults).length > 0 && (
          <div className={styles.tableSection}>
            <h3 className={styles.sectionTitle}>
              VM Status Results ({Object.keys(vmResults).length} VMs)
            </h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(vmResults).map(([ip, result]) => (
                    <tr key={ip}>
                      <td className={styles.ipCell}>{ip}</td>
                      <td className={styles.statusCell}>
                        {getStatusIcon(result)}
                      </td>
                      <td className={`${styles.resultCell} ${getStatusClass(result)}`}>
                        {result.replace(/[✅❌⚠️]/g, '').trim()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IpCheck;