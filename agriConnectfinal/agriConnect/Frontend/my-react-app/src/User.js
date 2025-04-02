import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { userAPI, farmerAPI, vendorAPI } from './api';

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

// In your handleUserTypeSelect function:

const handleUserTypeSelect = async (userType) => {
  try {
    setLoading(true);
    setError('');
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    // Get user profile first to get name
    const userProfile = await userAPI.getProfile();
    const userName = userProfile.data?.user?.name || 'User';
    
    // Update user type using the API service
    await userAPI.updateProfile({ userType });
    
    // Store updated user type in localStorage
    localStorage.setItem('userType', userType);
    
    // Create corresponding profile based on user type
    if (userType === 'farmer') {
      try {
        // Try to get existing profile
        await farmerAPI.getProfile();
      } catch (error) {
        // If 404, create a new farmer profile
        if (error.response && error.response.status === 404) {
          await farmerAPI.createProfile({
            farmName: `${userName}'s Farm`,
            farmLocation: 'Please update',
            farmSize: 1,
            cropTypes: ['Please update']
          });
        } else {
          throw error;
        }
      }
      navigate('/farmer-dashboard');
    } else if (userType === 'vendor') {
      try {
        // Try to get existing profile
        await vendorAPI.getProfile();
      } catch (error) {
        // If 404, create a new vendor profile
        if (error.response && error.response.status === 404) {
          await vendorAPI.createProfile({
            businessName: `${userName}'s Business`,
            businessType: 'Retailer',
            businessLocation: 'Please update',
            purchaseCapacity: 100
          });
        } else {
          throw error;
        }
      }
      navigate('/vendor-dashboard');
    } else {
      // Guest user
      navigate('/guest-dashboard');
    }
  } catch (error) {
    console.error('Error setting user type:', error);
    setError('Failed to set user type. Please try again later.');
  } finally {
    setLoading(false);
  }
};

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      width: '100%',
      padding: '32px',
      textAlign: 'center',
    },
    title: {
      fontSize: '30px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '24px',
    },
    userTypeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
    },
    userTypeCard: {
      backgroundColor: '#f0fdf4',
      borderRadius: '12px',
      padding: '24px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    userTypeTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#15803d',
      marginBottom: '12px',
    },
    userTypeDescription: {
      color: '#4b5563',
      marginBottom: '16px',
    },
    button: {
      backgroundColor: '#16a34a',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '9999px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    }
  };

  const userTypes = [
    {
      title: 'Farmer',
      description: 'Manage your agricultural products and connect with vendors',
      onSelect: () => handleUserTypeSelect('farmer')
    },
    {
      title: 'Vendor',
      description: 'Manage your product listings and connect with farmers',
      onSelect: () => handleUserTypeSelect('vendor')
    },
    {
      title: 'Guest',
      description: 'Browse and explore AgriConnect platform features',
      onSelect: () => handleUserTypeSelect('guest')
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>How Would You Like to Use AgriConnect?</h2>
        
        {error && <div style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>{error}</div>}
        
        <div style={styles.userTypeGrid}>
          {userTypes.map((type, index) => (
            <div 
              key={index} 
              style={{
                ...styles.userTypeCard,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={e => !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={e => !loading && (e.currentTarget.style.transform = 'scale(1)')}
              onClick={() => !loading && type.onSelect()}
            >
              <h3 style={styles.userTypeTitle}>{type.title}</h3>
              <p style={styles.userTypeDescription}>{type.description}</p>
              <button 
                style={{
                  ...styles.button,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!loading) type.onSelect();
                }}
              >
                {loading ? 'Processing...' : `Select ${type.title}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;