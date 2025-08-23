import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ServiceList from '../components/ServiceList';
import '../styles/Home.css';

const CustomerHome = () => {
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
            {/* Enhanced Hero Section for Customers */}
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
                            🎉 Welcome back, {user?.firstName || 'Customer'}!
                        </div>
                        
                        <h1 className="hero-title">
                            <span className="text-gradient">Find Perfect Services</span>
                            <br />
                            Book with Confidence
                        </h1>
                        
                        <p className="hero-description">
                            Discover trusted local service providers, read genuine reviews, and book services that meet your exact needs with OneForAll's secure platform.
                        </p>
                        
                        <div className="hero-stats" ref={statsRef}>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">500+</span>
                                </div>
                                <div className="stat-label">Verified Providers</div>
                            </div>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">10K+</span>
                                </div>
                                <div className="stat-label">Happy Customers</div>
                            </div>
                            <div className="stat-item fade-in-up">
                                <div className="stat-number">
                                    <span className="text-gradient">50+</span>
                                </div>
                                <div className="stat-label">Service Categories</div>
                            </div>
                        </div>
                        
                        <div className="hero-actions fade-in-up">
                            <Link to="/browse-services" className="btn btn-primary btn-lg">
                                <span>Browse Services</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                            <Link to="/user-dashboard" className="btn btn-secondary btn-lg">
                                My Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Customer Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Why Customers Choose OneForAll</h2>
                        <p className="section-subtitle">
                            Experience the best in local service discovery and booking
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-2">
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper client-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73L12 2 4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73L12 22l8-4.27A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <polyline points="7.5,8 12,5 16.5,8 12,11 7.5,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">Verified Providers</h3>
                                <p className="feature-description">
                                    All service providers are thoroughly vetted and verified to ensure quality and reliability.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Background-checked providers
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Licensed professionals
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Insurance coverage
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Quality guarantees
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper provider-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">Reviews & Ratings</h3>
                                <p className="feature-description">
                                    Make informed decisions with authentic reviews and ratings from real customers.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Verified customer reviews
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Photo testimonials
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Detailed service ratings
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Response tracking
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Preview Section */}
            <section className="services-preview">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Popular Services</h2>
                        <p className="section-subtitle">
                            Discover amazing services from trusted providers in your area
                        </p>
                    </div>
                    
                    <ServiceList />
                </div>
            </section>

            {/* Quick Actions Section */}
            <section className="features-section" style={{paddingTop: '2rem'}}>
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Quick Actions</h2>
                        <p className="section-subtitle">
                            Everything you need at your fingertips
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-3" style={{maxWidth: '900px', margin: '0 auto'}}>
                        <Link to="/browse-services" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                                        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Search Services</h3>
                                <p className="feature-description">Find the perfect service</p>
                            </div>
                        </Link>
                        
                        <Link to="/user-dashboard" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">My Dashboard</h3>
                                <p className="feature-description">View your bookings</p>
                            </div>
                        </Link>
                        
                        <Link to="/browse-services?sort=rating" className="feature-card card hover-lift">
                            <div className="feature-icon">
                                <div className="icon-wrapper">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            <div className="feature-content text-center">
                                <h3 className="feature-title">Top Rated</h3>
                                <p className="feature-description">Best reviewed services</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content" ref={ctaRef}>
                        <h2 className="cta-title">Ready to Book Your Next Service?</h2>
                        <p className="cta-subtitle">
                            Join thousands of satisfied customers who trust OneForAll for their service needs
                        </p>
                        
                        <div className="cta-actions">
                            <Link to="/browse-services" className="btn btn-primary btn-lg">
                                <span>Explore Services</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                            <Link to="/user-dashboard" className="btn btn-secondary btn-lg">
                                My Bookings
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CustomerHome;
