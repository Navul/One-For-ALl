import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import NegotiationsBadge from './NegotiationsBadge';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.hamburger-dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            setIsDropdownOpen(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const closeMenu = () => {
        setIsDropdownOpen(false);
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

    const getHomeLink = () => {
        // If user is authenticated, show role-based homepage
        if (isAuthenticated && user) {
            if (user.role === 'provider') {
                return '/provider-home'; // Provider's role-based home page
            } else if (user.role === 'customer' || user.role === 'user') {
                return '/customer-home'; // Customer's role-based home page
            } else if (user.role === 'admin') {
                return '/admin-home'; // Admin's role-based home page
            }
        }
        // For non-authenticated users, show the landing page
        return '/';
    };

    return (
        <>
            <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                <div className="navbar-container">
                    {/* Logo */}
                    <Link to={getHomeLink()} className="navbar-logo" onClick={closeMenu}>
                        <span className="logo-text">OneForAll</span>
                    </Link>

                    {/* Main Navigation - Only Home and Negotiations */}
                    <div className="navbar-menu">
                        <div className="navbar-nav">
                            <Link 
                                to={getHomeLink()} 
                                className={`nav-link ${
                                    (location.pathname === '/' && !isAuthenticated) ||
                                    (isAuthenticated && location.pathname === getHomeLink()) 
                                    ? 'active' : ''
                                }`}
                                onClick={closeMenu}
                            >
                                Home
                            </Link>
                            
                            {/* Show Negotiations for authenticated users */}
                            {isAuthenticated && (
                                <Link 
                                    to="/negotiations" 
                                    className={`nav-link negotiations-link ${location.pathname === '/negotiations' ? 'active' : ''}`}
                                    onClick={closeMenu}
                                >
                                    Negotiations
                                    <NegotiationsBadge />
                                </Link>
                            )}
                        </div>

                        {/* Right side - Notification Bell + Hamburger Menu */}
                        <div className="navbar-actions">
                            {isAuthenticated && <NotificationBell />}
                            
                            {/* Hamburger Dropdown */}
                            <div className="hamburger-dropdown">
                                <button 
                                    className={`hamburger-btn ${isDropdownOpen ? 'active' : ''}`}
                                    onClick={toggleDropdown}
                                    aria-label="Menu"
                                >
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                    <span className="hamburger-line"></span>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="dropdown-menu">
                                        {isAuthenticated ? (
                                            <>
                                                {/* User Info */}
                                                <div className="dropdown-user-info">
                                                    <div className="user-avatar">
                                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="user-details">
                                                        <span className="user-name">{user?.name}</span>
                                                        <span className="user-role">{user?.role}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="dropdown-divider"></div>

                                                {/* Navigation Links */}
                                                {(!isAuthenticated || user?.role === 'customer' || user?.role === 'user') && (
                                                    <Link 
                                                        to="/browse-services" 
                                                        className={`dropdown-item ${location.pathname === '/browse-services' ? 'active' : ''}`}
                                                        onClick={closeMenu}
                                                    >
                                                        <span className="item-icon">🔍</span>
                                                        Services
                                                    </Link>
                                                )}

                                                {(user?.role === 'customer' || user?.role === 'user') && (
                                                    <Link 
                                                        to="/my-bookings" 
                                                        className={`dropdown-item ${location.pathname === '/my-bookings' ? 'active' : ''}`}
                                                        onClick={closeMenu}
                                                    >
                                                        <span className="item-icon">📅</span>
                                                        My Bookings
                                                    </Link>
                                                )}

                                                {user?.role === 'provider' && (
                                                    <>
                                                        <Link 
                                                            to="/my-services" 
                                                            className={`dropdown-item ${location.pathname === '/my-services' ? 'active' : ''}`}
                                                            onClick={closeMenu}
                                                        >
                                                            <span className="item-icon">⚙️</span>
                                                            My Services
                                                        </Link>
                                                        <Link 
                                                            to="/booked-programs" 
                                                            className={`dropdown-item ${location.pathname === '/booked-programs' ? 'active' : ''}`}
                                                            onClick={closeMenu}
                                                        >
                                                            <span className="item-icon">📋</span>
                                                            Booked Programs
                                                        </Link>
                                                    </>
                                                )}

                                                <Link 
                                                    to="/notifications" 
                                                    className={`dropdown-item ${location.pathname === '/notifications' ? 'active' : ''}`}
                                                    onClick={closeMenu}
                                                >
                                                    <span className="item-icon">🔔</span>
                                                    Notifications
                                                </Link>

                                                <Link 
                                                    to="/instant-services" 
                                                    className={`dropdown-item ${location.pathname === '/instant-services' ? 'active' : ''}`}
                                                    onClick={closeMenu}
                                                >
                                                    <span className="item-icon">⚡</span>
                                                    Instant Services
                                                </Link>

                                                <Link 
                                                    to={getDashboardLink()} 
                                                    className={`dropdown-item ${
                                                        location.pathname.includes('dashboard') ? 'active' : ''
                                                    }`}
                                                    onClick={closeMenu}
                                                >
                                                    <span className="item-icon">📊</span>
                                                    Dashboard
                                                </Link>

                                                <div className="dropdown-divider"></div>
                                                
                                                <button 
                                                    onClick={handleLogout}
                                                    className="dropdown-item logout-item"
                                                >
                                                    <span className="item-icon">🚪</span>
                                                    Logout
                                                </button>
                                            </>
                                        ) : (
                                            /* Not authenticated - show auth options and services */
                                            <>
                                                <Link 
                                                    to="/browse-services" 
                                                    className={`dropdown-item ${location.pathname === '/browse-services' ? 'active' : ''}`}
                                                    onClick={closeMenu}
                                                >
                                                    <span className="item-icon">🔍</span>
                                                    Services
                                                </Link>
                                                
                                                <div className="dropdown-divider"></div>
                                                
                                                <Link 
                                                    to="/login" 
                                                    className="dropdown-item"
                                                    onClick={closeMenu}
                                                >
                                                    <span className="item-icon">🔑</span>
                                                    Login
                                                </Link>
                                                <Link 
                                                    to="/signup" 
                                                    className="dropdown-item"
                                                    onClick={closeMenu}
                                                >
                                                    <span className="item-icon">✨</span>
                                                    Sign Up
                                                </Link>
                                                <Link 
                                                    to="/contact" 
                                                    className="dropdown-item"
                                                    onClick={closeMenu}
                                                >
                                                    <span className="item-icon">📞</span>
                                                    Contact
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            
            {/* Styles */}
            <style jsx>{`
                .navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                    padding: 0;
                }

                .navbar.scrolled {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
                    backdrop-filter: blur(20px);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
                }

                .navbar-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    height: 70px;
                }

                .navbar-logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: white;
                    text-decoration: none;
                    z-index: 1001;
                }

                .navbar-menu {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    margin-left: 2rem;
                }

                .navbar-nav {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }

                .nav-link {
                    color: white;
                    text-decoration: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    font-weight: 500;
                    position: relative;
                }

                .nav-link:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-1px);
                }

                .nav-link.active {
                    background: rgba(255, 255, 255, 0.2);
                    font-weight: 600;
                }

                .negotiations-link {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .navbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                /* Hamburger Dropdown Styles */
                .hamburger-dropdown {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .hamburger-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    width: 30px;
                    height: 30px;
                    justify-content: center;
                    align-items: center;
                }

                .hamburger-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .hamburger-line {
                    width: 20px;
                    height: 2px;
                    background: white;
                    border-radius: 2px;
                    transition: all 0.3s ease;
                    transform-origin: center;
                }

                .hamburger-btn.active .hamburger-line:nth-child(1) {
                    transform: rotate(45deg) translate(4px, 4px);
                }

                .hamburger-btn.active .hamburger-line:nth-child(2) {
                    opacity: 0;
                }

                .hamburger-btn.active .hamburger-line:nth-child(3) {
                    transform: rotate(-45deg) translate(4px, -4px);
                }

                .dropdown-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    min-width: 280px;
                    padding: 1rem 0;
                    z-index: 1000;
                    margin-top: 0.5rem;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    animation: dropdownSlideIn 0.2s ease-out;
                }

                @keyframes dropdownSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dropdown-user-info {
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 600;
                    font-size: 1rem;
                }

                .user-details {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 600;
                    color: #1f2937 !important;
                    margin: 0;
                }

                .user-role {
                    font-size: 0.875rem;
                    color: #6b7280;
                    text-transform: capitalize;
                }

                .dropdown-divider {
                    height: 1px;
                    background: #f3f4f6;
                    margin: 0.5rem 0;
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.5rem;
                    color: #374151;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 0.925rem;
                }

                .dropdown-item:hover {
                    background: #f9fafb;
                    color: #4f46e5;
                }

                .dropdown-item.active {
                    background: #eef2ff;
                    color: #4f46e5;
                    font-weight: 500;
                }

                .dropdown-item.logout-item {
                    color: #dc2626;
                    border-top: 1px solid #f3f4f6;
                    margin-top: 0.5rem;
                    padding-top: 1rem;
                }

                .dropdown-item.logout-item:hover {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .item-icon {
                    font-size: 1rem;
                    width: 20px;
                    text-align: center;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .navbar-container {
                        padding: 0 1rem;
                    }

                    .navbar-nav {
                        gap: 1rem;
                    }

                    .nav-link {
                        padding: 0.4rem 0.8rem;
                        font-size: 0.9rem;
                    }

                    .dropdown-menu {
                        min-width: 260px;
                        right: -1rem;
                    }
                }
            `}</style>
        </>
    );
};

export default Navbar;
