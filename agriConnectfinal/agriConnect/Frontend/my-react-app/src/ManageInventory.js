import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManageInventory.css';

const ManageInventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);


  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
  
      const userType = localStorage.getItem('userType');
      if (userType !== 'farmer') {
        setError('Only farmers can access inventory management');
        setLoading(false);
        return;
      }
  
      // Call the specific my-products endpoint
      const response = await axios.get('http://localhost:5400/api/products/my-products', {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (response.data.success) {
        setProducts(response.data.data || []);
      } else {
        setError('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory. Please try again later.');
      
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (confirmDelete !== productId) {
      // First click - show confirmation
      setConfirmDelete(productId);
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:5400/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh products list after deletion
      fetchProducts();
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Clean up path
    let path = imagePath;
    if (path.startsWith('uploads/')) {
      path = path.substring(8);
    }
    
    return `http://localhost:5400/uploads/${path}`;
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Manage Inventory</h1>
        <div className="header-actions">
          <Link to="/add-product" className="add-product-btn">Add New Product</Link>
          <button 
            className="back-button"
            onClick={() => navigate('/farmer-dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading inventory...</p>
        </div>
      ) : (
        <div className="inventory-list">
          {products.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Available Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={getImageUrl(product.images[0])} 
                          alt={product.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>${product.price}/{product.unit}</td>
                    <td>{product.availableQuantity} {product.unit}</td>
                    <td className="actions">
                      <Link 
                        to={`/edit-product/${product._id}`} 
                        className="edit-btn"
                      >
                        Edit
                      </Link>
                      <button 
                        className={`delete-btn ${confirmDelete === product._id ? 'confirm' : ''}`}
                        onClick={() => handleDelete(product._id)}
                      >
                        {confirmDelete === product._id ? 'Confirm' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-products">
              <p>You don't have any products in your inventory yet.</p>
              <Link to="/add-product" className="add-product-link">Add your first product</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageInventory;