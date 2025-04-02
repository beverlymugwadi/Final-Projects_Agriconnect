import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FarmerDashboard = () => {
  // Initialize products as an empty array to prevent the "map is not a function" error
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: '',
    location: '',
    firstName: '',
    surname: '',
    phoneNumber: '',
    price: '',
    status: 'Available',
    productImage: null
  });

  useEffect(() => {
    // Fetch products from the backend when the component mounts
    axios.get('http://localhost:5000/api/products')  
    .then(response => {
      // Make sure response.data is an array before setting it
      const productsData = Array.isArray(response.data) ? response.data : [];
      setProducts(productsData);
      console.log('Products fetched:', productsData);
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      // Initialize with empty array if fetch fails
      setProducts([]);
    });
}, []);

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setNewProduct(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Store the actual file object for FormData
  setNewProduct(prev => ({
    ...prev,
    productImage: file
  }));
  
  // Create a preview of the uploaded image
    const reader = new FileReader();
    reader.onloadend = () => {
      // You could store the preview in a separate state if needed
      console.log('Image loaded');
    };
    reader.readAsDataURL(file);
  };

  const addProduct = () => {
    console.log('Add Product button clicked');
    console.log('Current product data:', newProduct);
    
    // Basic validation
    if (!newProduct.name || !newProduct.price) {
      alert('Please fill in at least the product name and price');
      return;
    }

    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('quantity', newProduct.quantity);
    formData.append('location', newProduct.location);
    formData.append('firstName', newProduct.firstName);
    formData.append('surname', newProduct.surname);
    formData.append('phoneNumber', newProduct.phoneNumber);
    formData.append('price', newProduct.price);
    formData.append('status', newProduct.status);
  
  // Only append the image if it exists
  if (newProduct.productImage) {
    formData.append('productImage', newProduct.productImage);
  }

  // Add headers for FormData
  axios.post('http://localhost:5000/api/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  .then(response => {
    console.log('Product added successfully:', response.data);
    // Make sure we're adding to the array correctly
    const newProductWithResponse = response.data;
    setProducts(prevProducts => [...prevProducts, newProductWithResponse]);
    
    // Reset form
    setNewProduct({
      name: '',
      quantity: '',
      location: '',
      firstName: '',
      surname: '',
      phoneNumber: '',
      price: '',
      status: 'Available',
      productImage: null
    });
  })
  .catch(error => {
    console.error('Error adding product:', error);
    alert('Failed to add product. Please check the console for details.');
  });
};

const styles = {
  dashboard: {
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#f4f7f6',
    minHeight: '100vh',
    padding: '2rem',
    color: '#2c3e50'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#16a34a',
    margin: 0
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '2rem'
  },
  productForm: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem'
  },
  button: {
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    fontWeight: 600
  },
  productList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem'
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease'
  },
  productImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '1rem'
  }
};

return (
  <div style={styles.dashboard}>
    <div style={styles.header}>
      <h1 style={styles.title}>Farmer Dashboard</h1>
      <div>
        <button style={styles.button}>Notifications</button>
      </div>
    </div>

    <div style={styles.container}>
        <div style={styles.productForm}>
          <input
            name="firstName"
            placeholder="First Name"
            value={newProduct.firstName}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            name="surname"
            placeholder="Surname"
            value={newProduct.surname}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            name="phoneNumber"
            placeholder="Phone Number"
            value={newProduct.phoneNumber}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            name="location"
            placeholder="Location"
            value={newProduct.location}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            name="name"
            placeholder="Product Name"
            value={newProduct.name}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            name="quantity"
            placeholder="Quantity"
            type="number"
            value={newProduct.quantity}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            name="price"
            placeholder="Price"
            type="number"
            value={newProduct.price}
            onChange={handleInputChange}
            style={styles.input}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={styles.input}
          />
          <button 
            onClick={addProduct} 
            style={styles.button}
            onMouseOver={e => e.target.style.backgroundColor = '#15803d'}
            onMouseOut={e => e.target.style.backgroundColor = '#16a34a'}
          >
            Add Product
          </button>
        </div>

        <div>
          <h2 style={{color: '#16a34a', marginBottom: '1rem'}}>Your Products</h2>
          {Array.isArray(products) && products.length > 0 ? (
            <div style={styles.productList}>
              {products.map((product, index) => (
                <div 
                  key={index} 
                  style={styles.productCard}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {product.productImage && (
                    <img 
                      src={typeof product.productImage === 'string' ? product.productImage : URL.createObjectURL(product.productImage)} 
                      alt={product.name} 
                      style={styles.productImage} 
                    />
                  )}
                  <h3>{product.name}</h3>
                  <p>Quantity: {product.quantity}</p>
                  <p>Price: ${product.price}</p>
                  <p>Status: {product.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No products available. Add your first product!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;