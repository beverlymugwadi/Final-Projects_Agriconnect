import React, { useState } from 'react';

const GuestDashboard = ({ onNavigate }) => {
  const [selectedUserType, setSelectedUserType] = useState(null);

  const styles = {
    dashboard: {
      fontFamily: 'Inter, sans-serif',
      backgroundColor: '#f4f7f6',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
      color: '#2c3e50'
    },
    container: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
      maxWidth: '500px',
      width: '100%'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#16a34a',
      marginBottom: '1.5rem'
    },
    userTypeGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    userTypeCard: {
      backgroundColor: '#f4f7f6',
      borderRadius: '12px',
      padding: '1.5rem',
      cursor: 'pointer',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    },
    userTypeCardSelected: {
      backgroundColor: '#e6f3e9',
      transform: 'scale(1.05)',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    userTypeIcon: {
      fontSize: '3rem',
      marginBottom: '1rem',
      color: '#16a34a'
    },
    userTypeLabel: {
      fontSize: '1.2rem',
      fontWeight: 500
    },
    continueButton: {
      marginTop: '1.5rem',
      backgroundColor: '#16a34a',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '9999px',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      width: '100%',
      fontSize: '1rem',
      fontWeight: 600
    },
    buttonDisabled: {
      backgroundColor: '#a3a3a3',
      cursor: 'not-allowed'
    }
  };

  const UserTypeCard = ({ type, icon, label }) => (
    <div 
      style={{
        ...styles.userTypeCard,
        ...(selectedUserType === type ? styles.userTypeCardSelected : {})
      }}
      onClick={() => setSelectedUserType(type)}
    >
      <div style={styles.userTypeIcon}>{icon}</div>
      <div style={styles.userTypeLabel}>{label}</div>
    </div>
  );

  const handleContinue = () => {
    if (onNavigate) {
      if (selectedUserType === 'farmer') {
        onNavigate('/farmer-profile');
      } else if (selectedUserType === 'vendor') {
        onNavigate('/vendor-profile');
      }
    }
  };

  return (
    <div style={styles.dashboard}>
      <div style={styles.container}>
        <h1 style={styles.title}>Choose Your Role</h1>
        <p>Select the type of account you want to create</p>
        
        <div style={styles.userTypeGrid}>
          <UserTypeCard 
            type="farmer"
            icon="🚜"
            label="Farmer"
          />
          <UserTypeCard 
            type="vendor"
            icon="🏪"
            label="Vendor"
          />
        </div>

        <button 
          style={{
            ...styles.continueButton,
            ...(selectedUserType ? {} : styles.buttonDisabled)
          }}
          onClick={handleContinue}
          disabled={!selectedUserType}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default GuestDashboard;