import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { vendorAPI } from '../api';
import './Vendors.css';

const Vendors = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await vendorAPI.getAllVendors();
      console.log('Vendors data:', response.data);
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to load vendors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor => 
    vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.businessLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.businessType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="vendors-container">
      <div className="vendors-header">
        <h1>Vendor Directory</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/farmer-dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-bar">
        <input 
          type="text"
          placeholder="Search vendors by name, location, or business type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading vendors...</div>
      ) : (
        <div className="vendors-grid">
          {filteredVendors.length > 0 ? (
            filteredVendors.map((vendor) => (
              <div key={vendor._id} className="vendor-card">
                <h3 className="vendor-name">{vendor.businessName}</h3>
                <div className="vendor-details">
                  <p className="vendor-location">
                    <span className="detail-label">Location:</span> 
                    {vendor.businessLocation}
                  </p>
                  <p className="vendor-type">
                    <span className="detail-label">Business Type:</span> 
                    {vendor.businessType}
                  </p>
                  {vendor.purchaseCapacity && (
                    <p className="vendor-capacity">
                      <span className="detail-label">Purchase Capacity:</span> 
                      {vendor.purchaseCapacity} tons
                    </p>
                  )}
                  {vendor.preferredProducts && vendor.preferredProducts.length > 0 && (
                    <div className="vendor-products">
                      <span className="detail-label">Preferred Products:</span>
                      <div className="product-tags">
                        {vendor.preferredProducts.map((product, index) => (
                          <span key={index} className="product-tag">{product}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="vendor-actions">
                  <button 
                    className="contact-btn"
                    onClick={() => navigate(`/messages?vendor=${vendor._id}`)}
                  >
                    Contact Vendor
                  </button>
                  <Link 
                    to={`/vendor/${vendor._id}`} 
                    className="view-details-btn"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-vendors">
              <p>No vendors found matching your search criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Vendors;