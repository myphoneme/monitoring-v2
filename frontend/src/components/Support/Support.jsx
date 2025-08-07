import React, { useState } from 'react';
import LocationIcon from '../../assets/LocationIcon';
import MailIcon from '../../assets/MailIcon';
import GlobeIcon from '../../assets/GlobeIcon';
import styles from './Support.module.css';

const Support = () => {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  });

  const categories = [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'technical', name: 'Technical', icon: '🔧' },
    { id: 'billing', name: 'Billing', icon: '💳' },
    { id: 'feature', name: 'Feature', icon: '💡' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      category: 'general',
      subject: '',
      message: ''
    });
  };

  return (
    <div className={styles.support}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Support</h1>
          <p className={styles.subtitle}>We're here to assist you</p>
        </div>

        <div className={styles.content}>
          <div className={styles.supportForm}>
            <h2 className={styles.sectionTitle}>Contact Us</h2>
            
            <div className={styles.categories}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={styles.input}
                    placeholder="Your name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={styles.input}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject" className={styles.label}>Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                  placeholder="Issue description"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.label}>Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className={styles.textarea}
                  placeholder="Describe your issue..."
                  rows="3"
                ></textarea>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Send
              </button>
            </form>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.mapCard}>
              <iframe
                title="Advant Navis Business Park Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.019282019994!2d77.4144300754066!3d28.61393997567809!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ceffb6e2b6b2d%3A0x6e2b6b2d6e2b6b2d!2sAdvant%20Navis%20Business%20Park!5e0!3m2!1sen!2sin!4v1716460000000!5m2!1sen!2sin"
                width="100%"
                height="150"
                style={{ border: 0, borderRadius: '8px', width: '100%' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className={styles.contactCards}>
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}><LocationIcon /></span>
                <div>
                  <strong>Office</strong>
                  <div>Phoneme Solution<br/>Advant Navis, Sector-142,<br/>Noida, UP-201307</div>
                </div>
              </div>
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}><MailIcon /></span>
                <div>
                  <strong>Email</strong>
                  <div>Hr@myphoneme.com</div>
                </div>
              </div>
              <div className={styles.contactCard}>
                <span className={styles.contactIcon}><GlobeIcon /></span>
                <div>
                  <strong>Website</strong>
                  <div><a href="https://myphoneme.com/" target="_blank" rel="noopener noreferrer">myphoneme.com</a></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;