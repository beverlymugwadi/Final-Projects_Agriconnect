import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../api';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    deliveryAddress: '',
    paymentMethod: 'cash',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        quantity: 1,
        deliveryAddress: '',
        paymentMethod: 'cash',
        notes: ''
      });
      setError('');
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Validate quantity
      if (formData.quantity <= 0 || formData.quantity > product.availableQuantity) {
        throw new Error(`Quantity must be between 1 and ${product.availableQuantity}`);
      }
      
      // Create booking
      const response = await bookingAPI.createBooking({
        product: product._id,
        quantity: formData.quantity,
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      });
      
      // Show success message and close modal
      sessionStorage.setItem('bookingSuccess', `Successfully booked ${formData.quantity} ${product.unit} of ${product.name}`);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // If modal is not open or no product is selected, don't render
  if (!isOpen || !product) return null;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal-content" onClick={e => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h2>Book Product</h2>
          <button className="booking-close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="booking-modal-error">{error}</div>}
        
        <div className="booking-product-summary">
          <div className="booking-product-image-container">
            {product.images && product.images.length > 0 ? (
              <img 
                className="booking-product-image"
                src={product.images[0].startsWith('http') 
                  ? product.images[0] 
                  : `http://localhost:5400/uploads/${product.images[0].replace('uploads/', '')}`} 
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/80';
                }}
              />
            ) : (
              <div className="booking-no-image">
                <i className="fas fa-seedling"></i>
              </div>
            )}
          </div>
          <div className="booking-product-info">
            <h3>{product.name}</h3>
            <p className="booking-product-price">${product.price} per {product.unit}</p>
            <p>Available: {product.availableQuantity} {product.unit}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="booking-form-group">
            <label htmlFor="quantity">Quantity*</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max={product.availableQuantity}
              required
            />
            <span className="booking-total-price">
              Total: ${(formData.quantity * product.price).toFixed(2)}
            </span>
          </div>
          
          <div className="booking-form-group">
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
          
          <div className="booking-form-group">
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
          
          <div className="booking-form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Special instructions for your order"
            />
          </div>
          
          <div className="booking-form-actions">
            <button
              type="button"
              className="booking-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="booking-submit-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Book Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;