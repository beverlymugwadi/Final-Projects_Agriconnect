import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EditProfile.css';

const BASE_URL = "http://localhost:5400/api";

const EditProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    farmName: '',
    farmLocation: '',
    farmSize: '',
    cropTypes: [],
    description: '',
    certifications: []
  });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cropType, setCropType] = useState('');
  const [certification, setCertification] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user and farmer profile data
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch user data first
        const userResponse = await axios.get(`${BASE_URL}/users/me`, { headers });
        if (userResponse.data.success) {
          const user = userResponse.data.data.user;
          setUserData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || ''
          });
        }

        // Then fetch farmer profile
        const profileResponse = await axios.get(`${BASE_URL}/farmers/me`, { headers });
        if (profileResponse.data.success) {
          const profileData = profileResponse.data.data;
          setFormData({
            farmName: profileData.farmName || '',
            farmLocation: profileData.farmLocation || '',
            farmSize: profileData.farmSize || '',
            cropTypes: profileData.cropTypes || [],
            description: profileData.description || '',
            certifications: profileData.certifications || []
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFarmChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addCropType = () => {
    if (cropType.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        cropTypes: [...prev.cropTypes, cropType.trim()]
      }));
      setCropType('');
    }
  };

  const removeCropType = (index) => {
    setFormData(prev => {
      const updatedCropTypes = [...prev.cropTypes];
      updatedCropTypes.splice(index, 1);
      return { ...prev, cropTypes: updatedCropTypes };
    });
  };

  const addCertification = () => {
    if (certification.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certification.trim()]
      }));
      setCertification('');
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => {
      const updatedCertifications = [...prev.certifications];
      updatedCertifications.splice(index, 1);
      return { ...prev, certifications: updatedCertifications };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Validate form data
      if (!formData.farmName || !formData.farmLocation || !formData.farmSize || formData.cropTypes.length === 0) {
        throw new Error('Please fill all required fields');
      }

      // Update user data
      await axios.put(`${BASE_URL}/users/updatedetails`, {
        name: userData.name,
        phone: userData.phone
      }, { headers });

      // Update farmer profile
      await axios.put(`${BASE_URL}/farmers/me`, {
        farmName: formData.farmName,
        farmLocation: formData.farmLocation,
        farmSize: formData.farmSize,
        cropTypes: formData.cropTypes,
        description: formData.description,
        certifications: formData.certifications
      }, { headers });

      setSuccessMsg('Profile updated successfully!');
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
      
      // Navigate back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/farmer-dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || error.message || 'Failed to update profile');
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h1>Edit Your Profile</h1>
        <button className="back-button" onClick={() => navigate('/farmer-dashboard')}>
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}
      
      <div className="edit-profile-content">
        <form onSubmit={handleSubmit}>
          <div className="profile-section">
            <h2>Personal Information</h2>
            
            <div className="form-group">
              <label>Full Name*</label>
              <input
                type="text"
                name="name"
                value={userData.name}
                onChange={handleUserChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={userData.email}
                disabled
                className="disabled-input"
              />
              <small>Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label>Phone Number*</label>
              <input
                type="tel"
                name="phone"
                value={userData.phone}
                onChange={handleUserChange}
                required
              />
            </div>
          </div>
          
          <div className="profile-section">
            <h2>Farm Details</h2>
            
            <div className="form-group">
              <label>Farm Name*</label>
              <input
                type="text"
                name="farmName"
                value={formData.farmName}
                onChange={handleFarmChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Farm Location*</label>
              <input
                type="text"
                name="farmLocation"
                value={formData.farmLocation}
                onChange={handleFarmChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Farm Size (hectares)*</label>
              <input
                type="number"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleFarmChange}
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
              {formData.cropTypes.length === 0 && (
                <p className="validation-message">At least one crop type is required</p>
              )}
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
                onChange={handleFarmChange}
                rows="4"
                placeholder="Tell us about your farm and your farming practices..."
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
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => navigate('/farmer-dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;