import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VendorDashboard.css';
import NotificationCenter from './components/NotificationCenter';
import { useNotifications } from './context/NotificationContext';

const BASE_URL = "http://localhost:5400/api";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState({
    total: 0,
    byFarmer: {} // Will store farmer IDs as keys and count as values
  });
  const sidebarRef = useRef(null);
  const { notifications } = useNotifications();

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const headers = {
        Authorization: `Bearer ${token}`
      };
      
      const response = await axios.get(`${BASE_URL}/messages/unread-count`, { headers });
      
      if (response.data.success) {
        const newUnreadCounts = {
          total: response.data.data.total || 0,
          byFarmer: response.data.data.byEntity || {}
        };
        
        if (newUnreadCounts.total > unreadMessages.total) {
          const newMessageCount = newUnreadCounts.total - unreadMessages.total;
          
          console.log(`${newMessageCount} new messages detected`);
        }
        
        setUnreadMessages(newUnreadCounts);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  }, [unreadMessages.total]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
  
      const headers = {
        Authorization: `Bearer ${token}`
      };
  
      let userData = null;
      try {
        const userResponse = await axios.get(`${BASE_URL}/users/me`, { headers });
        if (userResponse.data.success) {
          userData = userResponse.data.data.user;
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      }
  
      try {
        const profileResponse = await axios.get(`${BASE_URL}/vendors/me`, { headers });
        if (profileResponse.data.success) {
          let vendorData = profileResponse.data.data;
          
          if (userData && (typeof vendorData.user === 'string')) {
            vendorData = {
              ...vendorData,
              user: userData
            };
          }
          
          setVendorProfile(vendorData);
        }
      } catch (error) {
        console.error("Error fetching vendor profile", error);
        if (userData) {
          setVendorProfile({ user: userData });
        }
      }
  
      try {
        console.log("Fetching bookings...");
        const ordersResponse = await axios.get(`${BASE_URL}/bookings`, { headers });
        console.log("Bookings response:", ordersResponse.data);
        
        if (ordersResponse.data.success) {
          const ordersData = ordersResponse.data.data || [];
          
          const transformedOrders = ordersData.map(order => {
            const id = order._id || 'unknown';
            const orderIdSuffix = id.substr(-4).toUpperCase();
            
            console.log("Processing order:", order);
            
            return {
              id: id,
              orderId: `#ORD-${orderIdSuffix}`,
              farmer: order.farmer?.farmName || 
                     (typeof order.farmer === 'string' ? order.farmer.substr(0, 8) : "Unknown Farmer"),
              farmerId: typeof order.farmer === 'object' ? order.farmer?._id : order.farmer,
              product: order.product?.name || 
                      (typeof order.product === 'string' ? order.product.substr(0, 8) : "Unknown Product"),
              date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
              quantity: order.quantity || 0,
              totalPrice: order.totalPrice || 0,
              status: order.status || 'pending'
            };
          });
          
          console.log("Transformed orders:", transformedOrders);
          setOrders(transformedOrders);
        }
      } catch (error) {
        console.error("Error fetching orders", error);
        setOrders([]);
      }

      try {
        const farmersResponse = await axios.get(`${BASE_URL}/farmers`, { headers });
        if (farmersResponse.data.success) {
          const farmersData = farmersResponse.data.data || [];
          
          const transformedFarmers = farmersData.map(farmer => ({
            id: farmer._id,
            name: farmer.farmName || "Unknown Farm",
            location: farmer.farmLocation || "Unknown Location",
            cropTypes: farmer.cropTypes || [],
            rating: farmer.rating || 0
          }));
          
          setFarmers(transformedFarmers);
        }
      } catch (error) {
        console.error("Error fetching farmers", error);
        setFarmers([]);
      }

    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userType !== 'vendor') {
      sessionStorage.setItem('authRedirectMessage', 
        `You need a vendor account to access the vendor dashboard. You are currently logged in as a ${userType}.`);
      navigate('/login');
      return;
    }
    
    fetchDashboardData();
    fetchUnreadMessages();

    const messageCheckInterval = setInterval(() => {
      fetchUnreadMessages();
    }, 30000);

    const handleResize = () => {
      if (window.innerWidth > 992 && sidebarRef.current) {
        sidebarRef.current.classList.remove('open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(messageCheckInterval);
    };
  }, [navigate, fetchDashboardData, fetchUnreadMessages]);

  useEffect(() => {
    const bookingSuccess = sessionStorage.getItem('bookingSuccess');
    if (bookingSuccess) {
      sessionStorage.removeItem('bookingSuccess');
      
      console.log("Booking success:", bookingSuccess);
      
      fetchDashboardData();
      
      setActiveSection('orders');
    }
  }, [fetchDashboardData]);

  const toggleSidebar = () => {
    if (sidebarRef.current) {
      sidebarRef.current.classList.toggle('open');
    }
  };

  const handleTrackOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      alert("Order not found");
      return;
    }
    
    setActiveModal({
      type: 'tracking',
      data: order
    });
  };

  const handleViewOrderDetails = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      alert("Order not found");
      return;
    }
    
    setActiveModal({
      type: 'details',
      data: order
    });
  };

  const [activeModal, setActiveModal] = useState(null);

  const closeModal = () => {
    setActiveModal(null);
  };

  const SidebarItem = ({ icon, label, section, badgeCount }) => (
    <div 
      className={`sidebar-item ${activeSection === section ? 'active' : ''}`}
      onClick={() => setActiveSection(section)}
    >
      <span className="sidebar-icon">{icon}</span>
      <span>{label}</span>
      {section !== 'dashboard' && badgeCount > 0 && <span className="notification-badge sidebar-badge">{badgeCount}</span>}
    </div>
  );

  const StatCard = ({ icon, number, label }) => (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-number">{number}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );

  const renderDashboardContent = () => {
    return (
      <>
        <h2 className="content-title">Dashboard Overview</h2>
        
        <div className="stats-grid">
          <StatCard 
            icon={<i className="fas fa-shopping-cart"></i>} 
            number={orders.length} 
            label="Total Orders" 
          />
          <StatCard 
            icon={<i className="fas fa-check-circle"></i>} 
            number={orders.filter(order => order.status === 'delivered').length} 
            label="Completed Orders" 
          />
          <StatCard 
            icon={<i className="fas fa-users"></i>} 
            number={farmers.length} 
            label="Trusted Suppliers" 
          />
          <StatCard 
            icon={<i className="fas fa-envelope"></i>} 
            number={unreadMessages.total} 
            label="Unread Messages" 
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <Link to="/orders" className="view-all">View All</Link>
            </div>
            <div className="recent-orders">
              {orders.length > 0 ? (
                orders.slice(0, 3).map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <span className="order-id">{order.orderId}</span>
                      <span className="order-date">{order.date}</span>
                    </div>
                    <div className="order-customer">{order.farmer}</div>
                    <div className="order-amount">${order.totalPrice.toFixed(2)}</div>
                    <div className={`order-status-badge ${
                      order.status === 'delivered' ? 'success' : 
                      order.status === 'cancelled' ? 'cancelled' : 
                      order.status === 'shipped' ? 'shipped' : 
                      order.status === 'confirmed' ? 'confirmed' : 'processing'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No recent orders</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Notifications</h3>
              <Link to="/notifications" className="view-all">View All</Link>
            </div>
            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="notification-item">
                    <div className="notification-icon">
                      <i className={`fas fa-${notification.type === 'order' ? 'shopping-cart' : 
                                      notification.type === 'message' ? 'envelope' : 
                                      notification.type === 'product' ? 'box' : 'bell'}`}></i>
                    </div>
                    <div className="notification-content">
                      <div className="notification-text">{notification.message || notification.title}</div>
                      <div className="notification-time">
                        {typeof notification.timestamp === 'string' 
                          ? new Date(notification.timestamp).toLocaleDateString() 
                          : notification.timestamp instanceof Date 
                            ? notification.timestamp.toLocaleDateString()
                            : 'Just now'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Trusted Suppliers</h3>
              <Link to="/suppliers" className="view-all">View All</Link>
            </div>
            <div className="recent-orders">
              {farmers.length > 0 ? (
                farmers.slice(0, 3).map(farmer => (
                  <div key={farmer.id} className="order-item">
                    <div className="order-info">
                      <span className="order-id">
                        {farmer.name}
                        {unreadMessages.byFarmer[farmer.id] > 0 && (
                          <span className="message-count-badge" style={{marginLeft: "5px"}}>
                            {unreadMessages.byFarmer[farmer.id]}
                          </span>
                        )}
                      </span>
                      <span className="order-date">{farmer.location}</span>
                    </div>
                    <Link to={`/marketplace?farmer=${farmer.id}`} className="btn-outline" style={{padding: '0.25rem 0.5rem', fontSize: '0.75rem'}}>
                      View Products
                    </Link>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No trusted suppliers</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderMarketplaceContent = () => {
    return (
      <>
        <h2 className="content-title">Marketplace</h2>
        <p style={{marginBottom: '1rem'}}>Browse agricultural products from trusted farmers</p>
        <Link to="/marketplace" className="btn-primary" style={{display: 'inline-block'}}>
          Go to Marketplace
        </Link>
      </>
    );
  };

  const renderOrdersContent = () => {
    return (
      <>
        <h2 className="content-title">My Orders</h2>
        
        {orders.length > 0 ? (
          <div className="suppliers-grid">
            {orders.map(order => (
              <div key={order.id} className="supplier-card">
                <div className="supplier-card-header">
                  <div className="supplier-avatar">
                    <i className="fas fa-shopping-cart"></i>
                  </div>
                  <div>
                    <h3 className="supplier-name">{order.orderId}</h3>
                    <p className="supplier-type">{order.date}</p>
                  </div>
                </div>
                <div className="supplier-location">
                  <i className="fas fa-user"></i> {order.farmer}
                </div>
                <div style={{marginBottom: '1rem'}}>
                  <p><strong>Product:</strong> {order.product}</p>
                  <p><strong>Quantity:</strong> {order.quantity}</p>
                  <p><strong>Total:</strong> ${order.totalPrice}</p>
                  <p><strong>Status:</strong> 
                    <span className={`order-status-badge ${
                      order.status === 'delivered' ? 'success' : 
                      order.status === 'cancelled' ? 'cancelled' : 
                      order.status === 'shipped' ? 'shipped' : 
                      order.status === 'confirmed' ? 'confirmed' : 'processing'
                    }`} style={{marginLeft: '0.5rem'}}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div className="supplier-actions">
                  <button 
                    className="btn-outline"
                    onClick={() => handleTrackOrder(order.id)}
                  >
                    Track Order
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => handleViewOrderDetails(order.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state center">
            <i className="fas fa-shopping-cart empty-icon"></i>
            <p>No orders found</p>
            <p className="empty-subtext">Your orders will appear here once you place them</p>
            <Link to="/marketplace" className="btn-primary" style={{marginTop: '1rem'}}>Browse Marketplace</Link>
          </div>
        )}
      </>
    );
  };

  const renderSuppliersContent = () => {
    return (
      <>
        <h2 className="content-title">Trusted Suppliers</h2>
        
        {farmers.length > 0 ? (
          <div className="suppliers-grid">
            {farmers.map(farmer => (
              <div key={farmer.id} className="supplier-card">
                <div className="supplier-card-header">
                  <div className="supplier-avatar">
                    {farmer.name.charAt(0)}
                    {unreadMessages.byFarmer[farmer.id] > 0 && (
                      <span className="supplier-message-indicator"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="supplier-name">
                      {farmer.name}
                      {unreadMessages.byFarmer[farmer.id] > 0 && (
                        <span className="message-count-badge">{unreadMessages.byFarmer[farmer.id]}</span>
                      )}
                    </h3>
                    <p className="supplier-type">Farm</p>
                  </div>
                </div>
                <div className="supplier-location">
                  <i className="fas fa-map-marker-alt"></i> {farmer.location}
                </div>
                <div style={{marginBottom: '1rem'}}>
                  {farmer.cropTypes.length > 0 && (
                    <div style={{marginBottom: '0.5rem'}}>
                      <strong>Crops:</strong>
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem'}}>
                        {farmer.cropTypes.map((crop, index) => (
                          <span key={index} style={{
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem'
                          }}>
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p><strong>Rating:</strong> {farmer.rating}/5</p>
                </div>
                <div className="supplier-actions">
                <button 
                  className={`btn-outline ${unreadMessages.byFarmer[farmer.id] > 0 ? 'has-unread' : ''}`}
                  onClick={() => navigate(`/messages?recipient=${farmer.id}`)}
                >
                  {unreadMessages.byFarmer[farmer.id] > 0 ? (
                    <>Contact <span className="message-dot"></span></>
                  ) : 'Contact'}
                </button>
                <Link 
                  to={`/marketplace?farmer=${farmer.id}`} 
                  className="btn-primary"
                >
                  View Products
                </Link>
              </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state center">
            <i className="fas fa-users empty-icon"></i>
            <p>No trusted suppliers found</p>
            <p className="empty-subtext">Discover new farmers to connect with</p>
            <Link to="/suppliers/discovery" className="btn-primary" style={{marginTop: '1rem'}}>Discover Suppliers</Link>
          </div>
        )}
      </>
    );
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'marketplace':
        return renderMarketplaceContent();
      case 'orders':
        return renderOrdersContent();
      case 'suppliers':
        return renderSuppliersContent();
      default:
        return renderDashboardContent();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button className="btn-primary" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <button className="mobile-menu-toggle" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
      
      <aside className="sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo">AC</div>
            <span className="logo-text">AgriConnect</span>
            {/* Removing any potential notification badge here */}
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <SidebarItem 
            icon={<i className="fas fa-home"></i>} 
            label="Dashboard" 
            section="dashboard" 
          />
          <SidebarItem 
            icon={<i className="fas fa-th-list"></i>} 
            label="Marketplace" 
            section="marketplace" 
          />
          <SidebarItem 
            icon={<i className="fas fa-shopping-cart"></i>} 
            label="My Orders" 
            section="orders" 
          />
          <SidebarItem 
            icon={<i className="fas fa-users"></i>} 
            label="Trusted Suppliers" 
            section="suppliers"
          />
        </nav>
        
        <div className="sidebar-footer">
          <button 
            className="logout-button" 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('userType');
              navigate('/login');
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Log Out
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <h1 className="dashboard-title">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
            <p className="dashboard-date">{new Date().toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}</p>
          </div>
          <div className="header-right">
            <div className="search-container">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search..." />
            </div>
            <NotificationCenter notifications={notifications} />
            <div className="user-profile">
              <div className="user-avatar">
                {vendorProfile?.user?.name 
                  ? vendorProfile.user.name.charAt(0).toUpperCase()
                  : "?"}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {vendorProfile?.user?.name || "Update Profile"}
                </span>
                <span className="user-role">Vendor</span>
              </div>
            </div>
          </div>
        </header>
        
        <div className="content-container">
          {renderContent()}
        </div>
      </main>

      {activeModal && activeModal.type === 'tracking' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Order Tracking: {activeModal.data.orderId}</h3>
              <button className="close-modal" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="tracking-timeline">
                <div className={`tracking-step ${activeModal.data.status !== 'cancelled' ? 'completed' : 'cancelled'}`}>
                  <div className="step-icon">
                    <i className="fas fa-file-invoice"></i>
                  </div>
                  <div className="step-info">
                    <h4>Order Placed</h4>
                    <p>{activeModal.data.date}</p>
                  </div>
                </div>
                
                <div className={`tracking-step ${
                  activeModal.data.status === 'processing' || 
                  activeModal.data.status === 'confirmed' || 
                  activeModal.data.status === 'shipped' || 
                  activeModal.data.status === 'delivered' ? 'completed' : ''
                }`}>
                  <div className="step-icon">
                    <i className="fas fa-clipboard-check"></i>
                  </div>
                  <div className="step-info">
                    <h4>Processing</h4>
                    <p>Order is being prepared by the farmer</p>
                  </div>
                </div>
                
                <div className={`tracking-step ${
                  activeModal.data.status === 'confirmed' || 
                  activeModal.data.status === 'shipped' || 
                  activeModal.data.status === 'delivered' ? 'completed' : ''
                }`}>
                  <div className="step-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="step-info">
                    <h4>Confirmed</h4>
                    <p>Order has been confirmed</p>
                  </div>
                </div>
                
                <div className={`tracking-step ${
                  activeModal.data.status === 'shipped' || 
                  activeModal.data.status === 'delivered' ? 'completed' : ''
                }`}>
                  <div className="step-icon">
                    <i className="fas fa-truck"></i>
                  </div>
                  <div className="step-info">
                    <h4>Shipped</h4>
                    <p>Your order is on the way</p>
                  </div>
                </div>
                
                <div className={`tracking-step ${activeModal.data.status === 'delivered' ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <i className="fas fa-box-open"></i>
                  </div>
                  <div className="step-info">
                    <h4>Delivered</h4>
                    <p>Order completed successfully</p>
                  </div>
                </div>
              </div>
              
              <div className="tracking-details">
                <p>
                  <strong>Estimated Delivery:</strong> {new Date(new Date(activeModal.data.date).getTime() + 5*24*60*60*1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal && activeModal.type === 'details' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Order Details: {activeModal.data.orderId}</h3>
              <button className="close-modal" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="order-detail-section">
                <h4>Order Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{activeModal.data.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date Placed:</span>
                  <span className="detail-value">{activeModal.data.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`order-status-badge ${
                    activeModal.data.status === 'delivered' ? 'success' : 
                    activeModal.data.status === 'cancelled' ? 'cancelled' : 
                    activeModal.data.status === 'shipped' ? 'shipped' : 
                    activeModal.data.status === 'confirmed' ? 'confirmed' : 'processing'
                  }`}>
                    {activeModal.data.status.charAt(0).toUpperCase() + activeModal.data.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="order-detail-section">
                <h4>Product Details</h4>
                <div className="detail-row">
                  <span className="detail-label">Product:</span>
                  <span className="detail-value">{activeModal.data.product}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{activeModal.data.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Price per Unit:</span>
                  <span className="detail-value">${(activeModal.data.totalPrice / activeModal.data.quantity).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Price:</span>
                  <span className="detail-value">${activeModal.data.totalPrice}</span>
                </div>
              </div>
              
              <div className="order-detail-section">
                <h4>Supplier Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Farmer:</span>
                  <span className="detail-value">{activeModal.data.farmer}</span>
                </div>
                <div className="order-detail-actions">
                  <button 
                    className={`btn-outline ${unreadMessages.byFarmer[activeModal.data.farmerId] > 0 ? 'has-unread' : ''}`}
                    onClick={() => {
                      closeModal();
                      navigate(`/messages?recipient=${activeModal.data.farmerId || ''}`);
                    }}
                  >
                    {unreadMessages.byFarmer[activeModal.data.farmerId] > 0 ? (
                      <><i className="fas fa-envelope"></i> Contact Farmer <span className="message-dot"></span></>
                    ) : (
                      <><i className="fas fa-envelope"></i> Contact Farmer</>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;