import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    // Load notifications from localStorage on initial render
    const savedNotifications = localStorage.getItem('notifications');
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [unreadCount, setUnreadCount] = useState(() => {
    // Load unread count from localStorage on initial render
    const savedUnreadCount = localStorage.getItem('unreadCount');
    return savedUnreadCount ? parseInt(savedUnreadCount, 10) : 0;
  });
  const navigate = useNavigate();

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save unread count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('unreadCount', unreadCount.toString());
  }, [unreadCount]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Create socket connection with auth token
    const newSocket = io('http://localhost:5400', {
      query: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('auth_result', (result) => {
      console.log('Authentication result:', result);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Store socket in state
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Listen for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      console.log('New notification received:', notification);
      
      // Play notification sound if available
      const notificationSound = document.getElementById('notification-sound');
      if (notificationSound) {
        notificationSound.play().catch(err => console.log('Error playing notification sound:', err));
      }
      
      // Add the new notification to the state
      setNotifications(prev => {
        // Check if notification already exists to prevent duplicates
        const exists = prev.some(n => 
          (n.id === notification._id) || 
          (n._id === notification._id) || 
          (notification.id && n.id === notification.id)
        );
        
        if (exists) {
          console.log('Notification already exists, not adding duplicate');
          return prev;
        }
        
        console.log('Adding new notification to state');
        
        // Add the new notification at the beginning of the array
        return [
          {
            ...notification,
            id: notification._id || notification.id, // Ensure consistent id field
            read: false
          },
          ...prev
        ];
      });
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);
    };

    // Debug socket connection
    console.log('Setting up notification listeners. Socket connected:', connected);
    
    socket.on('newNotification', handleNewNotification);
    
    // Also listen for unread_count updates from server
    socket.on('unread_count', data => {
      console.log('Received unread count update:', data);
      setUnreadCount(data.count);
    });

    return () => {
      socket.off('newNotification', handleNewNotification);
      socket.off('unread_count');
    };
  }, [socket, connected]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Inform server that notification was read
    if (socket && connected) {
      socket.emit('mark_notification_read', { notificationId });
    }
  }, [socket, connected]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
    
    // Inform server that all notifications were read
    if (socket && connected) {
      socket.emit('mark_all_notifications_read');
    }
  }, [socket, connected]);

  // Navigate to relevant page based on notification type
  const handleNotificationClick = useCallback((notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type and data
    switch (notification.type) {
      case 'message':
        navigate(`/messages/${notification.senderId}`);
        break;
      case 'booking':
        navigate(`/bookings/${notification.bookingId}`);
        break;
      case 'product':
        navigate(`/products/${notification.productId}`);
        break;
      case 'order':
        // For order notifications, just go to the orders tab instead of a specific order
        navigate('/orders');
        break;
      default:
        // For general notifications or when no specific route
        if (notification.link) {
          navigate(notification.link);
        }
    }
  }, [navigate, markAsRead]);

  // Send a notification (for testing or user-to-user notifications)
  const sendNotification = useCallback((data) => {
    if (socket && connected) {
      socket.emit('send_notification', data);
    }
  }, [socket, connected]);

  const value = {
    socket,
    connected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    handleNotificationClick,
    sendNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;