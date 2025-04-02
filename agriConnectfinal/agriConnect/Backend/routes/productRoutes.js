const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/auth');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Set up file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// Public routes
router.get('/', getProducts);

// *** PUT THIS ROUTE BEFORE THE /:id ROUTE ***
router.get('/my-products', protect, authorize('farmer'), getMyProducts);

// This must come AFTER any routes with fixed paths
router.get('/:id', getProduct);

// Private routes with file upload
router.post('/', 
  protect, 
  authorize('farmer'), 
  upload.fields([{ name: 'images', maxCount: 5 }]), 
  createProduct
);

router.put('/:id', protect, authorize('farmer'), updateProduct);
router.delete('/:id', protect, authorize('farmer'), deleteProduct);

module.exports = router;