import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/" element={<Home />} />
                    
                    {/* Protected role-based dashboard routes */}
                    <Route 
                        path="/admin-dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/provider-dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['provider']}>
                                <ProviderDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/user-dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/admin-dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/provider-dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['provider']}>
                                <ProviderDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/user-dashboard" 
                        element={
                            <ProtectedRoute allowedRoles={['user']}>
                                <UserDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;