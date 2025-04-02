import axios from 'axios';

const API_BASE_URL = 'http://localhost:5400/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.get('/auth/logout'),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/updatedetails', userData),
  updatePassword: (passwordData) => api.put('/users/updatepassword', passwordData),
};

// Farmer API calls
export const farmerAPI = {
  createProfile: (profileData) => api.post('/farmers', profileData),
  getProfile: () => api.get('/farmers/me'),
  updateProfile: (profileData) => api.put('/farmers/me', profileData),
  getAllFarmers: () => api.get('/farmers'),
  getFarmerById: (id) => api.get(`/farmers/${id}`),
};

// Vendor API calls
export const vendorAPI = {
  createProfile: (profileData) => api.post('/vendors', profileData),
  getProfile: () => api.get('/vendors/me'),
  updateProfile: (profileData) => api.put('/vendors/me', profileData),
  getAllVendors: () => api.get('/vendors'),
  getVendorById: (id) => api.get(`/vendors/${id}`),
};

// Product API calls
export const productAPI = {
  createProduct: (productData) => {
    const headers = { 'Content-Type': 'multipart/form-data' };
    return api.post('/products', productData, { headers });
  },
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Booking API calls
export const bookingAPI = {
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getBookings: () => api.get('/bookings'),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, statusData) => api.put(`/bookings/${id}`, statusData),
  deleteBooking: (id) => api.delete(`/bookings/${id}`),
};

// Sales API calls
export const salesAPI = {
  getSalesSummary: () => api.get('/salesRoutes'),
};

export default api;