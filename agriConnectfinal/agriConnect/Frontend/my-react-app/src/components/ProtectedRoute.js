import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * A component to protect routes based on user type
 * @param {Object} props - Component props
 * @param {string[]} props.allowedUserTypes - Array of user types allowed to access this route
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.redirectPath - Path to redirect to if unauthorized
 */
const ProtectedRoute = ({ allowedUserTypes, children, redirectPath = '/login' }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuthorization = () => {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token) {
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }
      
      // If userType is in the allowed list, user is authorized
      const authorized = allowedUserTypes.includes(userType);
      setIsAuthorized(authorized);
      setIsChecking(false);
    };
    
    checkAuthorization();
  }, [allowedUserTypes]);
  
  if (isChecking) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Checking authorization...</p>
      </div>
    );
  }
  
  if (!isAuthorized) {
    // Store the message in session storage to display on login page
    const userType = localStorage.getItem('userType');
    let message = '';
    
    if (userType) {
      // User is logged in but with wrong type
      const targetType = allowedUserTypes[0]; // Use first allowed type as primary
      message = `You need a ${targetType} account to access this page. You are currently logged in as a ${userType}.`;
    } else {
      // User is not logged in
      message = `Please log in with a ${allowedUserTypes.join(' or ')} account to access this page.`;
    }
    
    sessionStorage.setItem('authRedirectMessage', message);
    
    // Return Navigate component with state containing the attempted path
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }
  
  return children;
};

export default ProtectedRoute;