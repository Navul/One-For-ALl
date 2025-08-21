import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ServiceList = () => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        // Sample services with categories and icons - you can replace with API call later
        const sampleServices = [
            { 
                _id: '1', 
                title: 'Professional Cleaning', 
                description: 'Deep house cleaning and maintenance services',
                provider: 'Clean Pro Services',
                category: 'cleaning',
                price: 150,
                icon: '🧹',
                color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            { 
                _id: '2', 
                title: 'Plumbing Services', 
                description: 'Expert plumbing fixes and installations',
                provider: 'Fix It Fast',
                category: 'plumbing',
                price: 200,
                icon: '🔧',
                color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            },
            { 
                _id: '3', 
                title: 'Electrical Work', 
                description: 'Licensed electrical installations and repairs',
                provider: 'Spark Solutions',
                category: 'electrical',
                price: 250,
                icon: '⚡',
                color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            },
            { 
                _id: '4', 
                title: 'Garden Landscaping', 
                description: 'Professional landscaping and garden care',
                provider: 'Green Thumb',
                category: 'gardening',
                price: 300,
                icon: '🌱',
                color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            },
            { 
                _id: '5', 
                title: 'House Painting', 
                description: 'Interior and exterior painting services',
                provider: 'Color Masters',
                category: 'painting',
                price: 400,
                icon: '🎨',
                color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
            },
            { 
                _id: '6', 
                title: 'Moving Services', 
                description: 'Professional moving and packing services',
                provider: 'Swift Movers',
                category: 'moving',
                price: 350,
                icon: '📦',
                color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
            },
            { 
                _id: '7', 
                title: 'Handyman Services', 
                description: 'General repairs and home maintenance',
                provider: 'Fix-It Experts',
                category: 'handyman',
                price: 180,
                icon: '🔨',
                color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
            },
            { 
                _id: '8', 
                title: 'Auto Repair', 
                description: 'Professional automotive repair services',
                provider: 'Auto Care Plus',
                category: 'automotive',
                price: 220,
                icon: '🚗',
                color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            }
        ];

        setServices(sampleServices);

        // Uncomment below to fetch from API instead
        // const fetchServices = async () => {
        //     try {
        //         const response = await fetch('/api/services');
        //         const data = await response.json();
        //         setServices(data);
        //     } catch (error) {
        //         console.error('Error fetching services:', error);
        //     }
        // };
        // fetchServices();
    }, []);

    const servicesArray = Array.isArray(services) ? services : [];
    
    return (
        <div className="services-showcase">
            <div className="services-carousel-container">
                <div className="services-carousel">
                    {/* Duplicate services for seamless infinite scroll */}
                    {[...servicesArray, ...servicesArray].map((service, index) => (
                        <Link 
                            key={`${service._id}-${index}`}
                            to={`/service/${service._id}`}
                            className="service-card"
                            style={{ '--card-bg': service.color, textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="service-icon">
                                {service.icon}
                            </div>
                            <div className="service-content">
                                <h3 className="service-title">{service.title}</h3>
                                <p className="service-description">{service.description}</p>
                                <div className="service-provider">
                                    <span>by {service.provider}</span>
                                </div>
                                <div className="service-price">
                                    <span className="price-label">Starting from</span>
                                    <span className="price-amount">${service.price}</span>
                                </div>
                            </div>
                            <div className="service-overlay">
                                <div className="service-cta">
                                    View Details & Bargain
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .services-showcase {
                    padding: 2rem 0;
                    overflow: hidden;
                    position: relative;
                }

                .services-carousel-container {
                    width: 100%;
                    overflow: hidden;
                    position: relative;
                }

                .services-carousel {
                    display: flex;
                    gap: 2rem;
                    animation: slideLeft 30s linear infinite;
                    width: fit-content;
                }

                .services-carousel:hover {
                    animation-play-state: paused;
                }

                @keyframes slideLeft {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                .service-card {
                    background: var(--card-bg);
                    border-radius: 20px;
                    padding: 2rem;
                    min-width: 320px;
                    height: 280px;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .service-card:hover {
                    transform: translateY(-10px) scale(1.02);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }

                .service-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .service-card:hover::before {
                    opacity: 1;
                }

                .service-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                }

                .service-content {
                    color: white;
                    z-index: 2;
                    position: relative;
                }

                .service-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }

                .service-description {
                    font-size: 0.95rem;
                    line-height: 1.4;
                    margin-bottom: 1rem;
                    opacity: 0.9;
                    text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
                }

                .service-provider {
                    font-size: 0.85rem;
                    opacity: 0.8;
                    font-weight: 500;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                    margin-bottom: 1rem;
                }

                .service-price {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    margin-top: auto;
                }

                .price-label {
                    font-size: 0.75rem;
                    opacity: 0.7;
                    margin-bottom: 0.2rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .price-amount {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #fff;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                }

                .service-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
                    padding: 2rem;
                    transform: translateY(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                }

                .service-card:hover .service-overlay {
                    transform: translateY(0);
                }

                .service-cta {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(20px);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 50px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }

                .service-cta:hover {
                    background: rgba(255, 255, 255, 0.3);
                    border-color: rgba(255, 255, 255, 0.5);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                }

                .service-cta svg {
                    transition: transform 0.3s ease;
                }

                .service-cta:hover svg {
                    transform: translateX(3px);
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .service-card {
                        min-width: 280px;
                        height: 260px;
                        padding: 1.5rem;
                    }

                    .service-icon {
                        font-size: 2.5rem;
                    }

                    .service-title {
                        font-size: 1.3rem;
                    }

                    .service-description {
                        font-size: 0.9rem;
                    }

                    .services-carousel {
                        gap: 1.5rem;
                    }
                }

                @media (max-width: 480px) {
                    .service-card {
                        min-width: 250px;
                        height: 240px;
                        padding: 1.25rem;
                    }

                    .services-carousel {
                        gap: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default ServiceList;