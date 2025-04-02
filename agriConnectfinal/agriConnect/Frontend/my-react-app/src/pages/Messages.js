import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import './Messages.css';

const BASE_URL = 'http://localhost:5400/api';
const SOCKET_URL = 'http://localhost:5400'; // Socket.IO server URL

const Messages = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipientId, setRecipientId] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check token validity and redirect if invalid
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }

    // Verify token is still valid by checking with backend
    const checkAuth = async () => {
      try {
        await axios.get(`${BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Authentication error:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
        navigate('/login', { state: { from: location.pathname + location.search } });
      }
    };

    checkAuth();
  }, [navigate, location]);

  // Force a refresh when the recipient ID changes in the URL
  useEffect(() => {
    // Extract recipient from URL whenever it changes
    const queryParams = new URLSearchParams(location.search);
    const queryRecipient = queryParams.get('recipient');
    const urlRecipientId = vendorId || queryRecipient;
    
    if (urlRecipientId && urlRecipientId !== recipientId) {
      console.log('📋 Recipient ID changed in URL, refreshing data...');
      setRecipientId(urlRecipientId);
      // Don't need to call fetchData here, it will be triggered by the dependency
    }
  }, [location.search, vendorId, recipientId]);

  // Set up Socket.IO connection
  useEffect(() => {
    // Clear previous connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: false, // Don't connect automatically
      query: {
        token: localStorage.getItem('token') // Send token in connection query
      }
    });

    // Log connection events for debugging
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket.IO connected with ID:', socketRef.current.id);
      setSocketConnected(true);
      
      // Authenticate after connecting
      socketRef.current.emit('authenticate', localStorage.getItem('token'));
      console.log('🔑 Authentication request sent');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error);
      setSocketConnected(false);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setSocketConnected(false);
    });

    // Enhanced error handling
    socketRef.current.on('error', (error) => {
      console.error('🚫 Socket error:', error);
    });

    socketRef.current.on('auth_result', (result) => {
      console.log('🔑 Socket authentication result:', result);
      if (result.success) {
        console.log(`✅ Successfully authenticated as user: ${result.userId}`);
      } else {
        console.error('❌ Socket authentication failed:', result.message);
      }
    });

// Listen for new messages
// Socket message handler with improved ID matching logic
socketRef.current.on('newMessage', (newMessage) => {
  console.log('📬 New message received via socket:', newMessage);
  
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.error('❌ No user ID found in localStorage');
    return;
  }
  
  // More detailed logging to debug conversation matching
  console.log(`Current user ID: ${userId}`);
  console.log(`Current recipient ID: ${recipientId}`);
  console.log(`Message sender ID: ${newMessage.sender?._id}`);
  console.log(`Message recipient ID: ${newMessage.recipient?._id}`);
  console.log(`Original recipient ID: ${newMessage.originalRecipientId}`);
  
  // Check if the message is for me (either as sender or recipient)
  const isSender = newMessage.sender?._id === userId;
  const isRecipient = newMessage.recipient?._id === userId;
  
  // Get the current user type
  const userType = localStorage.getItem('userType');
  
  // Log more details for debugging the matching logic
  console.log(`Message data check:`);
  console.log(`- Has sender: ${Boolean(newMessage.sender)}`);
  console.log(`- Has recipient: ${Boolean(newMessage.recipient)}`);
  console.log(`- Has originalRecipientId: ${Boolean(newMessage.originalRecipientId)}`);
  console.log(`- Content: ${newMessage.content}`);
  console.log(`- User type: ${userType}`);
  console.log(`- Message sender type: ${newMessage.senderType}`);
  
  // IMPROVED MATCHING LOGIC: Use a more comprehensive approach

  // 1. First check if I need to see this message at all (am I sender or recipient)
  if (!isSender && !isRecipient) {
    // Special case: if I'm a vendor and this is a farmer message, I might still need to see it
    if (userType === 'vendor' && newMessage.senderType === 'farmer') {
      console.log('Checking vendor-farmer special case...');
    } else {
      console.log("❌ I'm neither sender nor recipient, ignoring message");
      return;
    }
  }
  
  // 2. Determine if this is relevant to the current conversation
  let isRelevantConversation = false;
  
  // Get all the IDs we might need to compare
  const senderID = newMessage.sender?._id || '';
  const recipientID = newMessage.recipient?._id || '';
  const originalEntityID = newMessage.originalRecipientId || '';
  
  // ID normalization function for more reliable comparison
  const normalizeId = (id) => id?.toString().toLowerCase().trim() || '';
  
  // Normalized IDs for comparison
  const normalizedRecipientId = normalizeId(recipientId);
  const normalizedSenderId = normalizeId(senderID);
  const normalizedMessageRecipientId = normalizeId(recipientID);
  const normalizedOriginalEntityId = normalizeId(originalEntityID);
  
  console.log('Normalized current recipient ID:', normalizedRecipientId);
  console.log('Normalized message sender ID:', normalizedSenderId);
  console.log('Normalized message recipient ID:', normalizedMessageRecipientId);
  console.log('Normalized original entity ID:', normalizedOriginalEntityId);
  
  // 3. Check all possible matches with short prefix matches (5 chars is enough for MongoDB ObjectIDs)
  
  // Direct matches first
  if (normalizedRecipientId === normalizedSenderId || 
      normalizedRecipientId === normalizedMessageRecipientId || 
      normalizedRecipientId === normalizedOriginalEntityId) {
    console.log('✅ Direct ID match found');
    isRelevantConversation = true;
  }
  
  // Prefix/partial matches
  else if (
    // Check if current recipient ID is a prefix of any message IDs
    (normalizedSenderId.includes(normalizedRecipientId.substring(0, 5)) ||
    normalizedMessageRecipientId.includes(normalizedRecipientId.substring(0, 5)) ||
    normalizedOriginalEntityId.includes(normalizedRecipientId.substring(0, 5))) ||
    
    // Or if any message ID is a prefix of current recipient ID
    (normalizedRecipientId.includes(normalizedSenderId.substring(0, 5)) ||
    normalizedRecipientId.includes(normalizedMessageRecipientId.substring(0, 5)) ||
    normalizedRecipientId.includes(normalizedOriginalEntityId.substring(0, 5)))
  ) {
    console.log('✅ Prefix/partial ID match found');
    isRelevantConversation = true;
  }
  
  // 4. Special cases for different user types
  
  // Vendor viewing farmer messages
  if (!isRelevantConversation && userType === 'vendor' && newMessage.senderType === 'farmer') {
    if (isSender || isRecipient) {
      console.log('✅ Vendor relevant: direct message with farmer');
      isRelevantConversation = true;
    }
  }
  
  // Farmer viewing vendor messages
  if (!isRelevantConversation && userType === 'farmer' && newMessage.senderType === 'vendor') {
    if (isSender || isRecipient) {
      console.log('✅ Farmer relevant: direct message with vendor');
      isRelevantConversation = true;
    }
  }
  
  // 5. Self-sent messages always appear in current conversation
  if (!isRelevantConversation && isSender) {
    const isRecentMessage = (Date.now() - new Date(newMessage.createdAt).getTime()) < 10000; // 10s
    if (isRecentMessage) {
      console.log('✅ Recently sent message by me, showing in current conversation');
      isRelevantConversation = true;
    }
  }
  
  console.log(`Is relevant conversation: ${isRelevantConversation}`);
  
  // 6. If relevant, add to messages
  if (isRelevantConversation) {
    console.log('✅ Message belongs to current conversation, adding to state');
    const formattedMessage = {
      id: newMessage._id,
      text: newMessage.content,
      sender: isSender ? 'me' : 'other',
      timestamp: new Date(newMessage.createdAt)
    };
    
    // Use functional update to prevent stale state
    setMessages(prevMessages => {
      // Check if message already exists to prevent duplicates
      const isDuplicate = prevMessages.some(msg => 
        msg.id === newMessage._id || 
        (msg.pending && msg.text === newMessage.content && 
         new Date(msg.timestamp).getTime() > Date.now() - 10000)
      );
      
      if (isDuplicate) {
        console.log('⚠️ Duplicate message, not adding again');
        return prevMessages;
      }
      
      // Remove any pending messages that match this confirmed message
      const filteredMessages = prevMessages.filter(msg => 
        !(msg.pending && msg.text === newMessage.content && 
          new Date(msg.timestamp).getTime() > Date.now() - 10000)
      );
      
      return [...filteredMessages, formattedMessage];
    });
    
    // Schedule scrolling after state update
    setTimeout(scrollToBottom, 100);
  } else {
    console.log('❌ Message does not belong to current conversation, ignoring');
  }
});


    // Start the connection
    socketRef.current.connect();

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting Socket.IO');
        socketRef.current.off('newMessage');
        socketRef.current.off('connect');
        socketRef.current.off('connect_error');
        socketRef.current.off('disconnect');
        socketRef.current.off('error');
        socketRef.current.off('auth_result');
        socketRef.current.disconnect();
      }
    };
  }, [recipientId]); // Re-initialize if recipientId changes

  // Fetch messages and recipient data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
  
        const headers = {
          Authorization: `Bearer ${token}`
        };

        // Extract recipient from either params or query string
        const queryParams = new URLSearchParams(location.search);
        const queryRecipient = queryParams.get('recipient');
        const actualRecipientId = vendorId || queryRecipient;
        
        // Store the recipient ID for later use
        setRecipientId(actualRecipientId);
        
        console.log('📋 Using recipient ID:', actualRecipientId);

        // If recipient ID is provided, fetch recipient details
        if (actualRecipientId) {
          let recipientFound = false;
          
          // Try to fetch as vendor first
          try {
            const vendorResponse = await axios.get(`${BASE_URL}/vendors/${actualRecipientId}`, { headers });
            if (vendorResponse.data.success) {
              setVendor({
                ...vendorResponse.data.data,
                businessName: vendorResponse.data.data.businessName || 'Vendor',
                businessType: 'Retailer', // Explicitly set business type for vendors
                _id: actualRecipientId // Store the original ID
              });
              recipientFound = true;
              console.log('✅ Found recipient as vendor:', vendorResponse.data.data);
            }
          } catch (vendorErr) {
            console.log('Not a vendor, trying as farmer...');
          }
          
          // If not a vendor, try as farmer
          if (!recipientFound) {
            try {
              const farmerResponse = await axios.get(`${BASE_URL}/farmers/${actualRecipientId}`, { headers });
              if (farmerResponse.data.success) {
                setVendor({
                  ...farmerResponse.data.data,
                  businessName: farmerResponse.data.data.farmName || farmerResponse.data.data.name || 'Farmer',
                  businessType: 'Farmer', // Explicitly set business type for farmers
                  _id: actualRecipientId // Store the original ID
                });
                recipientFound = true;
                console.log('✅ Found recipient as farmer:', farmerResponse.data.data);
              }
            } catch (farmerErr) {
              console.log('Not a farmer, trying as user...');
            }
          }
          
          // If not a farmer or vendor, try as user
          if (!recipientFound) {
            try {
              const userResponse = await axios.get(`${BASE_URL}/users/${actualRecipientId}`, { headers });
              if (userResponse.data.success) {
                setVendor({
                  ...userResponse.data.data,
                  businessName: userResponse.data.data.name || 'User',
                  businessType: userResponse.data.data.userType || 'User',
                  _id: actualRecipientId // Store the original ID
                });
                recipientFound = true;
                console.log('✅ Found recipient as user:', userResponse.data.data);
              }
            } catch (userErr) {
              console.log('Not found as user, trying direct message fetch...');
            }
          }
          
          // Even if we couldn't find the recipient in any collection, still try to fetch messages
          // This can happen if the recipient exists in messages but not in other collections
          try {
            console.log(`Fetching messages with recipient: ${actualRecipientId}`);
            const messagesResponse = await axios.get(
              `${BASE_URL}/messages?recipient=${actualRecipientId}`,
              { headers }
            );
            
            if (messagesResponse.data.success) {
              const userId = localStorage.getItem('userId');
              const formattedMessages = messagesResponse.data.data.map(msg => ({
                id: msg._id,
                text: msg.content,
                sender: msg.sender._id === userId ? 'me' : 'other',
                timestamp: new Date(msg.createdAt)
              }));
              
              console.log(`Loaded ${formattedMessages.length} messages`);
              setMessages(formattedMessages);
              
              // If we have messages but no recipient info, try to extract it from the first message
              if (!recipientFound && formattedMessages.length > 0) {
                const firstMessage = messagesResponse.data.data[0];
                const otherParty = firstMessage.sender._id === userId ? 
                  firstMessage.recipient : firstMessage.sender;
                
                if (otherParty) {
                  setVendor({
                    _id: otherParty._id,
                    businessName: otherParty.name || 'Contact',
                    businessType: otherParty.userType || 'User'
                  });
                  console.log('✅ Extracted recipient info from messages:', otherParty);
                }
              }
            }
          } catch (err) {
            console.error('Error fetching messages:', err);
            if (err.response && err.response.status === 401) {
              localStorage.removeItem('token');
              navigate('/login');
            } else {
              setError('Could not load messages. Please try again later.');
            }
          }
        } else {
          // No recipient specified, get all conversations
          try {
            const messagesResponse = await axios.get(`${BASE_URL}/messages/conversations`, { headers });
            if (messagesResponse.data.success) {
              // This would show a list of conversations instead of messages
              console.log('Conversations:', messagesResponse.data.data);
            }
          } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Could not load conversations');
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load messages');
        
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vendorId, navigate, location.search]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (!recipientId) {
      alert('No recipient selected. Please select a user to message.');
      return;
    }
  
    // Create a temporary message with a unique ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const messageContent = newMessage;
    const tempMessage = {
      id: tempId,
      text: messageContent,
      sender: 'me',
      timestamp: new Date(),
      pending: true
    };
    
    // Clear input right away for better UX
    setNewMessage('');
    
    // Add to messages immediately for instant feedback
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Scroll to bottom immediately
    setTimeout(scrollToBottom, 50);
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
  
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
  
      const messageData = {
        recipient: recipientId,
        content: messageContent
      };
  
      console.log('📤 Sending message:');
      console.log(`📍 URL: ${BASE_URL}/messages`);
      console.log(`📦 Data:`, messageData);
  
      const response = await axios.post(`${BASE_URL}/messages`, messageData, { headers });
      
      if (response.data.success) {
        // Replace temporary message with confirmed message
        const sentMessage = {
          id: response.data.data._id,
          text: response.data.data.content,
          sender: 'me',
          timestamp: new Date(response.data.data.createdAt || Date.now())
        };
  
        // Use a function to update state to avoid stale closures
        setMessages(prevMessages => {
          // Check if the message is already in the list (maybe from socket)
          const messageExists = prevMessages.some(msg => 
            msg.id === response.data.data._id && !msg.pending
          );
          
          if (messageExists) {
            // Message already exists (probably from socket), just remove the temp
            return prevMessages.filter(msg => msg.id !== tempId);
          } else {
            // Replace the temp message with the confirmed one
            return prevMessages.map(msg => 
              msg.id === tempId ? sentMessage : msg
            );
          }
        });
        
        console.log('✅ Message sent and confirmed');
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      
      // Mark the temporary message as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId ? {...msg, failed: true} : msg
        )
      );
      
      if (err.response && err.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert(`Failed to send message: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {/* Header */}
      <div className="messages-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="contact-info">
          {vendor ? (
            <>
              <h2>{vendor.businessName || vendor.farmName || 'Contact'}</h2>
              <p className="user-type">{vendor.businessType || vendor.farmType || 'User'}</p>
              {socketConnected && <div className="socket-status connected" title="Real-time messaging active"></div>}
              {!socketConnected && <div className="socket-status disconnected" title="Using standard messaging"></div>}
            </>
          ) : (
            <h2>Messages</h2>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div className="messages-list">
        {messages.length > 0 ? (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'me' ? 'sent' : 'received'} ${message.pending ? 'pending' : ''} ${message.failed ? 'failed' : ''}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">
                  {message.pending ? 'Sending...' : 
                  message.failed ? 'Failed to send' :
                  message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-messages">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form className="message-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="send-button">
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
      {/* Debugging panel - remove in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="debug-panel">
          <p>Socket: {socketConnected ? '🟢' : '🔴'}</p>
          <p>User ID: {localStorage.getItem('userId')?.slice(0, 10)}...</p>
          <p>Recipient: {recipientId?.slice(0, 10)}...</p>
          <button 
            style={{padding: '4px 8px', background: '#333', border: 'none', color: 'white', cursor: 'pointer'}}
            onClick={() => {
              if (socketRef.current) {
                console.log('🔄 Manually reconnecting socket...');
                socketRef.current.disconnect();
                setTimeout(() => socketRef.current.connect(), 500);
              }
            }}
          >
            Reconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default Messages;