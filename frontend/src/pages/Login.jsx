import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const Login = () => {
    const { login, loading, error, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (formData) => {
        const result = await login(formData.email, formData.password);
        
        if (result.success) {
            // Redirect based on user role
            const redirectTo = result.redirectTo || '/user-dashboard';
            navigate(redirectTo);
        }
    };

    return (
        <div className="login-page">
            <AuthForm
                isLogin={true}
                onSubmit={handleLogin}
                loading={loading}
                error={error}
                title="Welcome Back"
            />
            
            <div className="auth-links">
                <p>
                    Don't have an account? {' '}
                    <Link to="/signup" className="auth-link">
                        Sign up here
                    </Link>
                </p>
            </div>

            <style jsx>{`
                .login-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

                @media (max-width: 768px) {
                    .auth-links {
                        bottom: 1rem;
                        left: 1rem;
                        right: 1rem;
                        transform: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;
