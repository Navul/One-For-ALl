import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import BrowseServices from './pages/BrowseServices';
import InstantServices from './pages/InstantServices';
import ServiceDetails from './pages/ServiceDetails';
import NegotiationsDashboard from './pages/NegotiationsDashboard';
import Notifications from './pages/Notifications';
import NotificationTest from './pages/NotificationTest';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MyServices from './pages/MyServices';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/NavbarNew';

const App = () => {
    return (
        <AuthProvider>
            <Router future={{ 
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}>
                <Navbar />
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/browse-services" element={<BrowseServices />} />
                    <Route path="/service/:serviceId" element={<ServiceDetails />} />
                    <Route 
                        path="/instant-services" 
                        element={
                            <ProtectedRoute allowedRoles={['user', 'provider', 'admin']}>
                                <InstantServices />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Negotiations route */}
                    <Route 
                        path="/negotiations" 
                        element={
                            <ProtectedRoute allowedRoles={['user', 'provider', 'admin']}>
                                <NegotiationsDashboard />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Notifications route */}
                    <Route 
                        path="/notifications" 
                        element={
                            <ProtectedRoute allowedRoles={['user', 'provider', 'admin']}>
                                <Notifications />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* Notification Test route */}
                    <Route 
                        path="/notification-test" 
                        element={
                            <ProtectedRoute allowedRoles={['user', 'provider', 'admin']}>
                                <NotificationTest />
                            </ProtectedRoute>
                        }
                    />
                    
                    {/* My Services route for providers */}
                    <Route 
                        path="/my-services" 
                        element={
                            <ProtectedRoute allowedRoles={['provider']}>
                                <MyServices />
                            </ProtectedRoute>
                        }
                    />
                    
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
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;