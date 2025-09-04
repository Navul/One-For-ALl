import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL;

const Chats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]); // List of bookings with chat
  const [activeChat, setActiveChat] = useState(null); // Booking object
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const socketRef = useRef(null);

  // Fetch all bookings for this user (client or provider)
  useEffect(() => {
    const fetchChats = async () => {
      const token = localStorage.getItem('token');
      const url = user?.role === 'provider'
        ? `${process.env.REACT_APP_API_URL}/api/bookings/provider/my-bookings`
        : `${process.env.REACT_APP_API_URL}/api/bookings/user`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setChats(data.bookings || data || []);
    };
    if (user) fetchChats();
  }, [user]);

  // Setup socket and chat room for active chat
  useEffect(() => {
    if (!activeChat) return;
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
      });
    }
    const socket = socketRef.current;
    socket.emit('chat:join', { bookingId: activeChat._id });
    socket.emit('chat:history', { bookingId: activeChat._id }, (msgs) => {
      setChatMessages(msgs || []);
    });
    socket.on('chat:message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.emit('chat:leave', { bookingId: activeChat._id });
      socket.off('chat:message');
    };
  }, [activeChat]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeChat || !user) return;
    const toUser = user.role === 'provider' ? activeChat.user : activeChat.service?.provider;
    const msg = {
      bookingId: activeChat._id,
      from: { id: user._id, name: user.name, role: user.role },
      to: { id: toUser?._id, name: toUser?.name, role: toUser?.role || (user.role === 'provider' ? 'client' : 'provider') },
      message: chatInput.trim(),
    };
    socketRef.current.emit('chat:message', msg);
    setChatInput('');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', minHeight: '80vh' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: 24 }}>Chats</h2>
      <div style={{ display: 'flex', gap: 32 }}>
        {/* Chat List */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <h4 style={{ marginBottom: 12 }}>Conversations</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {chats.length === 0 && <li style={{ color: '#888' }}>No chats yet.</li>}
            {chats.map((booking) => {
              const other = user.role === 'provider' ? booking.user : booking.service?.provider;
              if (!other) return null;
              return (
                <li key={booking._id} style={{ marginBottom: 10 }}>
                  <button
                    onClick={() => setActiveChat(booking)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: activeChat?._id === booking._id ? '#e0e7ff' : '#f3f4f6',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 14px',
                      fontWeight: activeChat?._id === booking._id ? 'bold' : 'normal',
                      cursor: 'pointer',
                      color: '#222',
                    }}
                  >
                    {other.name || 'User'} <span style={{ color: '#888', fontSize: 13 }}>({booking.service?.title || 'Service'})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Chat Window */}
        <div style={{ flex: 2, minWidth: 320, background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px #0001', padding: 24, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          {activeChat ? (
            <>
              <div style={{ marginBottom: 12, fontWeight: 'bold', fontSize: 18 }}>
                Chat with {user.role === 'provider' ? activeChat.user?.name : activeChat.service?.provider?.name}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 12, minHeight: 220 }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888' }}>No messages yet.</div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: 8, textAlign: msg.from?.id === user._id ? 'right' : 'left' }}>
                      <span style={{
                        display: 'inline-block',
                        background: msg.from?.id === user._id ? '#2563eb' : '#e5e7eb',
                        color: msg.from?.id === user._id ? 'white' : '#1f2937',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 13,
                        maxWidth: 220,
                        wordBreak: 'break-word'
                      }}>
                        {msg.message}
                      </span>
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                        {msg.from?.name || 'User'} • {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                />
                <button
                  style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer' }}
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                >Send</button>
              </div>
            </>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 80 }}>
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chats;
