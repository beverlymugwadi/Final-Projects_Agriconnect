import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

const BASE_URL = "http://localhost:5400/api";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, handleNotificationClick } = useNotifications();
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [userType, setUserType] = useState('');

  const fetchSystemNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get user type from localStorage
      const storedUserType = localStorage.getItem('userType');
      setUserType(storedUserType || '');

      const headers = {
        Authorization: `Bearer ${token}`
      };

      const response = await axios.get(`${BASE_URL}/notifications`, { headers });
      if (response.data.success) {
        const notificationsList = response.data.data || [];
        
        // Transform notifications data
        const formattedNotifications = notificationsList.map(notification => ({
          id: notification._id,
          title: notification.title || 'System Notification',
          message: notification.message,
          timestamp: new Date(notification.createdAt),
          read: notification.read,
          type: notification.type || 'system'
        }));
        
        setSystemNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // If API fails, we'll just use the context notifications
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSystemNotifications();
  }, [fetchSystemNotifications]);

  // Combine both notification sources
  const allNotifications = [...notifications, ...systemNotifications]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? allNotifications 
    : allNotifications.filter(notification => notification.type === activeTab);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <i className="fas fa-envelope"></i>;
      case 'booking':
      case 'order':
        return <i className="fas fa-shopping-cart"></i>;
      case 'product':
        return <i className="fas fa-box"></i>;
      case 'inventory':
        return <i className="fas fa-warehouse"></i>;
      default:
        return <i className="fas fa-bell"></i>;
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    // Also mark system notifications as read if we had an API for it
  };

  const handleNotificationItemClick = (notification) => {
    if (typeof handleNotificationClick === 'function') {
      handleNotificationClick(notification);
    } else {
      // Fallback navigation based on notification type
      switch (notification.type) {
        case 'message':
          navigate('/messages');
          break;
        case 'order':
          navigate('/orders');
          break;
        case 'product':
          navigate('/manage-inventory');
          break;
        default:
          // Just mark as read but don't navigate
          markAsRead(notification.id);
      }
    }
  };

  const handleBackToDashboard = () => {
    if (userType === 'farmer') {
      navigate('/farmer-dashboard');
    } else if (userType === 'vendor') {
      navigate('/vendor-dashboard');
    } else {
      // Fallback to home if user type is unknown
      navigate('/');
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="notifications-actions">
          <button 
            className="btn-outline"
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </button>
          <button 
            className="btn-outline"
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="notifications-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button 
          className={`tab-button ${activeTab === 'message' ? 'active' : ''}`}
          onClick={() => setActiveTab('message')}
        >
          Messages
        </button>
        <button 
          className={`tab-button ${activeTab === 'order' ? 'active' : ''}`}
          onClick={() => setActiveTab('order')}
        >
          Orders
        </button>
        <button 
          className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          System
        </button>
      </div>

      <div className="notifications-container">
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-card ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationItemClick(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">{notification.title || 'Notification'}</h3>
                  <span className="notification-time">
                    {typeof notification.timestamp === 'string' 
                      ? new Date(notification.timestamp).toLocaleString() 
                      : notification.timestamp instanceof Date 
                        ? notification.timestamp.toLocaleString()
                        : 'Just now'}
                  </span>
                </div>
                <p className="notification-message">{notification.message || notification.text}</p>
              </div>
              {!notification.read && (
                <div className="unread-indicator"></div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <i className="fas fa-bell-slash empty-icon"></i>
            <p>No notifications found</p>
            <p className="empty-subtext">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
