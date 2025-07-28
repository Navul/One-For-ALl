import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
    children, 
    allowedRoles = [], 
    redirectTo = '/login'
}) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">Loading...</div>
                <style jsx="true">{`
                    .loading-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f5f5f5;
                    }
                    
                    .loading-spinner {
                        padding: 2rem;
                        font-size: 1.2rem;
                        color: #666;
                    }
                `}</style>
            </div>
        );
    }

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    // Check if user has required role (if roles are specified)
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        return (
            <div className="unauthorized-container">
                <div className="unauthorized-message">
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access this page.</p>
                    <button 
                        onClick={() => window.history.back()}
                        className="back-button"
                    >
                        Go Back
                    </button>
                </div>
                <style jsx="true">{`
                    .unauthorized-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: #f5f5f5;
                    }
                    
                    .unauthorized-message {
                        text-align: center;
                        background: white;
                        padding: 2rem;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    
                    .unauthorized-message h2 {
                        color: #e53e3e;
                        margin-bottom: 1rem;
                    }
                    
                    .unauthorized-message p {
                        color: #666;
                        margin-bottom: 1.5rem;
                    }
                    
                    .back-button {
                        padding: 0.75rem 1.5rem;
                        background-color: #4299e1;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
                    
                    .back-button:hover {
                        background-color: #3182ce;
                    }
                `}</style>
            </div>
        );
    }

    // User is authenticated and has permission
    return children;
};

export default ProtectedRoute;
