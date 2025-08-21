import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BargainSystem from '../components/BargainSystem';

const ServiceDetails = () => {
    const { serviceId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Sample services with prices (you can fetch from API later)
    const sampleServices = [
        { 
            _id: '1', 
            title: 'Professional Cleaning', 
            description: 'Deep house cleaning and maintenance services including floor cleaning, window washing, bathroom sanitization, and kitchen deep clean. Our professional team uses eco-friendly products.',
            provider: { _id: 'p1', name: 'Clean Pro Services', email: 'contact@cleanpro.com' },
            category: 'cleaning',
            price: 150,
            availability: true,
            icon: '🧹',
            color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        { 
            _id: '2', 
            title: 'Plumbing Services', 
            description: 'Expert plumbing fixes and installations including pipe repair, faucet installation, drain cleaning, and emergency plumbing services. Licensed and insured professionals.',
            provider: { _id: 'p2', name: 'Fix It Fast', email: 'info@fixitfast.com' },
            category: 'plumbing',
            price: 200,
            availability: true,
            icon: '🔧',
            color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        },
        { 
            _id: '3', 
            title: 'Electrical Work', 
            description: 'Licensed electrical installations and repairs including wiring, outlet installation, lighting fixtures, and electrical panel upgrades. Safety guaranteed.',
            provider: { _id: 'p3', name: 'Spark Solutions', email: 'hello@sparksolutions.com' },
            category: 'electrical',
            price: 250,
            availability: true,
            icon: '⚡',
            color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        },
        { 
            _id: '4', 
            title: 'Garden Landscaping', 
            description: 'Professional landscaping and garden care including lawn mowing, plant installation, garden design, and seasonal maintenance. Transform your outdoor space.',
            provider: { _id: 'p4', name: 'Green Thumb', email: 'contact@greenthumb.com' },
            category: 'gardening',
            price: 300,
            availability: true,
            icon: '🌱',
            color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        },
        { 
            _id: '5', 
            title: 'House Painting', 
            description: 'Interior and exterior painting services including wall preparation, premium paint application, and cleanup. Professional painters with quality guarantee.',
            provider: { _id: 'p5', name: 'Color Masters', email: 'info@colormasters.com' },
            category: 'painting',
            price: 400,
            availability: true,
            icon: '🎨',
            color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        },
        { 
            _id: '6', 
            title: 'Moving Services', 
            description: 'Professional moving and packing services including furniture moving, packing supplies, loading/unloading, and local transportation. Careful handling guaranteed.',
            provider: { _id: 'p6', name: 'Swift Movers', email: 'booking@swiftmovers.com' },
            category: 'moving',
            price: 350,
            availability: true,
            icon: '📦',
            color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
        },
        { 
            _id: '7', 
            title: 'Handyman Services', 
            description: 'General repairs and home maintenance including furniture assembly, wall mounting, minor repairs, and household fixes. Reliable and skilled professionals.',
            provider: { _id: 'p7', name: 'Fix-It Experts', email: 'support@fixitexperts.com' },
            category: 'handyman',
            price: 180,
            availability: true,
            icon: '🔨',
            color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
        },
        { 
            _id: '8', 
            title: 'Auto Repair', 
            description: 'Professional automotive repair services including engine diagnostics, brake repair, oil changes, and general maintenance. Certified mechanics only.',
            provider: { _id: 'p8', name: 'Auto Care Plus', email: 'service@autocareplus.com' },
            category: 'automotive',
            price: 220,
            availability: true,
            icon: '🚗',
            color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        }
    ];

    const service = sampleServices.find(s => s._id === serviceId);

    const handleNegotiationUpdate = (negotiation) => {
        console.log('Negotiation started:', negotiation);
        // You can add success notification here
        navigate('/negotiations');
    };

    const handleBookService = () => {
        if (!user) {
            alert('Please log in to book this service');
            return;
        }
        
        // Redirect to booking page or show booking form
        alert(`Booking ${service.title} at the base price of $${service.price}`);
    };

    if (!service) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    Service not found
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <button 
                className="btn btn-outline-secondary mb-4"
                onClick={() => navigate(-1)}
            >
                <i className="fas fa-arrow-left me-2"></i>
                Back
            </button>

            <div className="row">
                <div className="col-lg-8">
                    <div className="card mb-4">
                        <div 
                            className="card-header text-white position-relative"
                            style={{ background: service.color, minHeight: '150px' }}
                        >
                            <div className="row align-items-center h-100">
                                <div className="col-auto">
                                    <div 
                                        className="service-icon d-flex align-items-center justify-content-center"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            fontSize: '2.5rem',
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            borderRadius: '50%'
                                        }}
                                    >
                                        {service.icon}
                                    </div>
                                </div>
                                <div className="col">
                                    <h1 className="h3 mb-2">{service.title}</h1>
                                    <p className="mb-1 opacity-75">
                                        <i className="fas fa-user me-2"></i>
                                        {service.provider.name}
                                    </p>
                                    <p className="mb-0">
                                        <span className="badge bg-light text-dark">
                                            {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-body">
                            <h5>Description</h5>
                            <p className="text-muted mb-4">{service.description}</p>

                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="fas fa-check-circle text-success me-2"></i>
                                        <span>Licensed & Insured</span>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="fas fa-star text-warning me-2"></i>
                                        <span>Highly Rated</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="fas fa-clock text-info me-2"></i>
                                        <span>Quick Response</span>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="fas fa-shield-alt text-primary me-2"></i>
                                        <span>Quality Guaranteed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="sticky-top" style={{ top: '20px' }}>
                        {/* Price and Book Section */}
                        <div className="card mb-4">
                            <div className="card-body text-center">
                                <h4 className="text-primary mb-3">
                                    ${service.price}
                                    <small className="text-muted"> /service</small>
                                </h4>
                                
                                <button 
                                    className="btn btn-primary btn-lg w-100 mb-3"
                                    onClick={handleBookService}
                                    disabled={loading}
                                >
                                    <i className="fas fa-calendar-check me-2"></i>
                                    Book at Base Price
                                </button>

                                <div className="text-muted mb-3">
                                    <small>
                                        <i className="fas fa-info-circle me-1"></i>
                                        Or negotiate for a better price below
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Bargaining System */}
                        <BargainSystem 
                            service={service}
                            currentUser={user}
                            onNegotiationUpdate={handleNegotiationUpdate}
                        />

                        {/* Provider Info */}
                        <div className="card mt-4">
                            <div className="card-header">
                                <h6 className="mb-0">
                                    <i className="fas fa-user-circle me-2"></i>
                                    Provider Information
                                </h6>
                            </div>
                            <div className="card-body">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="flex-grow-1">
                                        <h6 className="mb-1">{service.provider.name}</h6>
                                        <small className="text-muted">{service.provider.email}</small>
                                    </div>
                                </div>
                                
                                <div className="row text-center">
                                    <div className="col-4">
                                        <div className="text-warning">
                                            <i className="fas fa-star"></i>
                                            <i className="fas fa-star"></i>
                                            <i className="fas fa-star"></i>
                                            <i className="fas fa-star"></i>
                                            <i className="fas fa-star-half-alt"></i>
                                        </div>
                                        <small className="text-muted d-block">Rating</small>
                                    </div>
                                    <div className="col-4">
                                        <div className="fw-bold">150+</div>
                                        <small className="text-muted">Jobs Done</small>
                                    </div>
                                    <div className="col-4">
                                        <div className="fw-bold">2 years</div>
                                        <small className="text-muted">Experience</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetails;
