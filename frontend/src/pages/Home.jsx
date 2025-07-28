import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ServiceList from '../components/ServiceList';

const Home = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div className="home-page">
            <header className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to LocalConnect</h1>
                    <p>Your one-stop directory for local services.</p>
                    <p>Connect with trusted service providers in your community.</p>
                    
                    {!isAuthenticated && (
                        <div className="hero-actions">
                            <Link to="/signup" className="cta-button primary">
                                Get Started
                            </Link>
                            <Link to="/login" className="cta-button secondary">
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <main className="main-content">
                <section className="features-section">
                    <h2>Why Choose LocalConnect?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <h3>For Clients</h3>
                            <p>Browse and book services from verified local providers with ease.</p>
                            <ul>
                                <li>Easy service discovery</li>
                                <li>Secure booking system</li>
                                <li>Trusted reviews</li>
                            </ul>
                        </div>
                        <div className="feature-card">
                            <h3>For Service Providers</h3>
                            <p>Grow your business by connecting with local customers.</p>
                            <ul>
                                <li>List your services</li>
                                <li>Manage bookings</li>
                                <li>Build your reputation</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="services-preview">
                    <h2>Available Services</h2>
                    <ServiceList />
                </section>
            </main>

            <style jsx>{`
                .home-page {
                    min-height: 100vh;
                }

                .hero-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 4rem 2rem;
                    text-align: center;
                }

                .hero-content h1 {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .hero-content p {
                    font-size: 1.2rem;
                    margin-bottom: 1rem;
                    opacity: 0.9;
                }

                .hero-actions {
                    margin-top: 2rem;
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }

                .cta-button {
                    padding: 1rem 2rem;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s;
                }

                .cta-button.primary {
                    background: #48bb78;
                    color: white;
                }

                .cta-button.primary:hover {
                    background: #38a169;
                    transform: translateY(-2px);
                }

                .cta-button.secondary {
                    background: transparent;
                    color: white;
                    border: 2px solid white;
                }

                .cta-button.secondary:hover {
                    background: white;
                    color: #667eea;
                }

                .main-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 3rem 2rem;
                }

                .features-section {
                    margin-bottom: 4rem;
                }

                .features-section h2 {
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 2rem;
                    color: #2d3748;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }

                .feature-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .feature-card h3 {
                    color: #4299e1;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                }

                .feature-card p {
                    color: #666;
                    margin-bottom: 1rem;
                    line-height: 1.6;
                }

                .feature-card ul {
                    list-style: none;
                    padding: 0;
                }

                .feature-card li {
                    color: #4a5568;
                    margin-bottom: 0.5rem;
                    position: relative;
                    padding-left: 1.5rem;
                }

                .feature-card li:before {
                    content: "✓";
                    position: absolute;
                    left: 0;
                    color: #48bb78;
                    font-weight: bold;
                }

                .services-preview {
                    margin-top: 3rem;
                }

                .services-preview h2 {
                    text-align: center;
                    margin-bottom: 2rem;
                    font-size: 2rem;
                    color: #2d3748;
                }

                @media (max-width: 768px) {
                    .hero-content h1 {
                        font-size: 2rem;
                    }

                    .hero-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .cta-button {
                        width: 200px;
                    }

                    .main-content {
                        padding: 2rem 1rem;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default Home;