import React, { useState, useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) setTimeout(onClose, 300); // Allow animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast ${type} ${visible ? 'visible' : 'hidden'}`}>
      <div className="toast-content">
        {type === 'success' && <i className="fas fa-check-circle"></i>}
        {type === 'error' && <i className="fas fa-exclamation-circle"></i>}
        {type === 'info' && <i className="fas fa-info-circle"></i>}
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={() => {
        setVisible(false);
        if (onClose) setTimeout(onClose, 300);
      }}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Toast;
