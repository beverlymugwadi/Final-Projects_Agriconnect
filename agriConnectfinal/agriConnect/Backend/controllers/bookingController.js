// controllers/bookingController.js - Booking controller
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const Farmer = require('../models/Farmer');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification');
const User = require('../models/User');
const socketModule = require('../socket');

// Get the io instance from socket module
const getIO = () => {
  try {
    return socketModule.getIO();
  } catch (error) {
    console.error('Socket.io instance not available:', error.message);
    return null;
  }
};

// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private (vendors only)
exports.createBooking = async (req, res, next) => {
  try {
    const { product, quantity, deliveryAddress, paymentMethod, notes } = req.body;

    // Validate product
    const foundProduct = await Product.findById(product).populate('farmer');
    if (!foundProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate vendor
    const vendor = await Vendor.findOne({ user: req.user.id }).populate('user');
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found' });
    }

    // Calculate total price
    const totalPrice = foundProduct.price * quantity;

    // Create booking
    const booking = await Booking.create({
      product,
      farmer: foundProduct.farmer._id,
      vendor: vendor._id,
      quantity,
      totalPrice,
      deliveryAddress,
      paymentMethod,
      notes,
    });

    console.log('New booking created:', {
      bookingId: booking._id,
      product: foundProduct.name,
      quantity,
      farmer: foundProduct.farmer._id,
      vendor: vendor._id
    });

    // Get farmer user ID for notification
    const farmerUser = await User.findById(foundProduct.farmer.user);
    if (!farmerUser) {
      console.error('Farmer user not found for notification');
    }

    // Create notification for the farmer
    const farmerNotification = await Notification.create({
      recipient: farmerUser._id,
      recipientType: 'farmer',
      title: 'New Order Received',
      message: `${vendor.user.name || 'A vendor'} has ordered ${quantity} ${foundProduct.unit} of ${foundProduct.name}.`,
      type: 'order',
      relatedId: booking._id,
      read: false,
      timestamp: new Date()
    });
    
    console.log('Created farmer notification:', {
      notificationId: farmerNotification._id,
      recipient: farmerUser._id,
      recipientType: 'farmer'
    });
    
    // Emit notification to the farmer
    const io = getIO();
    if (io) {
      // Send to both room formats to ensure delivery
      io.to(`farmer_${farmerUser._id}`).emit('newNotification', farmerNotification);
      io.to(`user_${farmerUser._id}`).emit('newNotification', farmerNotification);
      
      console.log(`Notification sent to farmer: ${farmerUser._id}`, {
        rooms: [`farmer_${farmerUser._id}`, `user_${farmerUser._id}`],
        notification: farmerNotification
      });
    } else {
      console.error('Socket.io instance not available for sending notification');
    }

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    next(error);
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (farmers & vendors)
exports.getBookings = async (req, res, next) => {
  try {
    let query;
    console.log('User requesting bookings:', req.user);

    if (req.query.all === 'true') {
      // Admin/debug feature to get all bookings
      console.log('Getting all bookings (debug mode)');
      query = Booking.find();
    } else if (req.user.userType === 'vendor') {
      // Find the vendor using the user ID
      const vendor = await Vendor.findOne({ user: req.user.id });
      
      if (vendor) {
        // Query using the vendor's ID
        query = Booking.find({ vendor: vendor._id });
        console.log('Searching bookings for vendor ID:', vendor._id);
      } else {
        // Fallback to user ID
        query = Booking.find({ vendor: req.user.id });
        console.log('Vendor profile not found, searching with user ID:', req.user.id);
      }
    } else if (req.user.userType === 'farmer') {
      // Find the farmer using the user ID
      const farmer = await Farmer.findOne({ user: req.user.id });
      
      if (farmer) {
        // Query using the farmer's ID
        query = Booking.find({ farmer: farmer._id });
        console.log('Searching bookings for farmer ID:', farmer._id);
      } else {
        // Fallback to user ID
        query = Booking.find({ farmer: req.user.id });
        console.log('Farmer profile not found, searching with user ID:', req.user.id);
      }
    }    

    // Populate all related fields for complete data
    const bookings = await query
      .populate('product', 'name price unit category availableQuantity')
      .populate('farmer', 'farmName farmLocation')
      .populate('vendor', 'companyName businessName businessLocation')
      .sort('-createdAt');
      
    console.log(`Found ${bookings.length} bookings`);

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    next(error);
  }
};

// @desc    Get a specific booking by ID
// @route   GET /api/bookings/:id
// @access  Private (any authenticated user)
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('product vendor farmer', 'name companyName farmName');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private (farmers only)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    console.log('Update booking request:', {
      bookingId: req.params.id,
      userId: req.user.id,
      userType: req.user.userType,
      requestedStatus: req.body.status
    });
    
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'product',
        populate: { path: 'farmer' }
      })
      .populate({
        path: 'vendor',
        populate: { path: 'user' }
      })
      .populate({
        path: 'farmer',
        populate: { path: 'user' }
      });
      
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    console.log('Booking found:', {
      bookingId: booking._id,
      farmer: booking.farmer._id,
      vendor: booking.vendor._id,
      currentStatus: booking.status
    });

    // Check if the requested status is valid
    const validStatuses = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Modified authorization check for farmers
    if (req.user.userType === 'farmer') {
      // Find the farmer by user ID
      const farmer = await Farmer.findOne({ user: req.user.id });
      
      if (!farmer) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized: Farmer profile not found for this user' 
        });
      }
      
      // Then check if the booking's farmer matches this farmer's ID
      if (booking.farmer._id.toString() !== farmer._id.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Unauthorized: You can only update orders for your own products',
          requestedFarmer: farmer._id,
          bookingFarmer: booking.farmer._id
        });
      }
    } else if (req.user.userType === 'vendor') {
      // Only allow vendors to cancel their own orders
      const vendor = await Vendor.findOne({ user: req.user.id });
      
      if (!vendor) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Vendor profile not found for this user'
        });
      }
      
      if (booking.vendor._id.toString() !== vendor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: You can only manage your own orders'
        });
      }
      
      // Vendors can only cancel orders (not change to other statuses)
      if (req.body.status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Vendors can only cancel orders, not change their status'
        });
      }
    }
    
    const previousStatus = booking.status;
    
    // Update booking status
    booking.status = req.body.status;
    
    // Update product inventory when order is confirmed
    if (req.body.status === 'confirmed' && previousStatus !== 'confirmed') {
      // Get the product and update its available quantity
      const product = await Product.findById(booking.product._id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // Check if there's enough quantity available
      if (product.availableQuantity < booking.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough inventory available. Current stock: ${product.availableQuantity} ${product.unit}`
        });
      }
      
      // Reduce the available quantity
      product.availableQuantity -= booking.quantity;
      
      // Save the updated product
      await product.save();
      
      console.log('Product inventory updated:', {
        productId: product._id,
        productName: product.name,
        previousQuantity: product.availableQuantity + booking.quantity,
        newQuantity: product.availableQuantity,
        orderQuantity: booking.quantity
      });
      
      // Create notification for the vendor
      const vendorNotification = await Notification.create({
        recipient: booking.vendor.user._id,
        recipientType: 'vendor',
        title: 'Order Confirmed',
        message: `Your order for ${booking.quantity} ${product.unit} of ${product.name} has been confirmed.`,
        type: 'order',
        relatedId: booking._id,
        read: false,
        timestamp: new Date()
      });
      
      console.log('Created vendor notification:', {
        notificationId: vendorNotification._id,
        recipient: booking.vendor.user._id,
        recipientType: 'vendor'
      });
      
      // Emit notification to the vendor
      const io = getIO();
      if (io) {
        io.to(`vendor_${booking.vendor.user._id}`).emit('newNotification', vendorNotification);
        io.to(`user_${booking.vendor.user._id}`).emit('newNotification', vendorNotification);
        
        console.log(`Notification sent to vendor: ${booking.vendor.user._id}`, {
          rooms: [`vendor_${booking.vendor.user._id}`, `user_${booking.vendor.user._id}`],
          notification: vendorNotification
        });
        
        // Emit inventory update event to all connected farmers
        io.to(`farmer_${booking.farmer.user._id}`).emit('inventoryUpdate', {
          productId: product._id,
          newQuantity: product.availableQuantity,
          action: 'confirmed'
        });
        
        console.log(`Inventory update sent to farmer: ${booking.farmer.user._id}`, {
          productId: product._id,
          newQuantity: product.availableQuantity
        });
      } else {
        console.error('Socket.io instance not available for sending notification');
      }
    }
    
    // If order was previously confirmed but now cancelled, restore the inventory
    if (req.body.status === 'cancelled' && previousStatus === 'confirmed') {
      // Get the product and update its available quantity
      const product = await Product.findById(booking.product._id);
      
      if (product) {
        // Add the quantity back to inventory
        product.availableQuantity += booking.quantity;
        
        // Save the updated product
        await product.save();
        
        console.log('Product inventory restored:', {
          productId: product._id,
          productName: product.name,
          previousQuantity: product.availableQuantity - booking.quantity,
          newQuantity: product.availableQuantity,
          restoredQuantity: booking.quantity
        });
        
        // Create notification for the vendor about cancellation
        const vendorCancelNotification = await Notification.create({
          recipient: booking.vendor.user._id,
          recipientType: 'vendor',
          title: 'Order Cancelled',
          message: `Your order for ${booking.quantity} ${product.unit} of ${product.name} has been cancelled.`,
          type: 'order',
          relatedId: booking._id,
          read: false,
          timestamp: new Date()
        });
        
        // Emit notification to the vendor
        const io = getIO();
        if (io) {
          io.to(`vendor_${booking.vendor.user._id}`).emit('newNotification', vendorCancelNotification);
          io.to(`user_${booking.vendor.user._id}`).emit('newNotification', vendorCancelNotification);
          
          // Emit inventory update event to all connected farmers
          io.to(`farmer_${booking.farmer.user._id}`).emit('inventoryUpdate', {
            productId: product._id,
            newQuantity: product.availableQuantity,
            action: 'cancelled'
          });
        } else {
          console.error('Socket.io instance not available for sending notification');
        }
      }
    }
    
    // For other status changes (shipped, delivered), create appropriate notifications
    if (['shipped', 'delivered'].includes(req.body.status) && previousStatus !== req.body.status) {
      // Create notification for the vendor
      const statusChangeNotification = await Notification.create({
        recipient: booking.vendor.user._id,
        recipientType: 'vendor',
        title: `Order ${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)}`,
        message: `Your order for ${booking.product.name} has been ${req.body.status}.`,
        type: 'order',
        relatedId: booking._id,
        read: false,
        timestamp: new Date()
      });
      
      // Emit notification to the vendor
      const io = getIO();
      if (io) {
        io.to(`vendor_${booking.vendor.user._id}`).emit('newNotification', statusChangeNotification);
        io.to(`user_${booking.vendor.user._id}`).emit('newNotification', statusChangeNotification);
      }
    }
    
    await booking.save();
    
    console.log('Booking updated successfully:', {
      bookingId: booking._id,
      newStatus: booking.status
    });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    next(error);
  }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private (vendors only)
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user is authorized (vendor role and matches the booking's vendor)
    if (req.user.role !== 'vendor' || booking.vendor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    // Delete the booking
    await booking.deleteOne();
    res.status(200).json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    next(error);
  }
};
