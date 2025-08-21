import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import NegotiationsBadge from './NegotiationsBadge';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const getDashboardLink = () => {
        if (user?.role === 'provider') {
            return '/provider-dashboard';
        } else if (user?.role === 'customer') {
            return '/user-dashboard';
        } else if (user?.role === 'admin') {
            return '/admin-dashboard';
        }
        return '/dashboard';
    };

    return (
        <>
            <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                <div className="navbar-container">
                    <Link to="/" className="navbar-logo" onClick={closeMenu}>
                        <span className="logo-text">OneForAll</span>
                    </Link>

                    <div className="navbar-menu">
                        <div className="navbar-nav">
                            <Link 
                                to="/" 
                                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                            >
                                Home
                            </Link>
                            
                            {/* Only show Services link to customers and non-logged users */}
                            {(!isAuthenticated || user?.role === 'customer' || user?.role === 'user') && (
                                <Link 
                                    to="/browse-services" 
                                    className={`nav-link ${location.pathname === '/browse-services' ? 'active' : ''}`}
                                >
                                    Services
                                </Link>
                            )}

                            {/* Show My Services link for providers */}
                            {isAuthenticated && user?.role === 'provider' && (
                                <Link 
                                    to="/my-services" 
                                    className={`nav-link ${location.pathname === '/my-services' ? 'active' : ''}`}
                                >
                                    My Services
                                </Link>
                            )}

                            {/* Show Negotiations link for all authenticated users */}
                            {isAuthenticated && (
                                <Link 
                                    to="/negotiations" 
                                    className={`nav-link negotiations-link ${location.pathname === '/negotiations' ? 'active' : ''}`}
                                >
                                    Negotiations
                                    <NegotiationsBadge />
                                </Link>
                            )}

                            {/* Show Notifications link for all authenticated users */}
                            {isAuthenticated && (
                                <Link 
                                    to="/notifications" 
                                    className={`nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                                >
                                    Notifications
                                </Link>
                            )}

                            {isAuthenticated && (
                                <Link 
                                    to="/instant-services" 
                                    className={`nav-link instant-service ${location.pathname === '/instant-services' ? 'active' : ''}`}
                                >
                                    <span className="instant-icon">⚡</span>
                                    Instant Services
                                </Link>
                            )}

                            {isAuthenticated && (
                                <Link 
                                    to={getDashboardLink()} 
                                    className={`nav-link ${
                                        location.pathname.includes('dashboard') || 
                                        location.pathname.includes('/admin-dashboard') ||
                                        location.pathname.includes('/provider-dashboard') ||
                                        location.pathname.includes('/user-dashboard') 
                                        ? 'active' : ''
                                    }`}
                                >
                                    Dashboard
                                </Link>
                            )}
                        </div>

                        <div className="navbar-actions">
                            {isAuthenticated ? (
                                <div className="user-menu">
                                    <NotificationBell />
                                    <div className="user-info">
                                        <div className="user-avatar">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="user-name">{user?.name}</span>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="logout-btn"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="auth-buttons">
                                    <Link to="/login" className="btn btn-outline">
                                        Login
                                    </Link>
                                    <Link to="/signup" className="btn btn-primary">
                                        Sign Up
                                    </Link>
                                    <Link to="/contact" className="btn btn-contact">
                                        <span className="contact-icon">📞</span>
                                        Contact
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        className={`mobile-menu-btn ${isMenuOpen ? 'active' : ''}`}
                        onClick={toggleMenu}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>

                <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
                    <div className="mobile-menu-content">
                        <Link 
                            to="/" 
                            className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            Home
                        </Link>
                        
                        {/* Only show Services link to customers and non-logged users */}
                        {(!isAuthenticated || user?.role === 'customer' || user?.role === 'user') && (
                            <Link 
                                to="/browse-services" 
                                className={`mobile-nav-link ${location.pathname === '/browse-services' ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                Services
                            </Link>
                        )}

                        {/* Show My Services link for providers */}
                        {isAuthenticated && user?.role === 'provider' && (
                            <Link 
                                to="/provider-dashboard" 
                                className={`mobile-nav-link ${location.pathname === '/provider-dashboard' ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                My Services
                            </Link>
                        )}

                        {isAuthenticated && (
                            <Link 
                                to="/instant-services" 
                                className={`mobile-nav-link instant-service ${location.pathname === '/instant-services' ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <span className="instant-icon">⚡</span>
                                Instant Services
                            </Link>
                        )}

                        {/* Show Negotiations link for all authenticated users */}
                        {isAuthenticated && (
                            <Link 
                                to="/negotiations" 
                                className={`mobile-nav-link negotiations-link ${location.pathname === '/negotiations' ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                Negotiations
                                <NegotiationsBadge />
                            </Link>
                        )}

                        {/* Show Notifications link for all authenticated users */}
                        {isAuthenticated && (
                            <Link 
                                to="/notifications" 
                                className={`mobile-nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                Notifications
                            </Link>
                        )}

                        {isAuthenticated && (
                            <Link 
                                to={getDashboardLink()} 
                                className={`mobile-nav-link ${
                                    location.pathname.includes('dashboard') || 
                                    location.pathname.includes('/admin-dashboard') ||
                                    location.pathname.includes('/provider-dashboard') ||
                                    location.pathname.includes('/user-dashboard') 
                                    ? 'active' : ''
                                }`}
                                onClick={closeMenu}
                            >
                                Dashboard
                            </Link>
                        )}

                        <div className="mobile-auth">
                            {isAuthenticated ? (
                                <button 
                                    onClick={handleLogout}
                                    className="mobile-logout-btn"
                                >
                                    Logout
                                </button>
                            ) : (
                                <div className="mobile-auth-buttons">
                                    <Link 
                                        to="/login" 
                                        className="mobile-btn mobile-btn-outline"
                                        onClick={closeMenu}
                                    >
                                        Login
                                    </Link>
                                    <Link 
                                        to="/signup" 
                                        className="mobile-btn mobile-btn-primary"
                                        onClick={closeMenu}
                                    >
                                        Sign Up
                                    </Link>
                                    <Link 
                                        to="/contact" 
                                        className="mobile-btn mobile-btn-contact"
                                        onClick={closeMenu}
                                    >
                                        Contact
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <style jsx>{`
                .navbar {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    z-index: 1000 !important;
                    background: #1e3a8a !important;
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 20px rgba(30, 58, 138, 0.3);
                }

                .navbar.scrolled {
                    background: #1e3a8a !important;
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
                    box-shadow: 0 8px 32px rgba(30, 58, 138, 0.4);
                }

                .navbar-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .navbar-logo {
                    text-decoration: none;
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: white !important;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .navbar-menu {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }

                .navbar-nav {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .nav-link {
                    text-decoration: none;
                    color: white !important;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .nav-link:hover {
                    color: #a5d8ff !important;
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-1px);
                }

                .nav-link.active {
                    color: #a5d8ff !important;
                    background: rgba(255, 255, 255, 0.15);
                }

                .navbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .user-menu {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .user-name {
                    font-weight: 500;
                    color: white !important;
                }

                .logout-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .logout-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-1px);
                }

                .auth-buttons {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn {
                    text-decoration: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .btn-outline {
                    background: transparent;
                    color: white;
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .btn-outline:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-1px);
                }

                .btn-primary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .btn-primary:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-1px);
                }

                .btn-contact {
                    background: #a5d8ff;
                    color: #1e3a8a;
                    border-color: #a5d8ff;
                    font-weight: 600;
                }

                .btn-contact:hover {
                    background: #91c7f7;
                    border-color: #91c7f7;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(165, 216, 255, 0.3);
                }

                .contact-icon {
                    font-size: 1rem;
                }

                .mobile-menu-btn {
                    display: none;
                    flex-direction: column;
                    justify-content: space-around;
                    width: 24px;
                    height: 20px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }

                .mobile-menu-btn span {
                    width: 100%;
                    height: 2px;
                    background: white;
                    transition: all 0.3s ease;
                    transform-origin: center;
                }

                .mobile-menu-btn.active span:nth-child(1) {
                    transform: rotate(45deg) translate(5px, 5px);
                }

                .mobile-menu-btn.active span:nth-child(2) {
                    opacity: 0;
                }

                .mobile-menu-btn.active span:nth-child(3) {
                    transform: rotate(-45deg) translate(7px, -6px);
                }

                .mobile-menu {
                    display: none;
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #1e3a8a !important;
                    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%) !important;
                    box-shadow: 0 8px 32px rgba(30, 58, 138, 0.3);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .mobile-menu.active {
                    display: block;
                }

                .mobile-menu-content {
                    padding: 2rem;
                }

                .mobile-nav-link {
                    display: block;
                    text-decoration: none;
                    color: white !important;
                    font-weight: 500;
                    padding: 1rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    transition: color 0.3s ease;
                }

                .mobile-nav-link:hover,
                .mobile-nav-link.active {
                    color: #a5d8ff !important;
                }

                .mobile-auth {
                    padding-top: 1rem;
                    border-top: 2px solid rgba(255, 255, 255, 0.1);
                    margin-top: 1rem;
                }

                .mobile-logout-btn {
                    width: 100%;
                    background: #a5d8ff;
                    color: #1e3a8a;
                    border: none;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }

                .mobile-logout-btn:hover {
                    background: #91c7f7;
                }

                .mobile-auth-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .mobile-btn {
                    display: block;
                    text-align: center;
                    text-decoration: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .mobile-btn-outline {
                    background: transparent;
                    color: white;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                }

                .mobile-btn-outline:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .mobile-btn-primary {
                    background: #a5d8ff;
                    color: #1e3a8a;
                    border: 2px solid #a5d8ff;
                }

                .mobile-btn-primary:hover {
                    background: #91c7f7;
                    border-color: #91c7f7;
                }

                .mobile-btn-contact {
                    background: #a5d8ff;
                    color: #1e3a8a;
                    border: 2px solid #a5d8ff;
                }

                .mobile-btn-contact:hover {
                    background: #91c7f7;
                    border-color: #91c7f7;
                }

                @media (max-width: 768px) {
                    .navbar-menu {
                        display: none;
                    }

                    .mobile-menu-btn {
                        display: flex;
                    }
                }

                /* Instant Service Link Styles */
                .instant-service {
                    position: relative;
                    background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
                    color: white !important;
                    border-radius: 20px;
                    padding: 8px 16px !important;
                    margin: 0 8px;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
                    transition: all 0.3s ease;
                }

                .instant-service:hover {
                    background: linear-gradient(135deg, #ff3742 0%, #e73c3c 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
                }

                .instant-service.active {
                    background: linear-gradient(135deg, #e73c3c 0%, #c0392b 100%);
                    box-shadow: 0 4px 15px rgba(231, 60, 60, 0.5);
                }

                .instant-icon {
                    font-size: 1.1em;
                    margin-right: 6px;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.8;
                        transform: scale(1.1);
                    }
                }

                /* Mobile instant service styles */
                .mobile-nav-link.instant-service {
                    background: linear-gradient(135deg, #ff4757 0%, #ff3742 100%);
                    color: white;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin: 8px 0;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
                }

                .mobile-nav-link.instant-service:hover {
                    background: linear-gradient(135deg, #ff3742 0%, #e73c3c 100%);
                    color: white;
                }

                /* Negotiations link with badge positioning */
                .negotiations-link {
                    position: relative;
                }

                .mobile-nav-link.negotiations-link {
                    position: relative;
                }
            `}</style>
        </>
    );
};

export default Navbar;
