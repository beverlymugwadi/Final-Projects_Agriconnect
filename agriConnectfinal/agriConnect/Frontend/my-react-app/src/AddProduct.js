import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    unit: 'kg', // Default unit
    availableQuantity: '',
    harvestDate: '',
    expiryDate: '',
    isOrganic: false,
    isFeatured: false
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages([...images, ...files]);
      
      // Create preview URLs
      const newPreviews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newPreviews).then(results => {
        setPreviews([...previews, ...results]);
      });
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields first
      if (!formData.name || !formData.price || !formData.description || 
          !formData.category || !formData.unit || !formData.availableQuantity) {
        throw new Error('Please fill all required fields');
      }
      
      // Create form data for file uploads
      const productData = new FormData();
      
      // Add all form fields to FormData with the exact field names expected by the backend
      productData.append('name', formData.name);
      productData.append('price', formData.price);
      productData.append('description', formData.description);
      productData.append('category', formData.category);
      productData.append('unit', formData.unit);
      productData.append('availableQuantity', formData.availableQuantity);
      
      // Add optional fields
      if (formData.harvestDate) productData.append('harvestDate', formData.harvestDate);
      if (formData.expiryDate) productData.append('expiryDate', formData.expiryDate);
      
      // Add boolean fields
      productData.append('isOrganic', formData.isOrganic);
      productData.append('isFeatured', formData.isFeatured);
      
      // Append each image to form data
      if (images.length > 0) {
        images.forEach(image => {
          productData.append('images', image);
        });
      }
      
      // Log the form data for debugging
      console.log('Form data values:');
      for (let [key, value] of productData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }
      
      // Use direct axios call instead of API service for better debugging
      const response = await axios.post('http://localhost:5400/api/products', 
        productData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Product added successfully:', response.data);
      
      // Redirect to the farmer dashboard after successful submission
      navigate('/farmer-dashboard');
    } catch (error) {
      console.error('Error adding product:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add product. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h1>Add New Product</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/farmer-dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-grid">
          <div className="form-left">
            <div className="form-group">
              <label htmlFor="name">Product Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price ($)*</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="unit">Unit*</label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="lb">Pound (lb)</option>
                  <option value="ton">Ton</option>
                  <option value="piece">Piece</option>
                  <option value="dozen">Dozen</option>
                  <option value="liter">Liter</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="availableQuantity">Available Quantity*</label>
              <input
                type="number"
                id="availableQuantity"
                name="availableQuantity"
                value={formData.availableQuantity}
                onChange={handleChange}
                min="0"
                required
                placeholder="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description*</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
                placeholder="Describe your product"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Category*</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="dairy">Dairy</option>
                <option value="livestock">Livestock</option>
                <option value="grains">Grains</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="harvestDate">Harvest Date</label>
                <input
                  type="date"
                  id="harvestDate"
                  name="harvestDate"
                  value={formData.harvestDate}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="expiryDate">Expiry Date</label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-row checkboxes">
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="isOrganic"
                  name="isOrganic"
                  checked={formData.isOrganic}
                  onChange={handleChange}
                />
                <label htmlFor="isOrganic">Organic Product</label>
              </div>
              
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                />
                <label htmlFor="isFeatured">Featured Product</label>
              </div>
            </div>
          </div>
          
          <div className="form-right">
            <div className="image-upload-container">
              <label>Product Images</label>
              <div className="image-preview-area">
                {previews.length > 0 ? (
                  <div className="image-previews">
                    {previews.map((preview, index) => (
                      <div key={index} className="preview-item">
                        <img src={preview} alt={`Product preview ${index + 1}`} className="image-preview" />
                        <button 
                          type="button" 
                          className="remove-image" 
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span>Upload product images</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="productImage"
                name="productImage"
                onChange={handleImageChange}
                accept="image/*"
                multiple
                className="file-input"
              />
              <button 
                type="button" 
                className="upload-btn" 
                onClick={() => document.getElementById('productImage').click()}
              >
                Select Images
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/farmer-dashboard')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;