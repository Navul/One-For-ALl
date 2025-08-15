import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ServiceList from '../components/ServiceList';
import '../styles/Home.css';

const Home = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const ctaRef = useRef(null);

    useEffect(() => {
        // Redirect authenticated users to their appropriate dashboard
        if (isAuthenticated && user) {
            switch (user.role) {
                case 'admin':
                    navigate('/admin-dashboard');
                    break;
                case 'provider':
                    navigate('/provider-dashboard');
                    break;
                case 'user':
                default:
                    navigate('/user-dashboard');
                    break;
            }
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        // Enhanced scroll animation observer
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => observer.observe(card));

        // Observe CTA section
        if (ctaRef.current) {
            observer.observe(ctaRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-page">
            {/* Hero Section with Animated Background */}
            <section className="hero-section">
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
                        <div className="hero-badge fade-in-down">
                            <span>🚀 Your Local Service Marketplace</span>
                        </div>
                        
                        <h1 className="hero-title fade-in-up">
                            Welcome to <span className="gradient-text">OneForAll</span>
                        </h1>
                        
                        <p className="hero-subtitle fade-in-up">
                            Connect with trusted service providers in your community. 
                            From home repairs to tutoring - find everything you need in one place.
                        </p>
                        
                        <div className="hero-stats fade-in-up">
                            <div className="stat-item">
                                <div className="stat-number">500+</div>
                                <div className="stat-label">Service Providers</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">10K+</div>
                                <div className="stat-label">Happy Customers</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">50+</div>
                                <div className="stat-label">Service Categories</div>
                            </div>
                        </div>
                        
                        {!isAuthenticated && (
                            <div className="hero-actions fade-in-up">
                                <Link to="/signup" className="btn btn-primary btn-lg">
                                    <span>Get Started Free</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </Link>
                                <Link to="/login" className="btn btn-secondary btn-lg">
                                    Sign In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header text-center">
                        <h2 className="section-title">Why Choose OneForAll?</h2>
                        <p className="section-subtitle">
                            Everything you need to connect with local service providers
                        </p>
                    </div>
                    
                    <div className="features-grid grid grid-2">
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper client-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">For Clients</h3>
                                <p className="feature-description">
                                    Browse and book services from verified local providers with complete confidence.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Easy service discovery
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Secure booking system
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Trusted reviews & ratings
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Real-time booking updates
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="feature-card card slide-in-right">
                            <div className="feature-icon">
                                <div className="icon-wrapper provider-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <path d="m22 11-3-3m0 0-3 3m3-3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="feature-content">
                                <h3 className="feature-title">For Service Providers</h3>
                                <p className="feature-description">
                                    Grow your business by connecting with local customers who need your services.
                                </p>
                                
                                <ul className="feature-list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        List unlimited services
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Manage bookings efficiently
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Build your reputation
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Analytics & insights
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
                        <h2 className="section-title">Available Services</h2>
                        <p className="section-subtitle">
                            Discover amazing services from trusted providers in your area
                        </p>
                    </div>
                    
                    <ServiceList />
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content" ref={ctaRef}>
                        <h2 className="cta-title">Ready to Transform Your Service Experience?</h2>
                        <p className="cta-subtitle">
                            Join thousands of satisfied customers and service providers building the future of local services
                        </p>
                        
                        {!isAuthenticated && (
                            <div className="cta-actions">
                                <Link to="/signup" className="btn btn-primary btn-lg">
                                    <span>Start Your Journey</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </Link>
                                <Link to="/browse-services" className="btn btn-secondary btn-lg">
                                    Explore Services
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;