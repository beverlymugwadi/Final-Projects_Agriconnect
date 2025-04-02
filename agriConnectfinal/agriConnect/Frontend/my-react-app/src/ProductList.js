import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from './api';
import './ProductList.css'; // Create this file for styling

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.search) params.search = filters.search;
      
      const response = await productAPI.getProducts(params);
      console.log('Products data:', response.data);
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h1>All Products</h1>
        <Link to="/farmer-dashboard" className="back-link">Back to Dashboard</Link>
      </div>

      <div className="filters-container">
        <form onSubmit={applyFilters} className="filters-form">
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
            <label htmlFor="minPrice">Min Price</label>
            <input 
              type="number" 
              id="minPrice" 
              name="minPrice" 
              min="0" 
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="maxPrice">Max Price</label>
            <input 
              type="number" 
              id="maxPrice" 
              name="maxPrice" 
              min="0" 
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input 
              type="text" 
              id="search" 
              name="search" 
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search products"
            />
          </div>
          
          <button type="submit" className="filter-button">Apply Filters</button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product._id} className="product-card">
                <div className="product-image">
                  {product.images && product.images.length > 0 ? (
                    <img src={`http://localhost:5400/${product.images[0]}`} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">${product.price} per {product.unit}</p>
                  <p className="product-quantity">Available: {product.availableQuantity} {product.unit}</p>
                  <p className="product-category">Category: {product.category}</p>
                  {product.isOrganic && <span className="organic-badge">Organic</span>}
                </div>
                <div className="product-actions">
                  <Link to={`/products/${product._id}`} className="view-button">View Details</Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">
              <p>No products available</p>
              <Link to="/add-product" className="add-product-link">Add your first product</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductList;