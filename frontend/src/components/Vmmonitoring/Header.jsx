import React from 'react';
import { Monitor, Server, Activity, BarChart3, Grid3X3, Database, TrendingUp, XCircle } from 'lucide-react';
import styles from '../../styles/Header.module.css';

const Header = ({ activeTab, setActiveTab }) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Grid View',
      icon: Grid3X3,
      description: 'VM monitoring grid view'
    },
    {
      id: 'vm-master',
      label: 'Master Data',
      icon: Database,
      description: 'VM master management'
    },
    {
      id: 'vm-status',
      label: 'Status History',
      icon: TrendingUp,
      description: 'VM status history'
    },
    {
      id: 'unreachable-vms',
      label: 'Ping Status',
      icon: XCircle,
      description: 'VM ping status monitoring'
    }
  ];

  return (
    <div className={styles.headerContainer}>
      <div className={styles.brandSection}>
        <div className={styles.logo}>
          <Monitor className={styles.logoIcon} />
          <div className={styles.brandText}>
            <h1 className={styles.logoText}>VM Monitor</h1>
            <p className={styles.tagline}>Infrastructure Monitoring Platform</p>
          </div>
        </div>
      </div>
      
      <div className={styles.navigationSection}>
        <div className={styles.navigation}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                title={item.description}
              >
                <Icon className={styles.navIcon} />
                <span className={styles.navText}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Header;