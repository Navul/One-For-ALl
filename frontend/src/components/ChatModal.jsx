import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import io from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../utils/api';

const ChatModal = () => {
  const { user } = useAuth();
  const { isModalOpen, modalData, closeModal } = useModal();
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef(null);

  const isOpen = isModalOpen('chat');
  const { chatWith, booking } = modalData || {};

  // Setup socket connection for chat
  useEffect(() => {
    if (!isOpen || !booking) return;

    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
      });
    }

    const socket = socketRef.current;

    // Join chat room for this booking
    socket.emit('chat:join', { bookingId: booking._id });

    // Fetch chat history
    socket.emit('chat:history', { bookingId: booking._id }, (msgs) => {
      setChatMessages(msgs || []);
    });

    // Listen for new messages
    socket.on('chat:message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit('chat:leave', { bookingId: booking._id });
      socket.off('chat:message');
    };
  }, [isOpen, booking]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setChatMessages([]);
      setChatInput('');
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !booking || !user || !chatWith) return;

    const msg = {
      bookingId: booking._id,
      from: { id: user._id, name: user.name, role: user.role },
      to: { id: chatWith._id, name: chatWith.name, role: chatWith.role || (user.role === 'provider' ? 'client' : 'provider') },
      message: chatInput.trim(),
    };

    socketRef.current.emit('chat:message', msg);
    setChatInput('');
  };

  const handleClose = () => {
    closeModal();
  };

  if (!isOpen || !chatWith || !booking) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
        maxWidth: '480px',
        width: '100%',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                💬 Chat with {chatWith.name || 'User'}
              </h2>
              <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0.25rem 0 0 0' }}>
                {booking.service?.title || 'Service Chat'}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '2.5rem',
                height: '2.5rem',
                cursor: 'pointer',
                fontSize: '1.25rem',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            >✕</button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          padding: '1rem',
          background: '#f9fafb',
          overflowY: 'auto',
          minHeight: '300px',
          maxHeight: '400px'
        }}>
          {chatMessages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#6b7280',
              padding: '3rem 1rem',
              fontSize: '0.95rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💭</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div key={idx} style={{
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.from?.id === user._id ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  background: msg.from?.id === user._id 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'white',
                  color: msg.from?.id === user._id ? 'white' : '#374151',
                  borderRadius: '18px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  maxWidth: '80%',
                  wordBreak: 'break-word',
                  boxShadow: msg.from?.id === user._id 
                    ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  border: msg.from?.id === user._id ? 'none' : '1px solid #e5e7eb'
                }}>
                  {msg.message}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginTop: '0.25rem',
                  padding: '0 0.5rem'
                }}>
                  {msg.from?.name || 'User'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          background: 'white'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <input
              type="text"
              placeholder="Type your message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '24px',
                border: '2px solid #e5e7eb',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                background: '#f9fafb'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            />
            <button
              style={{
                background: chatInput.trim() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '3rem',
                height: '3rem',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: chatInput.trim() ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
              }}
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              onMouseOver={(e) => {
                if (chatInput.trim()) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'scale(1)';
              }}
            >📤</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
