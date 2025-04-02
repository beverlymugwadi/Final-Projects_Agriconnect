import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingAPI, productAPI } from '../api';
import './CreateBooking.css';

const CreateBooking = () => {
  const navigate = useNavigate();
  const { productId } = useParams(); // Extract productId from URL
  const [formData, setFormData] = useState({
    product: productId || '',
    quantity: 1,
    deliveryAddress: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is a vendor
    const userType = localStorage.getItem('userType');
    if (userType !== 'vendor') {
      sessionStorage.setItem('authRedirectMessage', 'You need a vendor account to book products');
      navigate('/login');
      return;
    }

    // Fetch the selected product details if productId is provided
    if (productId) {
      fetchProductDetails();
    } else {
      // Otherwise fetch all products for the dropdown
      fetchProducts();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProductById(productId);
      if (response.data.success) {
        const product = response.data.data;
        setSelectedProduct(product);
        setProducts([product]); // Add to products array for dropdown
        setFormData({
          ...formData,
          product: product._id
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setError('Failed to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProducts();
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing product selection, update UI accordingly
    if (name === 'product' && value !== formData.product) {
      const selectedProd = products.find(p => p._id === value);
      setSelectedProduct(selectedProd || null);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.product || !formData.quantity || !formData.deliveryAddress) {
        throw new Error('Please fill all required fields');
      }
      
      // Create booking
      const response = await bookingAPI.createBooking({
        product: formData.product,
        quantity: parseInt(formData.quantity),
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      });
      
      console.log('Booking created:', response.data);
      // Show success message
      sessionStorage.setItem('bookingSuccess', 'Your booking has been created successfully');
      navigate('/vendor-dashboard');
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-booking-container">
      <div className="booking-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2>Create New Booking</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && !error ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div className="booking-content">
          {selectedProduct && (
            <div className="selected-product-card">
              <h3>Selected Product</h3>
              <div className="product-details">
                <h4>{selectedProduct.name}</h4>
                <p className="product-price">${selectedProduct.price} per {selectedProduct.unit}</p>
                <p>Category: {selectedProduct.category}</p>
                <p>Available: {selectedProduct.availableQuantity} {selectedProduct.unit}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="product">Select Product*</label>
              <select
                id="product"
                name="product"
                value={formData.product}
                onChange={handleChange}
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product._id} value={product._id}>
                    {product.name} - ${product.price}/{product.unit}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantity*</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                max={selectedProduct ? selectedProduct.availableQuantity : 9999}
                required
              />
              {selectedProduct && (
                <small className="form-hint">
                  Available: {selectedProduct.availableQuantity} {selectedProduct.unit}
                </small>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="deliveryAddress">Delivery Address*</label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleChange}
                placeholder="Enter your complete delivery address"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method*</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="cash">Cash on Delivery</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Special instructions or notes for your order"
              />
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateBooking;