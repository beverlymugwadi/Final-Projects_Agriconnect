import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import './Orders.css';

const BASE_URL = "http://localhost:5400/api";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [userType, setUserType] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userTypeFromStorage = localStorage.getItem('userType');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    setUserType(userTypeFromStorage);
    fetchOrders();
  }, [navigate]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      // Get the user data to determine if they're a farmer or vendor
      const userResponse = await axios.get(`${BASE_URL}/users/me`, { headers });
      const userType = userResponse.data.data.user.userType;
      
      // If user type doesn't match route requirements, redirect
      if (!['farmer', 'vendor'].includes(userType)) {
        navigate('/login');
        return;
      }
      
      // Fetch orders (bookings)
      const response = await axios.get(`${BASE_URL}/bookings`, { headers });
      
      if (response.data.success) {
        // Transform the bookings data to a consistent format
        const formattedOrders = response.data.data.map(order => ({
          id: order._id,
          orderId: `#ORD-${order._id.substr(-4).toUpperCase()}`,
          date: new Date(order.createdAt).toLocaleDateString(),
          timestamp: new Date(order.createdAt),
          product: order.product?.name || 'Unknown Product',
          quantity: order.quantity || 0,
          totalPrice: order.totalPrice || 0,
          status: order.status || 'pending',
          customer: userType === 'farmer' ? 
            (order.vendor?.businessName || 'Unknown Vendor') : 
            (order.farmer?.farmName || 'Unknown Farmer'),
          deliveryAddress: order.deliveryAddress || '',
          canEdit: userType === 'farmer' // Only farmers can edit order status
        }));
        
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
      
      // If authentication fails, redirect to login
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      await axios.put(
        `${BASE_URL}/bookings/${orderId}`,
        { status: newStatus },
        { headers }
      );
      
      // Show success toast notification
      setToast({
        visible: true,
        message: `Order status updated to ${newStatus}`,
        type: 'success'
      });
      
      // Refresh orders after update
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setToast({
        visible: true,
        message: 'Failed to update order status. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on selected status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const getStatusClass = (status) => {
    switch (status) {
      case 'processing': return 'status-processing';
      case 'confirmed': return 'status-confirmed';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading state
  if (loading) {
    return (
      <div className="orders-container loading">
        <div className="loader"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="orders-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="reload-btn" onClick={fetchOrders}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Orders Management</h1>
        <div className="orders-filter">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      {filteredOrders.length > 0 ? (
        <div className="orders-table">
          <div className="orders-table-header">
            <div className="order-cell">Order ID</div>
            <div className="order-cell">Date</div>
            <div className="order-cell">Product</div>
            <div className="order-cell">Quantity</div>
            <div className="order-cell">Total</div>
            <div className="order-cell">Status</div>
            {userType === 'farmer' && <div className="order-cell">Actions</div>}
          </div>
          
          {filteredOrders.map(order => (
            <div className="orders-table-row" key={order.id}>
              <div className="order-cell order-id">{order.orderId}</div>
              <div className="order-cell">{order.date}</div>
              <div className="order-cell">{order.product}</div>
              <div className="order-cell">{order.quantity}</div>
              <div className="order-cell">${order.totalPrice.toFixed(2)}</div>
              <div className="order-cell">
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              {userType === 'farmer' && (
                <div className="order-cell actions">
                  <select 
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    disabled={order.status === 'delivered' || order.status === 'cancelled'}
                  >
                    <option value="processing">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-orders">
          <p>No orders found with the selected filter.</p>
        </div>
      )}
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ visible: false, message: '', type: 'success' })}
      />
    </div>
  );
};

export default Orders;