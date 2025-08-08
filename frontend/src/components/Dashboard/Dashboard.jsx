import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import quotationImg from '../../../quotation.png';
import jobOfferImg from '../../../job-offer.png';

const Dashboard = () => {
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
          featured: false
        },
        {
          id: 11,
          title: 'Information Extractor',
          description: 'Extract key information from documents or text automatically.',
          icon: '🔍',
          category: 'AI Tools',
          link: '/tools/information-extractor',
          featured: false
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
        },
        {
          id: 15,
          title: 'VM IP CHECKER',
          description: 'Check IP Reachable or Not.',
          icon: '🖥️',
          category: 'AI Tools',
          link: '/tools/ip-checker',
          featured: false
        }
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Quick Access</h1>
          <p className={styles.subtitle}>Access your most used tools and resources</p>
        </div>
        
        <div className={styles.grid}>
          {quickAccessItems.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardIcon} style={{ color: item.color }}>
                {item.icon}
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
              <Link to={item.link} className={styles.cardLink} style={{ borderColor: item.color }}>
                Access Tool
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;