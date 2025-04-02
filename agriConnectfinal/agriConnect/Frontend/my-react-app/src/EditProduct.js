import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './AddProduct.css'; // Reuse the same CSS

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    unit: 'kg',
    availableQuantity: '',
    harvestDate: '',
    expiryDate: '',
    isOrganic: false,
    isFeatured: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    // Fetch product data
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5400/api/products/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const product = response.data.data;
        setFormData({
          name: product.name || '',
          price: product.price || '',
          description: product.description || '',
          category: product.category || '',
          unit: product.unit || 'kg',
          availableQuantity: product.availableQuantity || '',
          harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : '',
          expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
          isOrganic: product.isOrganic || false,
          isFeatured: product.isFeatured || false
        });

        // Set existing images
        if (product.images && product.images.length > 0) {
          setExistingImages(product.images);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product. Please try again.');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

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

  const removeExistingImage = (index) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!formData.name || !formData.price || !formData.description || 
          !formData.category || !formData.unit || !formData.availableQuantity) {
        throw new Error('Please fill all required fields');
      }
      
      // Create form data for file uploads
      const productData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        productData.append(key, formData[key]);
      });
      
      // Add existing images
      productData.append('existingImages', JSON.stringify(existingImages));
      
      // Add new images
      if (images.length > 0) {
        images.forEach(image => {
          productData.append('images', image);
        });
      }
      
      // Update product
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.put(`http://localhost:5400/api/products/${id}`, 
        productData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      navigate('/manage-inventory');
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="add-product-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h1>Edit Product</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/manage-inventory')}
        >
          Back to Inventory
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="product-form">
        {/* Reuse the same form structure as AddProduct.js */}
        <div className="form-grid">
          <div className="form-left">
            {/* Product details fields */}
            <div className="form-group">
              <label htmlFor="name">Product Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
  <label htmlFor="price">Price per {formData.unit}*</label>
  <input
    type="number"
    id="price"
    name="price"
    value={formData.price}
    onChange={handleChange}
    min="0"
    step="0.01"
    required
  />
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
    <option value="grains">Grains</option>
    <option value="dairy">Dairy</option>
    <option value="livestock">Livestock</option>
    <option value="other">Other</option>
  </select>
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

<div className="form-group">
  <label htmlFor="description">Description*</label>
  <textarea
    id="description"
    name="description"
    value={formData.description}
    onChange={handleChange}
    rows="4"
    required
  ></textarea>
</div>

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
                {/* Show existing images */}
                {existingImages.length > 0 && (
                  <div className="existing-images">
                    <h4>Current Images</h4>
                    <div className="image-previews">
                      {existingImages.map((image, index) => (
                        <div key={`existing-${index}`} className="preview-item">
                          <img 
                            src={image.startsWith('http') 
                              ? image 
                              : `http://localhost:5400/uploads/${image.replace('uploads/', '')}`} 
                            alt={`Product ${index + 1}`} 
                            className="image-preview" 
                          />
                          <button 
                            type="button" 
                            className="remove-image" 
                            onClick={() => removeExistingImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show preview of new images */}
                {previews.length > 0 && (
                  <div className="new-images">
                    <h4>New Images to Add</h4>
                    <div className="image-previews">
                      {previews.map((preview, index) => (
                        <div key={`new-${index}`} className="preview-item">
                          <img 
                            src={preview} 
                            alt={`New preview ${index + 1}`} 
                            className="image-preview" 
                          />
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
                  </div>
                )}
                
                {existingImages.length === 0 && previews.length === 0 && (
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
                Add More Images
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/manage-inventory')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;