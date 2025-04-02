import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { productAPI } from '../api';
import BookingModal from '../components/BookingModal';

import './Marketplace.css';

const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const farmerId = queryParams.get('farmer');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    isOrganic: false,
    farmer: farmerId || ''
  });

  useEffect(() => {
    document.title = 'Marketplace - AgriConnect';
    fetchProducts();
    
    // Close mobile filters panel when clicking outside
    const handleClickOutside = (e) => {
      if (isMobileFiltersOpen && !e.target.closest('.filters-panel') && 
          !e.target.closest('.mobile-filters-toggle')) {
        setIsMobileFiltersOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Update farmer filter when URL param changes
    if (farmerId) {
      setFilters(prev => ({...prev, farmer: farmerId}));
      fetchProducts({...filters, farmer: farmerId});
    }
  }, [farmerId]);

  // Fixed image URL handling function that properly accesses backend files
  const getImageUrl = (imagePath) => {
    // 1. Handle null or empty paths
    if (!imagePath) {
      return null; // Or return a path to a default placeholder image
    }

    // 2. If it's already a full URL, return it directly
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // 3. Normalize backslashes (\) to forward slashes (/)
    let normalizedPath = imagePath.replace(/\\/g, '/');

    // 4. Remove the 'uploads/' prefix if it exists at the beginning
    if (normalizedPath.startsWith('uploads/')) {
      normalizedPath = normalizedPath.substring(8); // Length of 'uploads/'
    }

    // 5. Remove any leading slash from the remaining path to avoid double slashes
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.substring(1);
    }

    // 6. Construct the final URL using your backend server address and static path
    // Ensure your base URL here matches your server configuration
    const baseUrl = 'http://localhost:5400'; // Your server base URL
    const staticRoute = '/uploads';        // The route defined in server.js

    return `${baseUrl}${staticRoute}/${normalizedPath}`;
  };
  const fetchProducts = async (customFilters = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (customFilters.category) params.category = customFilters.category;
      if (customFilters.minPrice) params.minPrice = customFilters.minPrice;
      if (customFilters.maxPrice) params.maxPrice = customFilters.maxPrice;
      if (customFilters.search) params.search = customFilters.search;
      if (customFilters.isOrganic) params.isOrganic = true;
      if (customFilters.farmer) params.farmer = customFilters.farmer;
      
      const response = await productAPI.getProducts(params);
      
      // Debug logging to help identify image path issues
      console.log("Products loaded:", response.data.data);
      
      // Log detailed image info for debugging
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach(product => {
          if (product.images && product.images.length > 0) {
            console.log(`Product ${product.name} image path:`, product.images[0]);
            console.log(`Constructed URL:`, getImageUrl(product.images[0]));
          } else {
            console.log(`Product ${product.name} has no images`);
          }
        });
      }
      
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({ 
      ...filters, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchProducts();
    if (window.innerWidth < 768) {
      setIsMobileFiltersOpen(false);
    }
  };

  const resetFilters = () => {
    const resetFiltersObj = {
      category: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      isOrganic: false,
      farmer: farmerId || '' // Maintain farmer filter if present
    };
    setFilters(resetFiltersObj);
    fetchProducts(resetFiltersObj);
  };

  const openQuickView = (product) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    document.body.style.overflow = 'auto';
  };

  const navigateBack = () => {
    const userType = localStorage.getItem('userType');
    if (userType === 'vendor') {
      navigate('/vendor-dashboard');
    } else if (userType === 'farmer') {
      navigate('/farmer-dashboard');
    } else {
      navigate('/');
    }
  };

  const handleBookNow = (productId) => {
    const userType = localStorage.getItem('userType');
    if (!userType) {
      sessionStorage.setItem('redirect', `/marketplace`);
      sessionStorage.setItem('authRedirectMessage', 'Please login as a vendor to book products');
      navigate('/login');
      return;
    }
    
    if (userType !== 'vendor') {
      sessionStorage.setItem('authRedirectMessage', 'You need a vendor account to book products');
      navigate('/login');
      return;
    }
    
    // Find the product and open the modal
    const product = products.find(p => p._id === productId);
    if (product) {
      setSelectedProduct(product);
      setBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    // Refresh products to update availability
    fetchProducts();
    // Show success notification (could be enhanced with a toast notification)
    console.log("Booking created successfully!");
  };

  const userType = localStorage.getItem('userType');
  const isVendor = userType === 'vendor';
  const filterApplied = filters.category || filters.minPrice || filters.maxPrice || 
                        filters.search || filters.isOrganic;

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <div className="header-left">
          <button className="back-button" onClick={navigateBack}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <h1>Agricultural Marketplace</h1>
        </div>
        <div className="header-right">
          {filterApplied && (
            <button className="reset-filters-button" onClick={resetFilters}>
              <i className="fas fa-undo-alt"></i> Reset Filters
            </button>
          )}
          <button 
            className="mobile-filters-toggle"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          >
            <i className="fas fa-sliders-h"></i> Filters
          </button>
        </div>
      </div>

      {/* Farmer info if filtered by farmer */}
      {farmerId && (
        <div className="farmer-highlight">
          <i className="fas fa-user-circle"></i>
          <div>
            <p>Viewing products from:</p>
            <h3>Trusted Farmer</h3>
          </div>
          <button 
            className="clear-farmer-filter"
            onClick={() => {
              setFilters(prev => ({...prev, farmer: ''}));
              navigate('/marketplace');
              fetchProducts({...filters, farmer: ''});
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="marketplace-content">
        <div className={`filters-panel ${isMobileFiltersOpen ? 'mobile-open' : ''}`}>
          <div className="filters-header">
            <h2>Filter Products</h2>
            <button 
              className="close-filters-mobile"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <form onSubmit={applyFilters}>
            <div className="filter-group">
              <label htmlFor="search">Search Products</label>
              <div className="search-input-container">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  id="search" 
                  name="search" 
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Find products..."
                />
              </div>
            </div>
            
            <div className="filter-group">
              <label htmlFor="category">Category</label>
              <select 
                id="category" 
                name="category" 
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="dairy">Dairy</option>
                <option value="livestock">Livestock</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Price Range ($)</label>
              <div className="price-range-inputs">
                <input 
                  type="number" 
                  id="minPrice" 
                  name="minPrice" 
                  min="0" 
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="Min"
                />
                <span className="price-range-separator">-</span>
                <input 
                  type="number" 
                  id="maxPrice" 
                  name="maxPrice" 
                  min="0" 
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="Max"
                />
              </div>
            </div>
            
            <div className="filter-group checkbox">
              <input 
                type="checkbox" 
                id="isOrganic" 
                name="isOrganic" 
                checked={filters.isOrganic}
                onChange={handleFilterChange}
              />
              <label htmlFor="isOrganic">
                <span className="custom-checkbox">
                  {filters.isOrganic && <i className="fas fa-check"></i>}
                </span>
                Organic Products Only
              </label>
            </div>
            
            <div className="filter-actions">
              <button type="button" className="reset-button" onClick={resetFilters}>
                Reset
              </button>
              <button type="submit" className="filter-button">
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        <div className="products-section">
          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : (
            <>
              <div className="products-header">
                <div className="products-count">
                  {products.length} product{products.length !== 1 ? 's' : ''} available
                </div>
                <div className="sort-option">
                  <label htmlFor="sortBy">Sort by:</label>
                  <select id="sortBy" disabled>
                    <option value="default">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>
              
              <div className="products-grid">
                {products.length > 0 ? (
                  products.map((product) => (
                    <div key={product._id} className="product-card">
                      <div className="product-image" onClick={() => openQuickView(product)}>
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={getImageUrl(product.images[0])} 
                            alt={product.name}
                            onError={(e) => {
                              console.log("Image failed to load:", product.images[0]);
                              e.target.onerror = null; 
                              e.target.src = 'data:image/png;base64,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';
                            }} 
                          />
                        ) : (
                          <div className="no-image">
                            <i className="fas fa-seedling"></i>
                          </div>
                        )}
                        {product.isOrganic && (
                          <span className="organic-badge">
                            <i className="fas fa-leaf"></i> Organic
                          </span>
                        )}
                        <div className="quick-view-overlay">
                          <button className="quick-view-btn">Quick View</button>
                        </div>
                      </div>
                      <div className="product-details">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-meta">
                          <p className="product-category">
                            <i className="fas fa-tag"></i> {product.category}
                          </p>
                          <p className="product-quantity">
                            <i className="fas fa-boxes"></i> {product.availableQuantity} {product.unit} available
                          </p>
                        </div>
                        <div className="product-price-row">
                          <p className="product-price">${product.price} <span>per {product.unit}</span></p>
                          {isVendor && (
                            <button 
                              className="book-button"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening quick view
                                handleBookNow(product._id);
                              }}
                            >
                              <i className="fas fa-shopping-cart"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-products">
                    <i className="fas fa-search"></i>
                    <p>No products available matching your filters</p>
                    <button className="reset-search-btn" onClick={resetFilters}>
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Product Quick View Modal */}
      {isQuickViewOpen && selectedProduct && (
        <div className="quick-view-modal">
          <div className="modal-overlay" onClick={closeQuickView}></div>
          <div className="modal-content">
            <button className="close-modal" onClick={closeQuickView}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="modal-body">
              <div className="modal-image">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img 
                    src={getImageUrl(selectedProduct.images[0])} 
                    alt={selectedProduct.name} 
                    onError={(e) => {
                      console.log("Modal image failed to load:", selectedProduct.images[0]);
                      e.target.onerror = null;
                      e.target.src = 'data:image/png;base64,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';
                    }}
                  />
                ) : (
                  <div className="no-image">
                    <i className="fas fa-seedling"></i>
                  </div>
                )}
              </div>
              
              <div className="modal-details">
                <h2>{selectedProduct.name}</h2>
                
                <div className="detail-row price-row">
                  <p className="detail-price">${selectedProduct.price} <span>per {selectedProduct.unit}</span></p>
                  {selectedProduct.isOrganic && (
                    <span className="organic-badge-modal">
                      <i className="fas fa-leaf"></i> Organic
                    </span>
                  )}
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{selectedProduct.category}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Available Quantity:</span>
                  <span className="detail-value">{selectedProduct.availableQuantity} {selectedProduct.unit}</span>
                </div>
                
                {selectedProduct.description && (
                  <div className="product-description">
                    <h3>Description</h3>
                    <p>{selectedProduct.description}</p>
                  </div>
                )}
                
                {isVendor && (
                  <div className="modal-actions">
                    <button 
                      className="book-now-btn"
                      onClick={() => {
                        closeQuickView();
                        handleBookNow(selectedProduct._id);
                      }}
                    >
                      <i className="fas fa-shopping-cart"></i> Book Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Modal Component */}
      <BookingModal 
        isOpen={bookingModalOpen} 
        onClose={() => setBookingModalOpen(false)} 
        product={selectedProduct}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default Marketplace;