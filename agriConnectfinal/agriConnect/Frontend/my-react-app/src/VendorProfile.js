import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorAPI } from './api';

const VendorProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Retailer',
    businessLocation: '',
    preferredProducts: [],
    purchaseCapacity: '',
    description: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preferredProduct, setPreferredProduct] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Check if user already has a profile
    const fetchProfile = async () => {
      try {
        const response = await vendorAPI.getProfile();
        if (response.data && response.data.data) {
          navigate('/vendor-dashboard'); // Redirect if profile already exists
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching profile:', error);
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const addPreferredProduct = () => {
    if (preferredProduct.trim() !== '') {
      setFormData({
        ...formData,
        preferredProducts: [...formData.preferredProducts, preferredProduct.trim()]
      });
      setPreferredProduct('');
    }
  };

  const removePreferredProduct = (index) => {
    const updatedProducts = [...formData.preferredProducts];
    updatedProducts.splice(index, 1);
    setFormData({ ...formData, preferredProducts: updatedProducts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (!formData.businessName || !formData.businessLocation || !formData.purchaseCapacity) {
        throw new Error('Please fill all required fields');
      }

      // Create vendor profile
      await vendorAPI.createProfile({
        businessName: formData.businessName,
        businessType: formData.businessType,
        businessLocation: formData.businessLocation,
        preferredProducts: formData.preferredProducts,
        purchaseCapacity: Number(formData.purchaseCapacity),
        description: formData.description,
        licenseNumber: formData.licenseNumber
      });

      navigate('/vendor-dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-profile-container">
      <h1>Create Vendor Profile</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Business Name*</label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Business Type*</label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            required
          >
            <option value="Retailer">Retailer</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Processor">Processor</option>
            <option value="Exporter">Exporter</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Business Location*</label>
          <input
            type="text"
            name="businessLocation"
            value={formData.businessLocation}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Purchase Capacity* (in tons)</label>
          <input
            type="number"
            name="purchaseCapacity"
            value={formData.purchaseCapacity}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Preferred Products</label>
          <div className="input-with-button">
            <input
              type="text"
              value={preferredProduct}
              onChange={(e) => setPreferredProduct(e.target.value)}
              placeholder="e.g., Corn, Tomatoes, Rice"
            />
            <button type="button" onClick={addPreferredProduct}>Add</button>
          </div>
          <div className="tags-container">
            {formData.preferredProducts.map((product, index) => (
              <div key={index} className="tag">
                {product}
                <span onClick={() => removePreferredProduct(index)}>&times;</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label>License Number (if applicable)</label>
          <input
            type="text"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

export default VendorProfile;