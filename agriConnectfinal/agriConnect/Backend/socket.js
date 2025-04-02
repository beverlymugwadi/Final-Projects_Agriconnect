// socket.js - Socket.IO singleton module
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/config');
const JWT_SECRET = config.JWT_SECRET;

let io = null;

// Initialize Socket.IO with an HTTP server
const initialize = (server) => {
  if (io) return io;
  
  io = socketIo(server, {
    cors: {
      origin: ["http://localhost:3400", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.IO middleware to authenticate connections
  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userType = decoded.type || decoded.userType;
      
      console.log(`Socket middleware: Authenticated user ${socket.userId}, type: ${socket.userType}`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(' New client connected:', socket.id);
    console.log(' User ID in socket:', socket.userId);
    
    // Join a room specific to this user if authenticated
    if (socket.userId) {
      // Join multiple room formats to handle different ID references
      socket.join(`user_${socket.userId}`);
      console.log(` Socket joined room: user_${socket.userId}`);
      
      // If user type is known, join type-specific room
      if (socket.userType) {
        socket.join(`${socket.userType}_${socket.userId}`);
        console.log(` Socket joined room: ${socket.userType}_${socket.userId}`);
      }
      
      // Send acknowledgment to client
      socket.emit('auth_result', { 
        success: true, 
        message: 'Successfully authenticated on connection',
        userId: socket.userId
      });
    }
    
    // Handle additional authenticate event
    socket.on('authenticate', (token) => {
      try {
        // Verify the JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Update socket data
        socket.userId = decoded.id;
        socket.userType = decoded.type || decoded.userType; // Handle both formats
        
        // Join a room specific to this user
        socket.join(`user_${decoded.id}`);
        console.log(` Socket joined room: user_${decoded.id}`);
        
        // Join type-specific room
        if (socket.userType) {
          socket.join(`${socket.userType}_${decoded.id}`);
          console.log(` Socket joined room: ${socket.userType}_${decoded.id}`);
        }
        
        console.log(` Socket authenticated via event for user: ${decoded.id}`);
        console.log(` User type: ${socket.userType}`);
        
        // Send confirmation to client
        socket.emit('auth_result', { 
          success: true, 
          message: 'Successfully authenticated',
          userId: decoded.id,
          userType: socket.userType
        });
      } catch (error) {
        console.error(' Socket authentication failed:', error.message);
        socket.emit('auth_result', { 
          success: false, 
          message: 'Authentication failed: ' + error.message
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(' Client disconnected:', socket.id);
    });
  });

  return io;
};

// Get the Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Please call initialize() first.');
  }
  return io;
};

module.exports = {
  initialize,
  getIO
};
