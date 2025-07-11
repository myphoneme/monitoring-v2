import React, { useState } from 'react';
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
    { id: 'general', name: 'General Support', icon: '💬' },
    { id: 'technical', name: 'Technical Issues', icon: '🔧' },
    { id: 'billing', name: 'Billing & Accounts', icon: '💳' },
    { id: 'feature', name: 'Feature Request', icon: '💡' }
  ];

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking the 'Forgot Password' link on the login page and following the instructions sent to your email."
    },
    {
      question: "How do I contact technical support?",
      answer: "You can contact technical support through this form, email us at support@phoneme.com, or call our helpline at 1-800-PHONEME."
    },
    {
      question: "What are your service hours?",
      answer: "Our support team is available Monday through Friday, 9 AM to 6 PM EST. We respond to urgent technical issues 24/7."
    },
    {
      question: "How do I update my account information?",
      answer: "You can update your account information by logging into your dashboard and navigating to the 'Account Settings' section."
    }
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
    // Handle form submission
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
          <h1 className={styles.title}>Support Center</h1>
          <p className={styles.subtitle}>
            We're here to help you with any questions or issues you may have
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.supportForm}>
            <h2 className={styles.sectionTitle}>Get in Touch</h2>
            
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
                    placeholder="Your full name"
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
                  placeholder="Brief description of your issue"
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
                  placeholder="Please describe your issue in detail..."
                  rows="5"
                ></textarea>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Send Message
              </button>
            </form>
          </div>

          <div className={styles.faqSection}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <div key={index} className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>{faq.question}</h3>
                  <p className={styles.faqAnswer}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;