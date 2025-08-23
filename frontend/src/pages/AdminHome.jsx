import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const AdminHome = () => {
    const { user } = useAuth();
    const heroRef = useRef(null);
    const statsRef = useRef(null);
    const ctaRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate');
                    }
                });
            },
            { threshold: 0.1 }
        );

        [heroRef, statsRef, ctaRef].forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-page">
            {/* Enhanced Hero Section for Admins */}
            <section className="hero-section" ref={heroRef}>
                <div className="hero-background">
                    <div className="floating-shapes">
                        <div className="shape shape-1"></div>
                        <div className="shape shape-2"></div>
                        <div className="shape shape-3"></div>
                        <div className="shape shape-4"></div>
                        <div className="shape shape-5"></div>
                    </div>
                </div>
                
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            🔧 Welcome, Administrator
                        </div>
                        
                        <h1 className="hero-title">
                            <span className="text-gradient">System Overview</span>
                            <br />
                            Manage OneForAll
                        </h1>
                        
                        <p className="hero-description">
                            Monitor platform performance, manage users and providers, oversee service categories, and maintain the quality of the OneForAll ecosystem.
                        </p>
                        
                        <div className="hero-stats" ref={statsRef}>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">2.5K+</span>
                                </div>
                                <div className="stat-label">Total Users</div>
                            </div>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">500+</span>
                                </div>
                                <div className="stat-label">Active Providers</div>
                            </div>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">50+</span>
                                </div>
                                <div className="stat-label">Service Categories</div>
                            </div>
                        </div>
                        
                        <div className="hero-actions fade-in-up">
                            <Link to="/admin-dashboard" className="btn btn-primary btn-lg">
                                <span>Admin Dashboard</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                            <Link to="/admin-dashboard#users" className="btn btn-secondary btn-lg">
                                Manage Users
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Admin Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Administrative Control Center</h2>
                        <p className="section-subtitle">
                            Comprehensive tools for platform management and oversight
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-2">
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper provider-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">User Management</h3>
                                <p className="feature-description">
                                    Oversee user accounts, manage permissions, and ensure platform security across all user types.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        User account verification
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Role-based access control
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Security monitoring
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Suspension & ban management
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper client-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">Platform Analytics</h3>
                                <p className="feature-description">
                                    Monitor system performance, track key metrics, and analyze platform usage patterns.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Real-time system monitoring
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Revenue & transaction tracking
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        User engagement metrics
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Performance reports
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Management Tools Section */}
            <section className="services-preview">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Management Tools</h2>
                        <p className="section-subtitle">
                            Essential administrative functions at your fingertips
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-3" style={{maxWidth: '1000px', margin: '0 auto'}}>
                        <Link to="/admin-dashboard" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Dashboard</h3>
                                <p className="feature-description">System overview & metrics</p>
                            </div>
                        </Link>
                        
                        <Link to="/admin-dashboard#users" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Users</h3>
                                <p className="feature-description">Manage user accounts</p>
                            </div>
                        </Link>
                        
                        <Link to="/admin-dashboard#providers" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <path d="m22 11-3-3m0 0-3 3m3-3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Providers</h3>
                                <p className="feature-description">Verify & manage providers</p>
                            </div>
                        </Link>
                        
                        <Link to="/admin-dashboard#services" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                        <path d="m12 1 2.09 6.26L22 9l-6.26 2.09L12 23l-2.09-6.26L2 15l6.26-2.09L12 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Services</h3>
                                <p className="feature-description">Moderate service listings</p>
                            </div>
                        </Link>
                        
                        <Link to="/admin-dashboard#categories" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="15" y="3" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="3" y="15" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <rect x="15" y="15" width="6" height="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Categories</h3>
                                <p className="feature-description">Manage service categories</p>
                            </div>
                        </Link>
                        
                        <Link to="/admin-dashboard#reports" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M18 17l-5-5-4 4-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Analytics</h3>
                                <p className="feature-description">Performance & reports</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* System Health Section */}
            <section className="features-section" style={{paddingTop: '2rem'}}>
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">System Health</h2>
                        <p className="section-subtitle">
                            Monitor platform performance and security status
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-3" style={{maxWidth: '900px', margin: '0 auto'}}>
                        <div className="feature-card card">
                            <div className="feature-icon">
                                <div className="icon-wrapper" style={{backgroundColor: 'rgba(16, 185, 129, 0.1)'}}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polyline points="22,4 12,14.01 9,11.01" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title" style={{color: '#10b981'}}>System Status</h3>
                                <p className="feature-description">All systems operational</p>
                            </div>
                        </div>
                        
                        <div className="feature-card card">
                            <div className="feature-icon">
                                <div className="icon-wrapper" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title" style={{color: '#3b82f6'}}>Security</h3>
                                <p className="feature-description">No security alerts</p>
                            </div>
                        </div>
                        
                        <div className="feature-card card">
                            <div className="feature-icon">
                                <div className="icon-wrapper" style={{backgroundColor: 'rgba(251, 191, 36, 0.1)'}}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="#fbbf24" strokeWidth="2"/>
                                        <polyline points="12,6 12,12 16,14" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title" style={{color: '#fbbf24'}}>Uptime</h3>
                                <p className="feature-description">99.9% this month</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content" ref={ctaRef}>
                        <h2 className="cta-title">Platform Administration Made Simple</h2>
                        <p className="cta-subtitle">
                            Access comprehensive administrative tools to maintain and optimize the OneForAll platform
                        </p>
                        
                        <div className="cta-actions">
                            <Link to="/admin-dashboard" className="btn btn-primary btn-lg">
                                <span>Open Admin Panel</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                            <Link to="/admin-dashboard#reports" className="btn btn-secondary btn-lg">
                                View Reports
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminHome;
