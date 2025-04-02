// If this file doesn't exist, this is a template for creating it
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, productAPI } from '../api';

const CreateBooking = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    deliveryAddress: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getProducts();
        setProducts(response.data.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      <h2>Create New Booking</h2>
      
      {error && <div className="error-message">{error}</div>}
      
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
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="deliveryAddress">Delivery Address*</label>
          <textarea
            id="deliveryAddress"
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={handleChange}
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
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/vendor-dashboard')}
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
  );
};

export default CreateBooking;