import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { farmerAPI } from '../api';
import './Suppliers.css';

const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await farmerAPI.getAllFarmers();
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError('Failed to load suppliers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.farmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.farmLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.cropTypes && supplier.cropTypes.some(crop => 
      crop.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1>Trusted Suppliers</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/vendor-dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input 
          type="text"
          placeholder="Search suppliers by name, location, or crops..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading suppliers...</div>
      ) : (
        <div className="suppliers-grid">
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier) => (
              <div key={supplier._id} className="supplier-card">
                <h3 className="supplier-name">{supplier.farmName}</h3>
                <div className="supplier-details">
                  <p className="supplier-location">
                    <span className="detail-label">Location:</span> 
                    {supplier.farmLocation}
                  </p>
                  <p className="supplier-size">
                    <span className="detail-label">Farm Size:</span> 
                    {supplier.farmSize} acres
                  </p>
                  <div className="supplier-crops">
                    <span className="detail-label">Crops:</span>
                    <div className="crop-tags">
                      {supplier.cropTypes && supplier.cropTypes.map((crop, index) => (
                        <span key={index} className="crop-tag">{crop}</span>
                      ))}
                    </div>
                  </div>
                  {supplier.certifications && supplier.certifications.length > 0 && (
                    <div className="supplier-certifications">
                      <span className="detail-label">Certifications:</span>
                      <div className="certification-tags">
                        {supplier.certifications.map((cert, index) => (
                          <span key={index} className="certification-tag">{cert}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="supplier-actions">
                  <button 
                    className="contact-btn"
                    onClick={() => navigate(`/messages?farmer=${supplier._id}`)}
                  >
                    Contact Supplier
                  </button>
                  <button 
                    className="view-products-btn"
                    onClick={() => navigate(`/products?farmer=${supplier._id}`)}
                  >
                    View Products
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-suppliers">
              <p>No suppliers found matching your search criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Suppliers;