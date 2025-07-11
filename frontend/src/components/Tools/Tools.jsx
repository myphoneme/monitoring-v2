import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Tools.module.css';

const Tools = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const tools = [
    {
      id: 1,
      title: 'Voice Assistant',
      description: 'Access our AI-powered voice assistant for quick tasks and information.',
      icon: '🎤',
      category: 'AI Tools',
      link: '/tools/voice-assistant',
      featured: true
    },
    {
      id: 2,
      title: 'Call Analytics',
      description: 'Analyze call patterns and performance metrics.',
      icon: '📞',
      category: 'Analytics',
      link: '/tools/call-analytics',
      featured: true
    },
    {
      id: 3,
      title: 'Speech Recognition',
      description: 'Convert speech to text with high accuracy.',
      icon: '🗣️',
      category: 'AI Tools',
      link: '/tools/speech-recognition',
      featured: false
    },
    {
      id: 4,
      title: 'Language Translation',
      description: 'Real-time translation for multiple languages.',
      icon: '🌍',
      category: 'Translation',
      link: '/tools/translation',
      featured: false
    },
    {
      id: 5,
      title: 'Call Recording',
      description: 'Record and manage important calls securely.',
      icon: '🎙️',
      category: 'Communication',
      link: '/tools/call-recording',
      featured: false
    },
    {
      id: 6,
      title: 'API Documentation',
      description: 'Access comprehensive API documentation and examples.',
      icon: '📚',
      category: 'Development',
      link: '/tools/api-docs',
      featured: false
    },
    {
      id: 7,
      title: 'Phone Number Validation',
      description: 'Validate and format phone numbers globally.',
      icon: '✅',
      category: 'Utilities',
      link: '/tools/phone-validation',
      featured: false
    },
    {
      id: 8,
      title: 'Report Generator',
      description: 'Generate detailed reports and analytics.',
      icon: '📊',
      category: 'Analytics',
      link: '/tools/reports',
      featured: false
    }
  ];

  const categories = ['All Categories', ...new Set(tools.map(tool => tool.category))];

  const filteredTools = selectedCategory === 'All Categories' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory);

  return (
    <div className={styles.tools}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Employee Tools</h1>
          <p className={styles.subtitle}>
            Powerful tools and resources to enhance your productivity
          </p>
        </div>

        <div className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Featured Tools</h2>
          <div className={styles.featuredGrid}>
            {tools.filter(tool => tool.featured).map((tool) => (
              <div key={tool.id} className={`${styles.toolCard} ${styles.featured}`}>
                <div className={styles.toolIcon}>{tool.icon}</div>
                <div className={styles.toolInfo}>
                  <span className={styles.toolCategory}>{tool.category}</span>
                  <h3 className={styles.toolTitle}>{tool.title}</h3>
                  <p className={styles.toolDescription}>{tool.description}</p>
                  <Link to={tool.link} className={styles.toolLink}>
                    Launch Tool →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.allToolsSection}>
          <h2 className={styles.sectionTitle}>All Tools</h2>
          <div className={styles.categoriesNav}>
            {categories.map((category) => (
              <button 
                key={category} 
                className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className={styles.toolsGrid}>
            {filteredTools.map((tool) => (
              <div key={tool.id} className={styles.toolCard}>
                <div className={styles.toolIcon}>{tool.icon}</div>
                <div className={styles.toolInfo}>
                  <span className={styles.toolCategory}>{tool.category}</span>
                  <h3 className={styles.toolTitle}>{tool.title}</h3>
                  <p className={styles.toolDescription}>{tool.description}</p>
                  <Link to={tool.link} className={styles.toolLink}>
                    Launch Tool →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;