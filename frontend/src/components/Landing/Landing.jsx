import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Landing.module.css';
import quotationImg from '../../../quotation.png';
import jobOfferImg from '../../../job-offer.png';

const Landing = () => {
  const quickAccessItems = [ 
    {
      id: 9,
      title: 'Quotation Generator',
      description: 'Create and download professional quotations for clients easily.',
      icon: <img src={quotationImg} alt="Quotation Generator" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />, 
      category: 'Utilities',
      link: '/tools/quotation-generator',
      featured: true
    },
    {
      id: 10,
      title: 'Offer Letter Generator',
      description: 'Generate customized offer letters for new hires quickly.',
      icon: <img src={jobOfferImg} alt="Offer Letter Generator" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />, 
      category: 'HR',
      link: '/tools/offer-letter-generator',
      featured: true
    },
    {
      id: 11,
      title: 'Information Extractor',
      description: 'Extract key information from documents or text automatically.',
      icon: '🔍',
      category: 'AI Tools',
      link: '/tools/information-extractor',
      featured: true
    },
    {
      id: 12,
      title: 'Veeam Backup Dashboard',
      description: 'Monitor and manage Veeam backup operations.',
      icon: '🖥️',
      category: 'Monitoring',
      link: '/tools/veeam-backup',
      featured: true
    },
    {
      id: 13,
      title: 'VM Monitoring - Dashboard',
      description: 'Monitor and manage virtual machines.',
      icon: '🖥️',
      category: 'Monitoring',
      link: '/tools/vm-monitoring',
      featured: true
    },
    {
      id: 14,
      title: 'Image Generator',
      description: 'Generate Customized Images.',
      icon: '🖥️',
      category: 'AI Tools',
      link: '/tools/image-generator',
      featured: true
    }
    // ,
    // {
    //   id: 15,
    //   title: 'VM IP CHECKER',
    //   description: 'Check IP Reachable or Not.',
    //   icon: '🖥️',
    //   category: 'AI Tools',
    //   link: '/tools/ip-checker',
    //   featured: true
    // }
  ];

  return (
    <div className={styles.landing}>
      {/* Hero Section with Background Image */}
      <div className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <img 
            src="https://images.pexels.com/photos/1181673/pexels-photo-1181673.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&dpr=2" 
            alt="Cloud computing technology background" 
            className={styles.backgroundImage}
          />
          <div className={styles.overlay}></div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Welcome to <span className={styles.brandName}>PHONEME</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Making technology friendly to human beings. Experience the power of voice 
              technology and innovative solutions designed for the modern world.
            </p>
            <Link to="/dashboard" className={styles.getStartedBtn}>
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className={styles.quickAccessSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Access</h2>
            <p className={styles.sectionSubtitle}>Access your most used tools and resources</p>
          </div>
          
          <div className={styles.quickAccessGrid}>
            {quickAccessItems.map((item) => (
              <Link key={item.id} to={item.link} className={styles.accessCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIconWrapper}>
                    {item.icon}
                  </div>
                  {item.featured && (
                    <span className={styles.featuredBadge}>⭐ Featured</span>
                  )}
                </div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDescription}>{item.description}</p>
                <span className={styles.categoryBadge}>{item.category}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
