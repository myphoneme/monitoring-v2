import React from 'react';
import styles from './About.module.css';
import about from '../../assets/about.png';

const About = () => {
  const values = [
    {
      id: 1,
      text: "Industry Focus: Healthcare, eGovernance, Insurance, Telecom."
    },
    {
      id: 2,
      text: "End-to-End Automation: Comprehensive solutions from start to finish."
    },
    {
      id: 3,
      text: "Managed IT Services: Full lifecycle support for optimal performance."
    },
    {
      id: 4,
      text: "Certifications & Quality: CMMi-5, ISO 27001, ISO 9001."
    }
  ];

  return (
    <div className={styles.about}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.imageSection}>
            <img 
              // src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              src={about}
              alt="IT team collaboration" 
              className={styles.aboutImage}
            />
          </div>
          
          <div className={styles.textSection}>
            <div className={styles.badge}>ABOUT</div>
            <h1 className={styles.title}>Who We Are</h1>
            
            <div className={styles.description}>
              <p>
                SRIT delivers end-to-end software solutions across sectors like Healthcare, eGovernance, Insurance, and Telecom. 
                With over 20 years of experience, we focus on automating large-scale operations, transforming industries with cutting-edge technology.
                Our commitment to integrity and excellence drives us to provide sustainable, high-performance solutions.
              </p>
              
              {/* <p>
                In the initial years, our focus is on Voice, the most widely used channel over 
                the phone. Over time, these technologies will pave the way into Mobile Apps 
                and embedded devices, making a difference everywhere.
              </p> */}
            </div>
            
            <div className={styles.values}>
              {values.map((value) => (
                <div key={value.id} className={styles.valueItem}>
                  <div className={styles.checkmark}>✓</div>
                  <p className={styles.valueText}>{value.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;