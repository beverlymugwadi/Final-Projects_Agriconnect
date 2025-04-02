const Message = require('../models/Message');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Farmer = require('../models/Farmer');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
    try {
      console.log('🧩 sendMessage controller called');
      console.log('📦 Request body:', req.body);
      console.log('👤 User ID:', req.user?.id);
      console.log('👤 User Type:', req.user?.userType);
      
      const { recipient, content } = req.body;
      
      if (!recipient || !content) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Please provide recipient and content'
        });
      }
      
      // Initialize variables to track the recipient
      let recipientFound = false;
      let recipientId = recipient;
      let recipientType = 'user'; // Default type
      let originalId = recipient; // Store the original ID for socket events
      
      console.log('🔍 Searching for recipient in User collection...');
      // Step 1: Check if recipient exists in User collection
      try {
        let recipientUser = await User.findById(recipient);
        
        if (recipientUser) {
          console.log('✅ Recipient found in users collection:', recipientUser._id);
          recipientFound = true;
          recipientType = recipientUser.userType || 'user';
        }
      } catch (err) {
        console.log('⚠️ Error looking up user:', err.message);
      }
      
      // Step 2: If not found in User collection, check Vendor collection
      if (!recipientFound) {
        console.log('🔍 Checking vendors collection...');
        try {
          const vendor = await Vendor.findById(recipient);
          
          if (vendor) {
            console.log('✅ Recipient found in vendors collection:', vendor._id);
            recipientFound = true;
            recipientType = 'vendor';
            originalId = vendor._id;
            
            // If the vendor has a user reference, use that
            if (vendor.user) {
              try {
                const vendorUser = await User.findById(vendor.user);
                if (vendorUser) {
                  recipientId = vendorUser._id;
                  console.log('✅ Using vendor\'s user reference:', recipientId);
                }
              } catch (userErr) {
                console.log('⚠️ Error finding vendor user:', userErr.message);
              }
            }
          }
        } catch (err) {
          console.log('⚠️ Error checking vendor:', err.message);
        }
      }
      
      // Step 3: If not found in Vendor collection, check Farmer collection
      if (!recipientFound) {
        console.log('🔍 Checking farmers collection...');
        try {
          const farmer = await Farmer.findById(recipient);
          
          if (farmer) {
            console.log('✅ Recipient found in farmers collection:', farmer._id);
            recipientFound = true;
            recipientType = 'farmer';
            originalId = farmer._id;
            
            // If the farmer has a user reference, use that
            if (farmer.user) {
              try {
                const farmerUser = await User.findById(farmer.user);
                if (farmerUser) {
                  recipientId = farmerUser._id;
                  console.log('✅ Using farmer\'s user reference:', recipientId);
                }
              } catch (userErr) {
                console.log('⚠️ Error finding farmer user:', userErr.message);
              }
            }
          }
        } catch (err) {
          console.log('⚠️ Error checking farmer:', err.message);
        }
      }
      
      // If recipient still not found, try a more relaxed search by substring
      if (!recipientFound) {
        console.log('🔍 Attempting relaxed search by ID substring...');
        
        try {
          // Try to find users where the ID contains the recipient string (or vice versa)
          const allUsers = await User.find({});
          for (const user of allUsers) {
            if (user._id.toString().includes(recipient.substring(0, 10)) || 
                recipient.includes(user._id.toString().substring(0, 10))) {
              console.log('✅ Found user by substring match:', user._id);
              recipientId = user._id;
              recipientFound = true;
              break;
            }
          }
        } catch (error) {
          console.log('⚠️ Error in relaxed search:', error.message);
        }
      }
      
      // If recipient still not found, return 404
      if (!recipientFound) {
        console.log('❌ Recipient not found in any collection:', recipient);
        return res.status(404).json({
          success: false,
          message: 'Recipient not found'
        });
      }
      
      // Create message using the appropriate recipient ID
      const message = await Message.create({
        sender: req.user.id,
        recipient: recipientId,
        content
      });
      
      console.log('✅ Message created:', message._id);
      
      // Populate sender info
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email userType')
        .populate('recipient', 'name email userType');
        
      console.log('✅ Sending response');
      
      // IMPORTANT: Define socketMessage BEFORE the if(io) block
      // so it's available throughout the function
      const socketMessage = {
        _id: populatedMessage._id,
        content: populatedMessage.content,
        sender: populatedMessage.sender,
        recipient: populatedMessage.recipient,
        createdAt: populatedMessage.createdAt,
        recipientType: recipientType,
        originalRecipientId: originalId,
        // Add extra fields to help with matching
        senderType: req.user.userType || 'user',
        conversationId: `${req.user.id}_${recipientId}`
      };
      
      // Mark this message as a vendor message if the sender is a vendor
      if (req.user.userType === 'vendor') {
        socketMessage.isVendorMessage = true;
      }
      
      // Mark this message as a farmer message if the sender is a farmer
      if (req.user.userType === 'farmer') {
        socketMessage.isFarmerMessage = true;
      }
      
      // Emit socket event to recipient
      const io = req.app.get('io');
      if (io) {
        // ENHANCED: Create a list of all rooms to emit to
        const roomsToNotify = new Set([
          `user_${recipientId}`,            // Primary recipient 
          `user_${req.user.id}`,            // Sender
          `entity_${originalId}`,           // Original entity ID room
          `usertype_${recipientType}`,      // All users of a type (e.g., all vendors)
          `usertype_${req.user.userType}`   // All users of sender's type (e.g., all farmers)
        ]);
        
        console.log('📡 Emitting to rooms:', Array.from(roomsToNotify));
        
        // Emit to all relevant rooms
        roomsToNotify.forEach(room => {
          io.to(room).emit('newMessage', socketMessage);
        });
        
        // Also emit to a global room based on entity types for better discovery
        if (req.user.userType === 'farmer' && recipientType === 'vendor') {
          io.to('farmer_vendor_conversations').emit('newMessage', socketMessage);
        }
        
        if (req.user.userType === 'vendor' && recipientType === 'farmer') {
          io.to('farmer_vendor_conversations').emit('newMessage', socketMessage);
        }
      }
      
      res.status(201).json({
        success: true,
        data: {
          ...populatedMessage.toObject(),
          recipientType: recipientType,
          originalRecipientId: originalId,
          senderType: req.user.userType || 'user',
          conversationId: `${req.user.id}_${recipientId}`
        }
      });
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      next(error);
    }
  };
  // @desc    Get unread message counts
  // @route   GET /api/messages/unread-count
  // @access  Private
  exports.getUnreadMessageCounts = async (req, res, next) => {
    try {
      // Find all unread messages where current user is the recipient
      const unreadMessages = await Message.find({
        recipient: req.user.id,
        read: false
      }).populate('sender', 'name userType');
      
      // Count total unread messages
      const total = unreadMessages.length;
      
      // Count unread messages by sender
      const byEntity = {};
      
      // Get all senders and their types
      for (const message of unreadMessages) {
        // Handle if sender is a direct user ID or an object with _id
        const senderId = typeof message.sender === 'object' ? message.sender._id.toString() : message.sender.toString();
        
        // If this sender already has a count, increment it, otherwise set to 1
        byEntity[senderId] = (byEntity[senderId] || 0) + 1;
        
        // If this message has an originalRecipientId (might be entity ID), also count for that
        if (message.originalSenderId) {
          byEntity[message.originalSenderId] = (byEntity[message.originalSenderId] || 0) + 1;
        }
      }
      
      res.status(200).json({
        success: true,
        data: {
          total,
          byEntity
        }
      });
    } catch (error) {
      console.error('Error getting unread message counts:', error);
      next(error);
    }
  };
// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read
// @access  Private
exports.markMessagesAsRead = async (req, res, next) => {
    try {
      const { recipient } = req.body;
      
      if (!recipient) {
        return res.status(400).json({
          success: false,
          message: 'Recipient ID is required'
        });
      }
      
      // Find all messages from the specified recipient to the current user
      await Message.updateMany(
        { 
          sender: recipient,
          recipient: req.user.id,
          read: false
        },
        { read: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      next(error);
    }
  };
// @desc    Get messages for current user
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
      const { recipient } = req.query;
      
      // Debug the incoming request
      console.log('🔍 GET MESSAGES REQUEST:');
      console.log('👤 User ID:', req.user?.id);
      console.log('🎯 Recipient param:', recipient);
      
      let query = {};
      let actualRecipientId = recipient;
      let recipientFound = false;
      
      // If recipient is specified, get conversation with that user
      if (recipient) {
        console.log('🔍 Getting conversation with specific recipient');
        
        // Check User collection
        try {
          const userRecipient = await User.findById(recipient);
          if (userRecipient) {
            console.log('✅ Recipient found in users collection');
            recipientFound = true;
            actualRecipientId = userRecipient._id;
          }
        } catch (error) {
          console.log('❌ Error checking user:', error.message);
        }
        
        // If not found in User collection, check others
        if (!recipientFound) {
          // Check Vendor collection
          try {
            const vendorRecipient = await Vendor.findById(recipient);
            if (vendorRecipient) {
              console.log('✅ Recipient found in vendors collection');
              recipientFound = true;
              
              // If the vendor has a user reference, use that
              if (vendorRecipient.user) {
                try {
                  const vendorUser = await User.findById(vendorRecipient.user);
                  if (vendorUser) {
                    actualRecipientId = vendorUser._id;
                    console.log('✅ Using vendor\'s user reference:', actualRecipientId);
                  }
                } catch (userErr) {
                  console.log('❌ Error finding vendor user:', userErr.message);
                }
              }
            }
          } catch (error) {
            console.log('❌ Error checking vendors:', error.message);
          }
          
          // Check Farmer collection
          try {
            const farmerRecipient = await Farmer.findById(recipient);
            if (farmerRecipient) {
              console.log('✅ Recipient found in farmers collection');
              recipientFound = true;
              
              // If the farmer has a user reference, use that
              if (farmerRecipient.user) {
                try {
                  const farmerUser = await User.findById(farmerRecipient.user);
                  if (farmerUser) {
                    actualRecipientId = farmerUser._id;
                    console.log('✅ Using farmer\'s user reference:', actualRecipientId);
                  }
                } catch (userErr) {
                  console.log('❌ Error finding farmer user:', userErr.message);
                }
              }
            }
          } catch (error) {
            console.log('❌ Error checking farmers:', error.message);
          }
        }
        
        // If still not found, try by substring match
        if (!recipientFound) {
          console.log('🔍 Attempting relaxed search by ID substring...');
          
          try {
            // Try to find users where the ID contains the recipient string (or vice versa)
            const allUsers = await User.find({});
            for (const user of allUsers) {
              if (user._id.toString().includes(recipient.substring(0, 10)) || 
                  recipient.includes(user._id.toString().substring(0, 10))) {
                console.log('✅ Found user by substring match:', user._id);
                actualRecipientId = user._id;
                recipientFound = true;
                break;
              }
            }
          } catch (error) {
            console.log('❌ Error in relaxed search:', error.message);
          }
        }
        
        if (!recipientFound) {
          console.log('⚠️ Warning: Recipient not found in any collection, using original ID');
        }
        
        // Build query for conversation between current user and recipient
        query = {
          $or: [
            { sender: req.user.id, recipient: actualRecipientId },
            { sender: actualRecipientId, recipient: req.user.id }
          ]
        };
        
        console.log('🔍 Query:', JSON.stringify(query));
      } else {
        // Get all conversations
        console.log('🔍 Getting all conversations for current user');
        query = {
          $or: [
            { sender: req.user.id },
            { recipient: req.user.id }
          ]
        };
      }
      
      // Execute the query to get messages
      const messages = await Message.find(query)
        .sort('createdAt')
        .populate('sender', 'name email userType')
        .populate('recipient', 'name email userType');
      
      console.log(`✅ Found ${messages.length} messages`);
      
      // Mark messages as read if they were sent to the current user
      if (messages.length > 0) {
        const messagesToUpdate = messages.filter(msg => 
          msg.recipient._id.toString() === req.user.id && !msg.read
        );
        
        if (messagesToUpdate.length > 0) {
          await Message.updateMany(
            { 
              _id: { $in: messagesToUpdate.map(msg => msg._id) } 
            },
            { read: true }
          );
          console.log(`✅ Marked ${messagesToUpdate.length} messages as read`);
        }
      }
      
      res.status(200).json({
        success: true,
        count: messages.length,
        data: messages
      });
    } catch (error) {
      console.error('❌ Error in getMessages:', error);
      next(error);
    }
  };
    
// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    // Find all messages where user is sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    })
    .sort('-createdAt')
    .populate('sender', 'name email userType')
    .populate('recipient', 'name email userType');
    
    // Extract unique conversation partners
    const conversations = [];
    const conversationPartners = new Set();
    
    messages.forEach(message => {
      const partnerId = message.sender._id.toString() === req.user.id 
        ? message.recipient._id.toString()
        : message.sender._id.toString();
        
      if (!conversationPartners.has(partnerId)) {
        conversationPartners.add(partnerId);
        
        const partner = message.sender._id.toString() === req.user.id
          ? message.recipient
          : message.sender;
          
        conversations.push({
          partnerId: partner._id,
          partner,
          lastMessage: message.content,
          timestamp: message.createdAt,
          unread: message.recipient._id.toString() === req.user.id && !message.read ? 1 : 0
        });
      }
    });
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};