import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { userAPI, farmerAPI, vendorAPI } from './api';
import './Login.css'; // We'll use the same CSS file for consistent styling

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    userType: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // First send data to backend to register user
      const response = await axios.post('http://localhost:5400/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        userType: 'guest' // Initially register as guest, we'll update after selection
      });
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user._id);
      }
      
      // Show user type selection after successful registration
      setShowUserTypeSelection(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeSelect = async (userType) => {
    try {
      setLoading(true);
      setError('');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication failed. Please try again.');
      }
      
      // Update user type (use the API service instead of direct axios call)
      await userAPI.updateProfile({ userType });
      
      // Store userType in localStorage
      localStorage.setItem('userType', userType);
      
      // Create profile based on user type
      if (userType === 'farmer') {
        try {
          // Create initial farmer profile
          await farmerAPI.createProfile({
            farmName: `${formData.name}'s Farm`,
            farmLocation: 'Please update',
            farmSize: 1,
            cropTypes: ['Please update']
          });
          navigate('/farmer-dashboard');
        } catch (error) {
          console.error('Error creating farmer profile:', error);
          // Check if error is due to profile already existing
          if (error.response && error.response.status === 400 && 
              error.response.data.message.includes('already exists')) {
            navigate('/farmer-dashboard');
          } else {
            throw error;
          }
        }
      } else if (userType === 'vendor') {
        try {
          // Create initial vendor profile
          await vendorAPI.createProfile({
            businessName: `${formData.name}'s Business`,
            businessType: 'Retailer',
            businessLocation: 'Please update',
            purchaseCapacity: 100
          });
          navigate('/vendor-dashboard');
        } catch (error) {
          console.error('Error creating vendor profile:', error);
          // Check if error is due to profile already existing
          if (error.response && error.response.status === 400 && 
              error.response.data.message.includes('already exists')) {
            navigate('/vendor-dashboard');
          } else {
            throw error;
          }
        }
      } else {
        navigate('/guest-dashboard');
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      setError('Failed to set user type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const UserTypeSelection = () => {
    const userTypes = [
      {
        title: 'Farmer',
        description: 'Manage your agricultural products and connect with vendors',
        icon: '🚜'
      },
      {
        title: 'Vendor',
        description: 'Manage your product listings and connect with farmers',
        icon: '🏪'
      },
      {
        title: 'Guest',
        description: 'Browse and explore AgriConnect platform features',
        icon: '👀'
      }
    ];

    return (
      <div className="auth-container">
        <div className="auth-card" style={{ maxWidth: '700px' }}>
          <div className="auth-header">
            <div className="logo-container">
              <div className="logo">AC</div>
              <span className="brand-name">AgriConnect</span>
            </div>
            <h1 className="auth-title">Choose Your Role</h1>
            <p className="auth-subtitle">Select how you want to use AgriConnect</p>
          </div>
          
          <div className="auth-form">
            {error && <div className="error-message">{error}</div>}
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              margin: '1.5rem 0'
            }}>
              {userTypes.map((type, index) => (
                <div 
                  key={index} 
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => handleUserTypeSelect(type.title.toLowerCase())}
                  onMouseOver={e => {
                    e.currentTarget.style.border = '2px solid #16a34a';
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.border = '2px solid transparent';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{type.icon}</div>
                  <h3 style={{ color: '#111827', marginBottom: '0.5rem' }}>{type.title}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{type.description}</p>
                </div>
              ))}
            </div>
            
            <div className="auth-footer" style={{ textAlign: 'center', borderTop: 'none' }}>
              <p style={{ marginBottom: '1rem' }}>Not sure? You can always change your role later.</p>
              {loading && <p>Processing your selection...</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (showUserTypeSelection) {
    return <UserTypeSelection />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo">AC</div>
            <span className="brand-name">AgriConnect</span>
          </div>
          <h1 className="auth-title">Create Your Account</h1>
          <p className="auth-subtitle">Join AgriConnect today</p>
        </div>
        
        <div className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input 
                type="text" 
                id="name"
                name="name"
                placeholder="John Doe" 
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input 
                type="email" 
                id="email"
                name="email"
                placeholder="your@email.com" 
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input 
                type="tel" 
                id="phone"
                name="phone"
                placeholder="+234 800 000 0000" 
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input 
                type="password" 
                id="password"
                name="password"
                placeholder="••••••••" 
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••" 
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;