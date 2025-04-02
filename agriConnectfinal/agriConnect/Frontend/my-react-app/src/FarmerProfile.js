import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FarmerProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    farmName: '',
    farmLocation: '',
    farmSize: '',
    cropTypes: [],
    description: '',
    certifications: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cropType, setCropType] = useState('');
  const [certification, setCertification] = useState('');

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
        const response = await axios.get('http://localhost:5400/api/farmers/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
          // Pre-fill form with existing data
          setFormData(response.data.data);
          navigate('/farmer-dashboard'); // Redirect if profile already exists
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

  const addCropType = () => {
    if (cropType.trim() !== '') {
      setFormData({
        ...formData,
        cropTypes: [...formData.cropTypes, cropType.trim()]
      });
      setCropType('');
    }
  };

  const removeCropType = (index) => {
    const updatedCropTypes = [...formData.cropTypes];
    updatedCropTypes.splice(index, 1);
    setFormData({ ...formData, cropTypes: updatedCropTypes });
  };

  const addCertification = () => {
    if (certification.trim() !== '') {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, certification.trim()]
      });
      setCertification('');
    }
  };

  const removeCertification = (index) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications.splice(index, 1);
    setFormData({ ...formData, certifications: updatedCertifications });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Validate form data
      if (!formData.farmName || !formData.farmLocation || !formData.farmSize || formData.cropTypes.length === 0) {
        throw new Error('Please fill all required fields');
      }

      // Create farmer profile
      await axios.post('http://localhost:5400/api/farmers', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/farmer-dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    // Add your styles here or use CSS...
  };

  return (
    <div className="farmer-profile-container">
      <h1>Create Farmer Profile</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Farm Name*</label>
          <input
            type="text"
            name="farmName"
            value={formData.farmName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Farm Location*</label>
          <input
            type="text"
            name="farmLocation"
            value={formData.farmLocation}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Farm Size (acres)*</label>
          <input
            type="number"
            name="farmSize"
            value={formData.farmSize}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Crop Types*</label>
          <div className="input-with-button">
            <input
              type="text"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              placeholder="e.g., Corn, Wheat, Rice"
            />
            <button type="button" onClick={addCropType}>Add</button>
          </div>
          <div className="tags-container">
            {formData.cropTypes.map((crop, index) => (
              <div key={index} className="tag">
                {crop}
                <span onClick={() => removeCropType(index)}>&times;</span>
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
          <label>Certifications</label>
          <div className="input-with-button">
            <input
              type="text"
              value={certification}
              onChange={(e) => setCertification(e.target.value)}
              placeholder="e.g., Organic, Fair Trade"
            />
            <button type="button" onClick={addCertification}>Add</button>
          </div>
          <div className="tags-container">
            {formData.certifications.map((cert, index) => (
              <div key={index} className="tag">
                {cert}
                <span onClick={() => removeCertification(index)}>&times;</span>
              </div>
            ))}
          </div>
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

export default FarmerProfile;