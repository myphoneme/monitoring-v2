import React, { useState } from 'react';

const IpCheck = () => {
  const [manualIp, setManualIp] = useState('');
  const [vmResults, setVmResults] = useState({});
  const [manualResult, setManualResult] = useState(null);
  const [vmLoading, setVmLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

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

  // 🔁 Check all VMs
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

  // 🔍 Manual IP check
  const handleManualCheck = async () => {
    if (!manualIp) return;
    setManualLoading(true);
    const result = await checkPing(manualIp);
    setManualResult({ [manualIp]: result }); 
    setManualIp('');
    setManualLoading(false);
  };

  return (
    <div style={{ padding: '6rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        VM IP <span style={{ color: 'orange' }}>Checker</span>
      </h1>

      {/* Manual IP check section (right aligned) */}
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter IP address"
          value={manualIp}
          onChange={(e) => setManualIp(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            width: '250px',
            marginRight: '10px',
          }}
        />
        <button
          onClick={handleManualCheck}
          disabled={manualLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: 'orange',
            border: 'none',
            color: '#fff',
            fontWeight: 'bold',
            cursor: manualLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {manualLoading ? 'Checking...' : 'Check IP'}
        </button>
      </div>

      {/* Manual Result (Separate Table) */}
      {manualResult && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '20px',
            fontSize: '16px',
          }}
        >
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>IP</th>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>RESULT</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(manualResult).map(([ip, result]) => (
              <tr key={ip}>
                <td style={{ border: '1px solid #ccc', padding: '10px' }}>{ip}</td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '10px',
                    color:
                      result === '✅ true'
                        ? 'green'
                        : result === '❌ false'
                        ? 'red'
                        : 'orange',
                  }}
                >
                  {result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Check All VMs button */}
      <div style={{ textAlign: 'center', margin: '2rem 0' }}>
        <button
          onClick={handleCheckAllVMs}
          disabled={vmLoading}
          style={{
            padding: '10px 30px',
            backgroundColor: 'orange',
            border: 'none',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: vmLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {vmLoading ? 'Checking All...' : 'Check All VMs'}
        </button>
      </div>

      {/* VM Results Table */}
      {Object.keys(vmResults).length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '10px',
            fontSize: '16px',
          }}
        >
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>IP</th>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>RESULT</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(vmResults).map(([ip, result]) => (
              <tr key={ip}>
                <td style={{ border: '1px solid #ccc', padding: '10px' }}>{ip}</td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '10px',
                    color:
                      result === '✅ true'
                        ? 'green'
                        : result === '❌ false'
                        ? 'red'
                        : 'orange',
                  }}
                >
                  {result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default IpCheck;
