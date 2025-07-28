import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const Signup = () => {
    const { register, loading, error, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSignup = async (formData) => {
        const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
        });
        
        if (result.success) {
            // Redirect based on user role
            const redirectTo = result.redirectTo || '/user-dashboard';
            navigate(redirectTo);
        }
    };

    return (
        <div className="signup-page">
            <AuthForm
                isLogin={false}
                onSubmit={handleSignup}
                loading={loading}
                error={error}
                title="Create Account"
            />
            
            <div className="auth-links">
                <p>
                    Already have an account? {' '}
                    <Link to="/login" className="auth-link">
                        Sign in here
                    </Link>
                </p>
            </div>

            <div className="role-info">
                <div className="role-info-content">
                    <h3>Account Types</h3>
                    <div className="role-descriptions">
                        <div className="role-item">
                            <strong>User:</strong> Browse and book services from local providers.
                        </div>
                        <div className="role-item">
                            <strong>Service Provider:</strong> List your services and manage bookings.
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .signup-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    position: relative;
                }

                .auth-links {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    text-align: center;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 1rem;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }

                .auth-links p {
                    margin: 0;
                    color: #333;
                }

                .auth-link {
                    color: #4299e1;
                    text-decoration: none;
                    font-weight: 500;
                    transition: color 0.3s;
                }

                .auth-link:hover {
                    color: #3182ce;
                    text-decoration: underline;
                }

                .role-info {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    max-width: 300px;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 1.5rem;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .role-info-content h3 {
                    margin: 0 0 1rem 0;
                    color: #333;
                    font-size: 1.1rem;
                }

                .role-descriptions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .role-item {
                    padding: 0.5rem;
                    background: #f7fafc;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    line-height: 1.4;
                }

                .role-item strong {
                    color: #4299e1;
                }

                @media (max-width: 1024px) {
                    .role-info {
                        position: static;
                        max-width: 400px;
                        margin: 2rem auto;
                    }
                }

                @media (max-width: 768px) {
                    .auth-links {
                        bottom: 1rem;
                        left: 1rem;
                        right: 1rem;
                        transform: none;
                    }

                    .role-info {
                        margin: 1rem;
                        max-width: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default Signup;
