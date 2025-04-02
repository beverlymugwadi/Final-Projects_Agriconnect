import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';

// Import Components with proper export handling
import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import FarmerProfile from './FarmerProfile';
import VendorProfile from './VendorProfile';
import ProductList from './ProductList';
import Bookings from './Bookings';
import FarmerDashboard from './FarmerDashboard';
import VendorDashboard from './VendorDashboard';
import UserTypeSelection from './User';
import GuestDashboard from './GuestDashboard';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import Messages from './pages/Messages';
import ManageInventory from './ManageInventory';
import ContactSupport from './pages/ContactSupport';
import FAQHelp from './pages/FAQHelp';
import Orders from './pages/Orders';
import Marketplace from './pages/Marketplace';
import Vendors from './pages/Vendors';
import Suppliers from './pages/Suppliers';
import EditProfile from './pages/EditProfile';
import ProtectedRoute from './components/ProtectedRoute';
import CreateBooking from './pages/CreateBooking';
import { NotificationProvider } from './context/NotificationContext';
import Notifications from './components/Notifications';

const API_BASE_URL = 'http://localhost:5400/api';

function App() {
  const [user, setUser] = useState(null);

  // Fetch User Data from Backend (if logged in)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <Router>
      <NotificationProvider>
        <div className="App">
          {/* NotificationCenter is now handled within each dashboard */}
          <Routes>
            {/* Public Routes - Accessible to everyone */}
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product-list" element={<ProductList />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/faq" element={<FAQHelp />} />
            <Route path="/guest-dashboard" element={<GuestDashboard onNavigate={navigate => navigate} />} />
            <Route path="/user" element={<UserTypeSelection />} />
            
            {/* Messages routes need to be available to non-logged in users too so they redirect to login */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/vendor/:vendorId" element={<Messages />} />
            <Route path="/messages/:vendorId" element={<Messages />} />
            
            {/* Protected Routes - Any authenticated user */}
            <Route path="/contact-support" element={
              <ProtectedRoute allowedUserTypes={['farmer', 'vendor']}>
                <ContactSupport />
              </ProtectedRoute>
            } />
            <Route path="/edit-profile" element={
              <ProtectedRoute allowedUserTypes={['farmer', 'vendor']}>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute allowedUserTypes={['farmer', 'vendor']}>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute allowedUserTypes={['farmer', 'vendor']}>
                <Bookings user={user} />
              </ProtectedRoute>
            } />
            
            {/* Booking routes - Add the new route with product ID parameter */}
            <Route path="/book" element={
              <ProtectedRoute allowedUserTypes={['vendor']}>
                <CreateBooking />
              </ProtectedRoute>
            } />
            <Route path="/book/:productId" element={
              <ProtectedRoute allowedUserTypes={['vendor']}>
                <CreateBooking />
              </ProtectedRoute>
            } />
            
            {/* Farmer-only Routes */}
            <Route path="/farmer-dashboard" element={
              <ProtectedRoute allowedUserTypes={['farmer']}>
                <FarmerDashboard user={user} />
              </ProtectedRoute>
            } />
            <Route path="/farmer-profile" element={
              <ProtectedRoute allowedUserTypes={['farmer']}>
                <FarmerProfile user={user} />
              </ProtectedRoute>
            } />
            <Route path="/add-product" element={
              <ProtectedRoute allowedUserTypes={['farmer']}>
                <AddProduct />
              </ProtectedRoute>
            } />
            
            {/* Add the missing EditProduct route */}
            <Route path="/edit-product/:id" element={
              <ProtectedRoute allowedUserTypes={['farmer']}>
                <EditProduct />
              </ProtectedRoute>
            } />
            
            {/* Fix ManageInventory routes - support both paths */}
            <Route path="/inventory" element={
              <ProtectedRoute allowedUserTypes={['farmer']}>
                <ManageInventory />
              </ProtectedRoute>
            } />
            <Route path="/manage-inventory" element={
              <ProtectedRoute allowedUserTypes={['farmer']}>
                <ManageInventory />
              </ProtectedRoute>
            } />
            
            {/* Vendor-only Routes */}
            <Route path="/vendor-dashboard" element={
              <ProtectedRoute allowedUserTypes={['vendor']}>
                <VendorDashboard user={user} />
              </ProtectedRoute>
            } />
            <Route path="/vendor-profile" element={
              <ProtectedRoute allowedUserTypes={['vendor']}>
                <VendorProfile user={user} />
              </ProtectedRoute>
            } />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute allowedUserTypes={['farmer', 'vendor']}>
                  <Orders />
                </ProtectedRoute>
              } 
            />
            <Route path="/vendors" element={
              <ProtectedRoute allowedUserTypes={['vendor']}>
                <Vendors />
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute allowedUserTypes={['vendor']}>
                <Suppliers />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </NotificationProvider>
    </Router>
  );
}

export default App;