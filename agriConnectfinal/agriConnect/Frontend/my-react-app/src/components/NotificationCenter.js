import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Badge, Button, Dropdown, List, Avatar, Typography, Empty, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import './NotificationCenter.css';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

const { Text } = Typography;

const NotificationCenter = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    handleNotificationClick 
  } = useNotifications();
  
  const [open, setOpen] = useState(false);

  const handleOpenChange = (flag) => {
    setOpen(flag);
    // Mark notifications as read when dropdown is opened
    if (flag && unreadCount > 0) {
      // Don't mark all as read automatically, just visual indication
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <Avatar style={{ backgroundColor: '#1890ff' }}>M</Avatar>;
      case 'booking':
        return <Avatar style={{ backgroundColor: '#52c41a' }}>B</Avatar>;
      case 'product':
        return <Avatar style={{ backgroundColor: '#faad14' }}>P</Avatar>;
      case 'order':
        return <Avatar style={{ backgroundColor: '#722ed1' }}>O</Avatar>;
      default:
        return <Avatar style={{ backgroundColor: '#f5222d' }}>N</Avatar>;
    }
  };

  const items = [
    {
      key: 'notification-menu',
      label: (
        <div className="notification-dropdown">
          <div className="notification-header">
            <Text strong>Notifications</Text>
            {notifications.length > 0 && (
              <div className="notification-actions">
                <Tooltip title="Mark all as read">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<CheckOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                  />
                </Tooltip>
              </div>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={notifications}
                renderItem={(notification) => (
                  <List.Item 
                    className={notification.read ? 'notification-item' : 'notification-item unread'}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <List.Item.Meta
                      avatar={getNotificationIcon(notification.type)}
                      title={notification.title}
                      description={
                        <div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-time">
                            {notification.timestamp && formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                      }
                    />
                    <Tooltip title="Mark as read">
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<CheckOutlined />} 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        style={{ visibility: notification.read ? 'hidden' : 'visible' }}
                      />
                    </Tooltip>
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No notifications" 
                className="notification-empty"
              />
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={['click']}
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      overlayClassName="notification-dropdown-container"
    >
      <Badge count={unreadCount} overflowCount={99}>
        <Button 
          type="text" 
          icon={<BellOutlined style={{ fontSize: '20px' }} />} 
          className="notification-bell"
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter;
