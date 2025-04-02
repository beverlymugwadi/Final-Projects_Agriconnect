import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../api';
import './ManageInventory.css';

const ManageInventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Get farmer's products - this assumes you're logged in as a farmer
      const userType = localStorage.getItem('userType');
      if (userType !== 'farmer') {
        setError('Only farmers can access inventory management');
        setLoading(false);
        return;
      }

      const response = await productAPI.getProducts();
      const farmerProducts = response.data.data || [];
      setProducts(farmerProducts);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setError('Failed to load inventory. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    // Set this product for editing
    setEditingProduct({
      ...product,
      quantity: product.availableQuantity
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingProduct({
      ...editingProduct,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const saveChanges = async () => {
    if (!editingProduct) return;
    
    try {
      setLoading(true);
      
      // Prepare updated product data
      const updatedData = {
        name: editingProduct.name,
        price: editingProduct.price,
        availableQuantity: editingProduct.quantity,
        description: editingProduct.description,
        category: editingProduct.category,
        unit: editingProduct.unit,
        isOrganic: editingProduct.isOrganic,
        isFeatured: editingProduct.isFeatured
      };
      
      // Update product in database
      await productAPI.updateProduct(editingProduct._id, updatedData);
      
      // Refresh products list
      fetchProducts();
      
      // Clear editing state
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product. Please try again.');
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
      
      // Delete product from database
      await productAPI.deleteProduct(productId);
      
      // Refresh products list
      fetchProducts();
      
      // Clear confirmation state
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
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
      
      {loading && !editingProduct ? (
        <div className="loading">Loading inventory...</div>
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
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td className="product-image">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={`http://localhost:5400/${product.images[0]}`} 
                          alt={product.name} 
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
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>
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
      
      {editingProduct && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button 
                className="close-modal"
                onClick={() => setEditingProduct(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={editingProduct.name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    name="price"
                    value={editingProduct.price}
                    onChange={handleChange}
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editingProduct.quantity}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={editingProduct.category}
                    onChange={handleChange}
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="dairy">Dairy</option>
                    <option value="livestock">Livestock</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    name="unit"
                    value={editingProduct.unit}
                    onChange={handleChange}
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
                <label>Description</label>
                <textarea
                  name="description"
                  value={editingProduct.description}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-row checkboxes">
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="isOrganic"
                    name="isOrganic"
                    checked={editingProduct.isOrganic}
                    onChange={handleChange}
                  />
                  <label htmlFor="isOrganic">Organic Product</label>
                </div>
                
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={editingProduct.isFeatured}
                    onChange={handleChange}
                  />
                  <label htmlFor="isFeatured">Featured Product</label>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </button>
              <button 
                className="save-btn"
                onClick={saveChanges}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInventory;