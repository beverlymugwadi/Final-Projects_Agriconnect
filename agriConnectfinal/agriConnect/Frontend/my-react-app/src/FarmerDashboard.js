import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./FarmerDashboard.css";
import NotificationCenter from "./components/NotificationCenter";
import Toast from "./components/Toast";
import { useNotifications } from "./context/NotificationContext";

const BASE_URL = "http://localhost:5400/api";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [salesSummary, setSalesSummary] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [orders, setOrders] = useState({ fulfilled: 0, pending: 0, items: [] });
  const [inventory, setInventory] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const sidebarRef = useRef(null);
  const { notifications, socket } = useNotifications();

  useEffect(() => {
    fetchDashboardData();

    // Add event listener for mobile sidebar toggle
    const handleResize = () => {
      if (window.innerWidth > 992 && sidebarRef.current) {
        sidebarRef.current.classList.remove('open');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for inventory updates via socket
  useEffect(() => {
    if (!socket) return;

    // Handle inventory updates
    const handleInventoryUpdate = (data) => {
      console.log('Inventory update received:', data);
      
      // Update the inventory item in state
      setInventory(prevInventory => 
        prevInventory.map(item => {
          if (item.id === data.productId) {
            return {
              ...item,
              stock: data.newQuantity,
              status: data.newQuantity > 10 ? "in-stock" : "low-stock"
            };
          }
          return item;
        })
      );
    };

    socket.on('inventoryUpdate', handleInventoryUpdate);

    // Clean up the event listener when component unmounts
    return () => {
      socket.off('inventoryUpdate', handleInventoryUpdate);
    };
  }, [socket]);

  const toggleSidebar = () => {
    if (sidebarRef.current) {
      sidebarRef.current.classList.toggle('open');
    }
  };

  const fetchDashboardData = async () => {
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
  
      // STEP 1: Get the user data FIRST - FIXED ENDPOINT
      let userData = null;
      try {
        console.log("Fetching user data...");
        // Change from /auth/me to /users/me
        const userResponse = await axios.get(`${BASE_URL}/users/me`, { headers });
        
        if (userResponse.data.success) {
          // The user data is in the user property of the response
          userData = userResponse.data.data.user;
          console.log("User data retrieved:", userData);
        }
      } catch (error) {
        console.error("Error fetching user data", error);
      }
  
      // STEP 2: Then fetch farmer profile and integrate user data
      try {
        console.log("Fetching farmer profile...");
        const profileResponse = await axios.get(`${BASE_URL}/farmers/me`, { headers });
        
        if (profileResponse.data.success) {
          let farmerData = profileResponse.data.data;
          
          // Looking at your logs, farmerData.user is just the ID string
          // We need to replace it with the full user object
          if (userData && (typeof farmerData.user === 'string')) {
            farmerData = {
              ...farmerData,
              user: userData
            };
            console.log("Integrated user data with farmer profile");
          }
          
          console.log("Setting farmer profile:", farmerData);
          setFarmerProfile(farmerData);
          console.log("FINAL FARMER PROFILE SET:", farmerData);
        } else {
          // If we have user data but no farmer profile
          if (userData) {
            console.log("No farmer profile found, creating minimal profile with user data");
            setFarmerProfile({ user: userData });
          }
        }
      } catch (error) {
        console.error("Error fetching farmer profile", error);
        // If we at least have user data, create a minimal profile object
        if (userData) {
          console.log("Error with farmer profile, using minimal profile with user data");
          setFarmerProfile({ user: userData });
        }
      }
      // // Fetch farmer profile with user information
      // const profileResponse = await axios.get(`${BASE_URL}/farmers/me`, { headers });
      // if (profileResponse.data.success) {
      //   // Fetch the user details if not already populated
      //   let farmerData = profileResponse.data.data;
        
      //   if (!farmerData.user || typeof farmerData.user !== 'object') {
      //     try {
      //       const userResponse = await axios.get(`${BASE_URL}/auth/me`, { headers });
      //       if (userResponse.data.success) {
      //         farmerData = {
      //           ...farmerData,
      //           user: userResponse.data.data
      //         };
      //       }
      //     } catch (error) {
      //       console.error("Error fetching user data", error);
      //     }
      //   }
        
      //   setFarmerProfile(farmerData);
      // }

      // Fetch products for inventory
      const productsResponse = await axios.get(`${BASE_URL}/products`, { headers });
      if (productsResponse.data.success) {
        const products = productsResponse.data.data || [];
        
        // Transform products data for the inventory display
        const inventoryItems = products.map(product => ({
          id: product._id,
          name: product.name,
          stock: product.availableQuantity,
          unit: product.unit,
          status: product.availableQuantity > 10 ? "in-stock" : "low-stock",
          category: product.category,
          price: product.price,
          description: product.description
        }));
        
        setInventory(inventoryItems);
      }

      // Fetch orders data
      try {
        console.log("Fetching farmer's bookings...");
        const ordersResponse = await axios.get(`${BASE_URL}/bookings`, { headers });
        console.log("Bookings response:", ordersResponse.data);
        
        if (ordersResponse.data.success) {
          const ordersData = ordersResponse.data.data || [];
          
          // Transform orders data to match the expected format
          const orderItems = ordersData.map(order => {
            console.log("Processing order with vendor:", order.vendor); // Debug line
            return {
              id: order._id,
              orderId: `#ORD-${order._id.substr(-4).toUpperCase()}`,
              customer: order.vendor?.businessName || 
                       order.vendor?.companyName || 
                       (typeof order.vendor === 'object' ? order.vendor.user?.name : "Unknown Vendor"),
              vendorId: order.vendor?._id || (typeof order.vendor === 'string' ? order.vendor : null),
              date: new Date(order.createdAt).toLocaleDateString(),
              timestamp: new Date(order.createdAt),
              amount: order.totalPrice || 0,
              quantity: order.quantity || 0,
              productId: order.product?._id || (typeof order.product === 'string' ? order.product : null),
              productName: order.product?.name || "Unknown Product",
              status: order.status || 'pending',
              paymentStatus: order.paymentStatus || 'pending',
              deliveryAddress: order.deliveryAddress || ''
            };
          });
          
          console.log("Transformed order items:", orderItems);
          
          // Count orders by status
          const orderStatusCount = {
            fulfilled: orderItems.filter(order => order.status === 'delivered').length,
            pending: orderItems.filter(order => order.status !== 'delivered').length,
            items: orderItems
          };
          
          setOrders(orderStatusCount);
        }
      } catch (error) {
        console.error("Bookings data not available", error);
        console.error("Error details:", error.response?.data || error.message);
        // Fallback if orders endpoint fails
        setOrders({
          fulfilled: 0,
          pending: 0,
          items: []
        });
      }

      // Fetch sales summary if available
      try {
        const salesResponse = await axios.get(`${BASE_URL}/sales/summary`, { headers });
        if (salesResponse.data.success) {
          const { totalSales } = salesResponse.data;
          
          // Calculate monthly, weekly, daily approximations if not directly provided
          setSalesSummary({
            monthly: totalSales || 0,
            weekly: Math.round(totalSales / 4) || 0,
            daily: Math.round(totalSales / 30) || 0
          });
        } else {
          // If endpoint exists but returns no success, calculate from orders
          const totalSales = orders.items.reduce((sum, order) => sum + order.amount, 0);
          setSalesSummary({
            monthly: totalSales,
            weekly: Math.round(totalSales / 4),
            daily: Math.round(totalSales / 30)
          });
        }
      } catch (error) {
        console.error("Sales data not available", error);
        // Calculate from orders if available instead of using hardcoded values
        const totalSales = orders.items.reduce((sum, order) => sum + (order.amount || 0), 0);
        setSalesSummary({
          monthly: totalSales,
          weekly: Math.round(totalSales / 4),
          daily: Math.round(totalSales / 30)
        });
      }

      // Fetch vendors if available
      try {
        const vendorsResponse = await axios.get(`${BASE_URL}/vendors`, { headers });
        if (vendorsResponse.data.success) {
          const vendorsList = vendorsResponse.data.data || [];
          
          // Transform vendors data
          const formattedVendors = vendorsList.map(vendor => ({
            id: vendor._id,
            name: vendor.businessName || "Unnamed Business",
            type: vendor.businessType || "Unknown Type",
            location: vendor.businessLocation || "Unknown Location",
            preferredProducts: vendor.preferredProducts || [],
            capacity: vendor.purchaseCapacity
          }));
          
          setVendors(formattedVendors);
        }
      } catch (error) {
        console.error("Vendors data not available", error);
        // Empty array instead of hardcoded sample data
        setVendors([]);
      }

      // Fetch notifications/messages if available
      try {
        const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, { headers });
        if (notificationsResponse.data.success) {
          const notificationsList = notificationsResponse.data.data || [];
          
          console.log(`Found ${notificationsList.length} notifications from API`);
        }
      } catch (error) {
        console.error("Notifications not available", error);
        
        // Generate system notifications based on inventory instead of hardcoded data
        const systemNotifications = [];
        
        // Add low stock notifications
        const lowStockItems = inventory.filter(item => item.status === 'low-stock');
        lowStockItems.forEach((item, index) => {
          systemNotifications.push({
            id: `sys-${index}`,
            text: `${item.name} is running low on stock (${item.stock} ${item.unit} remaining)`,
            timestamp: new Date(),
            type: 'inventory'
          });
        });
        
        // Add recent order notifications if we have order data
        orders.items.slice(0, 3).forEach((order, index) => {
          systemNotifications.push({
            id: `order-${index}`,
            text: `New order ${order.orderId} received from ${order.customer}`,
            timestamp: order.timestamp,
            type: 'order'
          });
        });
        
        console.log(`Generated ${systemNotifications.length} system notifications`);
      }

    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const SidebarItem = ({ icon, label, section }) => (
    <div 
      className={`sidebar-item ${activeSection === section ? 'active' : ''}`}
      onClick={() => setActiveSection(section)}
    >
      <span className="sidebar-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );

  const StatCard = ({ icon, number, label, trend }) => (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-number">{number}</div>
        <div className="stat-label">{label}</div>
      </div>
      {trend && (
        <div className={`stat-trend ${trend.direction}`}>
          {trend.value}%
        </div>
      )}
    </div>
  );

  const renderDashboardContent = () => {
    // Calculate trends based on actual data rather than hardcoded values
    // If we don't have historical data, don't show trends
    
    return (
      <>
        <h2 className="content-title">Dashboard Overview</h2>
        
        <div className="stats-grid">
          <StatCard 
            icon={<i className="fas fa-shopping-cart"></i>} 
            number={orders.fulfilled + orders.pending} 
            label="Total Orders" 
          />
          <StatCard 
            icon={<i className="fas fa-dollar-sign"></i>} 
            number={`$${salesSummary.monthly.toLocaleString()}`} 
            label="Monthly Sales" 
          />
          <StatCard 
            icon={<i className="fas fa-warehouse"></i>} 
            number={inventory.length} 
            label="Inventory Items" 
          />
          <StatCard 
            icon={<i className="fas fa-users"></i>} 
            number={vendors.length} 
            label="Vendor Connections" 
          />
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card chart-card">
            <div className="card-header">
              <h3>Sales Overview</h3>
              <div className="time-filter">
                <span className="active">Week</span>
                <span>Month</span>
                <span>Year</span>
              </div>
            </div>
            <div className="chart-placeholder">
              {orders.items.length > 0 ? (
                <div className="chart-bars">
                  {/* Generate chart data based on actual order history */}
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    // This is a placeholder calculation - in a real app, you'd analyze order dates
                    const height = orders.items.length > index 
                      ? `${Math.min(30 + (orders.items[index]?.amount || 0) / 10, 95)}%` 
                      : '20%';
                    
                    return (
                      <div 
                        key={day} 
                        className={`chart-bar ${index === 3 ? 'highlight' : ''}`} 
                        style={{height}}
                      >
                        <span>{day}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No sales data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <Link to="/orders" className="view-all">View All</Link>
            </div>
            <div className="recent-orders">
              {orders.items.length > 0 ? (
                // Use actual order data
                orders.items.slice(0, 3).map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-info">
                      <span className="order-id">{order.orderId}</span>
                      <span className="order-date">{order.date}</span>
                    </div>
                    <div className="order-customer">{order.customer}</div>
                    <div className="order-amount">${order.amount.toFixed(2)}</div>
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
        </div>

        <div className="dashboard-row">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Inventory Status</h3>
              <Link to="/manage-inventory" className="view-all">Manage</Link>
            </div>
            <div className="inventory-table">
              <div className="inventory-item header">
                <div className="inventory-name">Product</div>
                <div className="inventory-stock">Stock</div>
                <div className="inventory-status">Status</div>
              </div>
              {inventory.length > 0 ? (
                inventory.slice(0, 4).map((item) => (
                  <div key={item.id} className="inventory-item">
                    <div className="inventory-name">{item.name}</div>
                    <div className="inventory-stock">{item.stock} {item.unit}</div>
                    <div className={`inventory-status-badge ${item.status}`}>
                      {item.status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No inventory items</p>
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
                      <i className={`fas fa-${notification.type === 'order' ? 'shopping-cart' : 'bell'}`}></i>
                    </div>
                    <div className="notification-content">
                      <div className="notification-text">{notification.message || notification.text}</div>
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
      </>
    );
  };

  const renderInventoryContent = () => {
    return (
      <>
        <div className="content-header">
          <h2 className="content-title">Inventory Management</h2>
          <Link to="/add-product" className="action-button">
            <i className="fas fa-plus"></i> Add New Product
          </Link>
        </div>

        <div className="inventory-quick-stats">
          <div className="quick-stat">
            <div className="quick-stat-number">{inventory.length}</div>
            <div className="quick-stat-label">Total Products</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-number">
              {inventory.filter(item => item.status === 'low-stock').length}
            </div>
            <div className="quick-stat-label">Low Stock Items</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-number">
              {inventory.filter(item => item.status === 'in-stock').length}
            </div>
            <div className="quick-stat-label">In Stock</div>
          </div>
        </div>

        <div className="dashboard-card full-width">
          {inventory.length > 0 ? (
            <div className="inventory-full-table">
              <div className="inventory-row header">
                <div className="inventory-cell">Product Name</div>
                <div className="inventory-cell">Stock</div>
                <div className="inventory-cell">Status</div>
                <div className="inventory-cell">Actions</div>
              </div>
              {inventory.map((item) => (
                <div key={item.id} className="inventory-row">
                  <div className="inventory-cell">{item.name}</div>
                  <div className="inventory-cell">{item.stock} {item.unit}</div>
                  <div className="inventory-cell">
                    <span className={`status-badge ${item.status}`}>
                      {item.status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                    </span>
                  </div>
                  <div className="inventory-cell actions">
                    <Link to={`/edit-product/${item.id}`} className="btn-icon">
                      <i className="fas fa-edit"></i>
                    </Link>
                    <button 
                      className="btn-icon"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this product?')) {
                          try {
                            const token = localStorage.getItem('token');
                            await axios.delete(`${BASE_URL}/products/${item.id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            // Refresh inventory after deletion
                            fetchDashboardData();
                          } catch (error) {
                            console.error("Error deleting product", error);
                            alert("Failed to delete product");
                          }
                        }
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state center">
              <i className="fas fa-box-open empty-icon"></i>
              <p>No inventory items found</p>
              <Link to="/add-product" className="btn-primary">Add Your First Product</Link>
            </div>
          )}
        </div>
      </>
    );
  };
  // Close modal handler
  const closeModal = () => {
    setActiveModal(null);
    setActiveOrder(null);
    setUpdatedStatus('');
  };

  // View Order Details handler
  const handleViewOrderDetails = (order) => {
    setActiveOrder(order);
    setActiveModal('details');
  };

  // Update Order Status handler
  const handleUpdateStatus = (order) => {
    setActiveOrder(order);
    setUpdatedStatus(order.status);
    setActiveModal('status');
  };

  // Save Updated Status
  const saveUpdatedStatus = async () => {
    if (!activeOrder || !updatedStatus) return;
    
    try {
      console.log('Updating order status:', {
        orderId: activeOrder.id,
        newStatus: updatedStatus
      });
      
      const token = localStorage.getItem('token');
      
      // Send the update request
      const response = await axios.put(
        `${BASE_URL}/bookings/${activeOrder.id}`,
        { status: updatedStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Update status response:', response.data);
      
      // Close the modal
      closeModal();
      
      // Show success toast notification
      setToast({
        visible: true,
        message: `Order status updated to ${updatedStatus}`,
        type: 'success'
      });
      
      // IMPORTANT: Refresh all dashboard data to ensure consistent state
      fetchDashboardData();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        setToast({
          visible: true,
          message: `Failed to update order status: ${error.response.data.message || 'Server error'}`,
          type: 'error'
        });
      } else if (error.request) {
        console.error('No response received:', error.request);
        setToast({
          visible: true,
          message: 'Failed to update order status: No response received from server',
          type: 'error'
        });
      } else {
        console.error('Error message:', error.message);
        setToast({
          visible: true,
          message: `Failed to update order status: ${error.message}`,
          type: 'error'
        });
      }
    }
  };

// Replace the renderOrdersContent function

const renderOrdersContent = () => {
  return (
    <>
      <div className="content-header">
        <h2 className="content-title">Orders Management</h2>
        <div className="filter-controls">
          <select className="filter-select" onChange={(e) => {
            // Filter orders if needed
            console.log("Filter selected:", e.target.value);
          }}>
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
  
      <div className="dashboard-card full-width">
        {orders.items.length > 0 ? (
          <div className="orders-table">
            <div className="orders-row header">
              <div className="orders-cell">Order ID</div>
              <div className="orders-cell">Customer</div>
              <div className="orders-cell">Product</div>
              <div className="orders-cell">Quantity</div>
              <div className="orders-cell">Amount</div>
              <div className="orders-cell">Date</div>
              <div className="orders-cell">Status</div>
              <div className="orders-cell">Actions</div>
            </div>
            {orders.items.map(order => (
              <div key={order.id} className="orders-row">
                <div className="orders-cell">{order.orderId}</div>
                <div className="orders-cell">{order.customer}</div>
                <div className="orders-cell">{order.productName}</div>
                <div className="orders-cell">{order.quantity}</div>
                <div className="orders-cell">${order.amount.toFixed(2)}</div>
                <div className="orders-cell">{order.date}</div>
                <div className="orders-cell">
                <span className={`status-badge ${
                  order.status === 'delivered' ? 'success' : 
                  order.status === 'cancelled' ? 'cancelled' : 
                  order.status === 'shipped' ? 'shipped' : 
                  order.status === 'confirmed' ? 'confirmed' : 'processing'
                }`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                </div>
                <div className="orders-cell actions">
                  <button 
                    className="btn-icon" 
                    onClick={() => handleViewOrderDetails(order)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={() => handleUpdateStatus(order)}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state center">
            <i className="fas fa-shopping-cart empty-icon"></i>
            <p>No orders found</p>
            <p className="empty-subtext">Orders will appear here once vendors place them</p>
          </div>
        )}
      </div>
      
      {/* Order Details Modal */}
      {activeModal === 'details' && activeOrder && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Order Details: {activeOrder.orderId}</h3>
              <button className="close-modal" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="order-detail-section">
                <h4>Order Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{activeOrder.orderId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date Placed:</span>
                  <span className="detail-value">{activeOrder.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`order-status-badge ${
                  activeOrder.status === 'delivered' ? 'success' : 
                  activeOrder.status === 'cancelled' ? 'cancelled' : 
                  activeOrder.status === 'shipped' ? 'shipped' : 
                  activeOrder.status === 'confirmed' ? 'confirmed' : 'processing'
                }`}>
                  {activeOrder.status.charAt(0).toUpperCase() + activeOrder.status.slice(1)}
                </span>
                </div>
              </div>
              
              <div className="order-detail-section">
                <h4>Product Details</h4>
                <div className="detail-row">
                  <span className="detail-label">Product:</span>
                  <span className="detail-value">{activeOrder.productName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Quantity:</span>
                  <span className="detail-value">{activeOrder.quantity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Price per Unit:</span>
                  <span className="detail-value">${(activeOrder.amount / activeOrder.quantity).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Price:</span>
                  <span className="detail-value">${activeOrder.amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="order-detail-section">
                <h4>Customer Information</h4>
                <div className="detail-row">
                  <span className="detail-label">Vendor:</span>
                  <span className="detail-value">{activeOrder.customer}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Delivery Address:</span>
                  <span className="detail-value">{activeOrder.deliveryAddress || "Not specified"}</span>
                </div>
                <div className="order-detail-actions">
                  <button 
                    className="btn-outline"
                    onClick={() => {
                      closeModal();
                      navigate(`/messages?recipient=${activeOrder.vendorId || ''}`);
                    }}
                  >
                    <i className="fas fa-envelope"></i> Contact Customer
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
      
      {/* Update Status Modal */}
      {activeModal === 'status' && activeOrder && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Update Order Status</h3>
              <button className="close-modal" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Order: <strong>{activeOrder.orderId}</strong></p>
              <p>Product: <strong>{activeOrder.productName}</strong></p>
              <p>Customer: <strong>{activeOrder.customer}</strong></p>
              
              <div className="form-group" style={{marginTop: '1rem'}}>
                <label htmlFor="status">Order Status:</label>
                <select
                  id="status"
                  value={updatedStatus}
                  onChange={(e) => setUpdatedStatus(e.target.value)}
                >
                  <option value="processing">Processing</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn-primary" onClick={saveUpdatedStatus}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

  const renderVendorsContent = () => {
    return (
      <>
        <div className="content-header">
          <h2 className="content-title">Vendor Directory</h2>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search vendors..." />
          </div>
        </div>

        {vendors.length > 0 ? (
          <div className="vendors-grid">
            {vendors.map(vendor => (
              <div key={vendor.id} className="vendor-card">
                <div className="vendor-card-header">
                  <div className="vendor-avatar">
                    {vendor.name.charAt(0)}
                  </div>
                  <div className="vendor-info">
                    <h3 className="vendor-name">{vendor.name}</h3>
                    <p className="vendor-type">{vendor.type}</p>
                  </div>
                </div>
                <div className="vendor-location">
                  <i className="fas fa-map-marker-alt"></i> {vendor.location}
                </div>
                <div className="vendor-actions">
                  <button 
                    className="btn-outline"
                    onClick={() => navigate(`/messages/vendor/${vendor.id}`)}
                  >
                    Contact
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state center">
            <i className="fas fa-users empty-icon"></i>
            <p>No vendors found</p>
            <p className="empty-subtext">Vendors will appear here once they register</p>
          </div>
        )}
      </>
    );
  };

  const renderProfileContent = () => {
    // Don't use fallback values that aren't placeholders - use empty strings
    // or appropriate defaults that clearly indicate when data is missing
    const profile = farmerProfile || {};
    const userData = profile.user || {};
    
    const memberSince = userData.createdAt 
      ? new Date(userData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : "Unknown";

    const primaryCrop = profile.cropTypes && profile.cropTypes.length > 0 
      ? profile.cropTypes[0] 
      : "";

    return (
      <>
        <h2 className="content-title">Your Profile</h2>
        
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              <span>{userData.name ? userData.name.charAt(0) : "?"}</span>
            </div>
            <div className="profile-info">
              <h3>{userData.name || "Update Your Profile"}</h3>
              {primaryCrop && <p>{primaryCrop} Farmer</p>}
              <p>Member since {memberSince}</p>
            </div>
            <button 
              className="btn-outline"
              onClick={() => navigate('/edit-profile')}
            >
              {Object.keys(profile).length > 1 ? 'Edit Profile' : 'Complete Profile'}
            </button>
          </div>
          
          <div className="profile-details">
            <div className="profile-section">
              <h4>Personal Information</h4>
              <div className="detail-row">
                <div className="detail-label">Email</div>
                <div className="detail-value">{userData.email || "Not available"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Phone</div>
                <div className="detail-value">{userData.phone || "Not available"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Location</div>
                <div className="detail-value">{profile.farmLocation || "Not available"}</div>
              </div>
            </div>
            
            <div className="profile-section">
              <h4>Farm Details</h4>
              <div className="detail-row">
                <div className="detail-label">Farm Name</div>
                <div className="detail-value">{profile.farmName || "Not available"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Farm Size</div>
                <div className="detail-value">
                  {profile.farmSize ? `${profile.farmSize} Hectares` : "Not available"}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Primary Crops</div>
                <div className="detail-value">
                  {profile.cropTypes && profile.cropTypes.length > 0 
                    ? profile.cropTypes.join(", ") 
                    : "Not available"}
                </div>
              </div>
              {profile.certifications && profile.certifications.length > 0 && (
                <div className="detail-row">
                  <div className="detail-label">Certifications</div>
                  <div className="detail-value">{profile.certifications.join(", ")}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderSettingsContent = () => {
    return (
      <>
        <h2 className="content-title">Settings</h2>
        
        <div className="settings-container">
          <div className="dashboard-card">
            <h3>Account Settings</h3>
            <div className="settings-section">
              <h4>Change Password</h4>
              <form className="settings-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" placeholder="Enter new password" />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" />
                </div>
                <button type="submit" className="btn-primary">Update Password</button>
              </form>
            </div>
            
            <div className="settings-section">
              <h4>Notification Preferences</h4>
              <div className="toggle-setting">
                <span>Email Notifications</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="toggle-setting">
                <span>Order Updates</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="toggle-setting">
                <span>Inventory Alerts</span>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return renderDashboardContent();
      case 'inventory':
        return renderInventoryContent();
      case 'orders':
        return renderOrdersContent();
      case 'vendors':
        return renderVendorsContent();
      case 'profile':
        return renderProfileContent();
      case 'settings':
        return renderSettingsContent();
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
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <SidebarItem 
            icon={<i className="fas fa-home"></i>} 
            label="Dashboard" 
            section="dashboard" 
          />
          <SidebarItem 
            icon={<i className="fas fa-warehouse"></i>} 
            label="Inventory" 
            section="inventory" 
          />
          <SidebarItem 
            icon={<i className="fas fa-shopping-cart"></i>} 
            label="Orders" 
            section="orders" 
          />
          <SidebarItem 
            icon={<i className="fas fa-users"></i>} 
            label="Vendors" 
            section="vendors" 
          />
          <SidebarItem 
            icon={<i className="fas fa-user"></i>} 
            label="Profile" 
            section="profile" 
          />
          <SidebarItem 
            icon={<i className="fas fa-cog"></i>} 
            label="Settings" 
            section="settings" 
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
              {farmerProfile?.user?.name 
                ? farmerProfile.user.name.charAt(0).toUpperCase()
                : "?"}
            </div>
            <div className="user-info">
              <span className="user-name">
                {farmerProfile?.user?.name || "Update Profile"}
              </span>
              <span className="user-role">Farmer</span>
            </div>
          </div>
          </div>
        </header>
        
        <div className="content-container">
          {renderContent()}
        </div>
        <Toast 
          visible={toast.visible} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ visible: false, message: '', type: 'success' })}
        />
      </main>
    </div>
  );
};

export default FarmerDashboard;