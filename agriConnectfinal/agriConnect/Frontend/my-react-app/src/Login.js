import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Get stored user information
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    // Check if there's a redirect message in sessionStorage
    const redirectMessage = sessionStorage.getItem('authRedirectMessage');
    if (redirectMessage) {
      setError(redirectMessage);
      // Clear the message after displaying it
      sessionStorage.removeItem('authRedirectMessage');
    }
    
    // Check if we have a redirect state from protected route
    if (location.state?.from) {
      const path = location.state.from;
      let message = '';
      
      if (token && userType) {
        // User is logged in with wrong type
        if (path.includes('farmer')) {
          message = `You need a farmer account to access ${path}. You are currently logged in as a ${userType}.`;
        } else if (path.includes('vendor')) {
          message = `You need a vendor account to access ${path}. You are currently logged in as a ${userType}.`;
        } else {
          message = `You don't have access to ${path} with your current account type.`;
        }
      } else {
        // User is not logged in
        message = `You need to log in to access ${path}.`;
      }
      
      if (message) setError(message);
    }
  }, [location.state, token, userType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    setError('You have been logged out. Please log in with the appropriate account.');
  };

  const handleGotoDashboard = () => {
    if (!token || !userType) return;
    
    switch(userType) {
      case 'farmer':
        navigate('/farmer-dashboard');
        break;
      case 'vendor':
        navigate('/vendor-dashboard');
        break;
      case 'guest':
        navigate('/guest-dashboard');
        break;
      default:
        // If unknown user type, stay on login page
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Make sure we're using the correct backend endpoint
      const response = await axios.post('http://localhost:5400/api/auth/login', {
        email: formData.email,
        password: formData.password
      });
      
      // Store token and user info in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', response.data.user.userType);
        localStorage.setItem('userId', response.data.user._id);
      }
      
      // Check if proper profile exists for the user type
      const userType = response.data.user.userType;
      
      // If we have a redirect path, check if user type matches the required type
      if (location.state?.from) {
        const path = location.state.from;
        
        // Only redirect to farmer routes if user is a farmer
        if (path.includes('farmer') && userType !== 'farmer') {
          setError(`You need a farmer account to access ${path}. You are currently logged in as a ${userType}.`);
          setLoading(false);
          return;
        }
        
        // Only redirect to vendor routes if user is a vendor
        if (path.includes('vendor') && userType !== 'vendor') {
          setError(`You need a vendor account to access ${path}. You are currently logged in as a ${userType}.`);
          setLoading(false);
          return;
        }
      }
      
      // Navigate based on user type
      if (userType === 'farmer') {
        try {
          // Check if farmer profile exists
          await axios.get('http://localhost:5400/api/farmers/me', {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          navigate('/farmer-dashboard');
        } catch (profileError) {
          // If profile doesn't exist, create one
          if (profileError.response && profileError.response.status === 404) {
            navigate('/farmer-profile'); // Redirect to profile creation page
          } else {
            throw profileError;
          }
        }
      } else if (userType === 'vendor') {
        try {
          // Check if vendor profile exists
          await axios.get('http://localhost:5400/api/vendors/me', {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          navigate('/vendor-dashboard');
        } catch (profileError) {
          // If profile doesn't exist, create one
          if (profileError.response && profileError.response.status === 404) {
            navigate('/vendor-profile'); // Redirect to profile creation page
          } else {
            throw profileError;
          }
        }
      } else {
        navigate('/guest-dashboard');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo">AC</div>
            <span className="brand-name">AgriConnect</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>
        </div>
        
        <div className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          {token && userType && (
            <div className="already-logged-in">
              <p>You are currently logged in as a {userType}.</p>
              <div className="auth-buttons-container">
                <button 
                  type="button" 
                  onClick={handleGotoDashboard} 
                  className="go-dashboard-button"
                >
                  Go to Dashboard
                </button>
                <button 
                  type="button" 
                  onClick={handleLogout} 
                  className="logout-button"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
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
            
            <div className="remember-me">
              <input 
                type="checkbox" 
                id="remember-me"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;