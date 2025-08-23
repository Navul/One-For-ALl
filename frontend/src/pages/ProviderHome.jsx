import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const ProviderHome = () => {
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
            {/* Enhanced Hero Section for Providers */}
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
                            ✨ Welcome back, {user?.firstName || 'Provider'}!
                        </div>
                        
                        <h1 className="hero-title">
                            <span className="text-gradient">Grow Your Business</span>
                            <br />
                            Connect with More Customers
                        </h1>
                        
                        <p className="hero-description">
                            Manage your services, track your bookings, and grow your customer base with OneForAll's comprehensive provider dashboard.
                        </p>
                        
                        <div className="hero-stats" ref={statsRef}>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">2.5K+</span>
                                </div>
                                <div className="stat-label">Active Providers</div>
                            </div>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">15K+</span>
                                </div>
                                <div className="stat-label">Monthly Bookings</div>
                            </div>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">95%</span>
                                </div>
                                <div className="stat-label">Customer Satisfaction</div>
                            </div>
                        </div>
                        
                        <div className="hero-actions fade-in-up">
                            <Link to="/provider-dashboard" className="btn btn-primary btn-lg">
                                <span>View Dashboard</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                            <Link to="/provider-dashboard#services" className="btn btn-secondary btn-lg">
                                Manage Services
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Provider Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Maximize Your Business Potential</h2>
                        <p className="section-subtitle">
                            Everything you need to succeed as a service provider
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-2">
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper provider-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">Service Management</h3>
                                <p className="feature-description">
                                    Create and manage your service offerings with detailed descriptions, pricing, and availability.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Unlimited service listings
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Photo galleries & portfolios
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Flexible pricing options
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Category optimization
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper client-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">Booking Management</h3>
                                <p className="feature-description">
                                    Streamline your booking process with automated scheduling and customer communication tools.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Real-time booking alerts
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Customer communication tools
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Revenue tracking
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Performance analytics
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions Section */}
            <section className="services-preview">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Quick Actions</h2>
                        <p className="section-subtitle">
                            Manage your business efficiently with one-click actions
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-3" style={{maxWidth: '900px', margin: '0 auto'}}>
                        <Link to="/provider-dashboard" className="feature-card card hover-lift">
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
                                <p className="feature-description">View your business overview</p>
                            </div>
                        </Link>
                        
                        <Link to="/booked-programs" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">My Bookings</h3>
                                <p className="feature-description">Manage client appointments</p>
                            </div>
                        </Link>
                        
                        <Link to="/provider-dashboard#services" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                        <path d="m12 1 2.09 6.26L22 9l-6.26 2.09L12 23l-2.09-6.26L2 15l6.26-2.09L12 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">My Services</h3>
                                <p className="feature-description">Update service offerings</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content" ref={ctaRef}>
                        <h2 className="cta-title">Ready to Grow Your Business?</h2>
                        <p className="cta-subtitle">
                            Take advantage of our powerful tools to connect with more customers and increase your revenue
                        </p>
                        
                        <div className="cta-actions">
                            <Link to="/provider-dashboard" className="btn btn-primary btn-lg">
                                <span>Go to Dashboard</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                            <Link to="/booked-programs" className="btn btn-secondary btn-lg">
                                View Bookings
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProviderHome;
