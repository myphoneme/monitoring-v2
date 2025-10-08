import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import phonemeLogo from '../../../phoneme_logo.png';
import { useAuth } from '../../context/AuthContext';
import CreateUserModal from '../Auth/CreateUserModal';

const Header = ({ isDarkMode, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasValidToken, clear } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`${styles.header} ${isDarkMode ? styles.dark : styles.light}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img src={phonemeLogo} alt="Phoneme Logo" className={styles.logoImg} />
        </Link>
        
        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className={`${styles.navLink} ${isActive('/about') ? styles.active : ''}`}
          >
            About
          </Link>
          <Link 
            to="/support" 
            className={`${styles.navLink} ${isActive('/support') ? styles.active : ''}`}
          >
            Support
          </Link>
          <Link 
            to="/tools" 
            className={`${styles.navLink} ${isActive('/tools') ? styles.active : ''}`}
          >
            Employee Tools
          </Link>
        </nav>

        <div className={styles.headerActions}>
          <button 
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <div className={styles.notificationIcon}>🔔</div>
          {hasValidToken && user ? (
            <div className={styles.profileWrapper}>
              <button className={styles.avatar} onClick={() => setShowMenu(!showMenu)} aria-label="Profile menu">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </button>
              {showMenu && (
                <div className={styles.profileMenu} onMouseLeave={() => setShowMenu(false)}>
                  <div className={styles.profileDetails}>
                    <div className={styles.profileName}>{user.name}</div>
                    <div className={styles.profileEmail}>{user.email}</div>
                  </div>
                  {Number(user?.role) === 1 && (
                    <button className={styles.logoutBtn} onClick={() => { setShowCreateUser(true); setShowMenu(false); }}>
                      Create User
                    </button>
                  )}
                  <button className={styles.logoutBtn} onClick={() => { clear(); setShowMenu(false); navigate('/'); }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.profileIcon}>👤</div>
          )}
        </div>

        <button 
          className={styles.menuToggle}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <CreateUserModal open={showCreateUser} onClose={() => setShowCreateUser(false)} />
    </header>
  );
};

export default Header;