import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import ChatModal from './components/ChatModal';
import Home from './pages/Home';
import ProviderHome from './pages/ProviderHome';
import CustomerHome from './pages/CustomerHome';
import AdminHome from './pages/AdminHome';
import BrowseServices from './pages/BrowseServices';
import InstantServices from './pages/InstantServices';
import InstantServicesClient from './pages/InstantServicesClient';
import InstantServicesProvider from './pages/InstantServicesProvider';
import ServiceDetails from './pages/ServiceDetails';
import NegotiationsDashboard from './pages/NegotiationsDashboard';
import Notifications from './pages/Notifications';
import MyBookings from './pages/MyBookings';
import BookedPrograms from './pages/BookedPrograms';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BannedUsers from './pages/BannedUsers';
import ManageServices from './pages/ManageServices';
import MyServices from './pages/MyServices';
import Chats from './pages/Chats';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/NavbarNew';

const App = () => {
    return (
        <AuthProvider>
            <ModalProvider>
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
                    
                    {/* Role-based home pages */}
                    <Route 
                        path="/provider-home" 
                        element={
                            <ProtectedRoute allowedRoles={['provider']}>
                                <ProviderHome />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/customer-home" 
                        element={
                            <ProtectedRoute allowedRoles={['user', 'customer']}>
                                <CustomerHome />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/admin-home" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminHome />
                            </ProtectedRoute>
                        }
                    />
                    

                    {/* Real-time Instant Services: role-specific routes */}
                    <Route 
                        path="/instant-services-client" 
                        element={
                            <ProtectedRoute allowedRoles={['user', 'customer', 'admin']}>
                                <InstantServicesClient />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/instant-services-provider" 
                        element={
                            <ProtectedRoute allowedRoles={['provider', 'admin']}>
                                <InstantServicesProvider />
                            </ProtectedRoute>
                        }
                    />
                    {/* Optionally keep the shared route for backwards compatibility */}
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
                    
                    {/* My Bookings route */}
                    <Route 
                        path="/my-bookings" 
                        element={
                            <ProtectedRoute allowedRoles={['user', 'provider', 'admin']}>
                                <MyBookings />
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
                    
                    {/* Booked Programs route for providers */}
                    <Route 
                        path="/booked-programs" 
                        element={
                            <ProtectedRoute allowedRoles={['provider']}>
                                <BookedPrograms />
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
                        path="/admin/banned-users" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <BannedUsers />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/admin/manage-services" 
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <ManageServices />
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
                    <ChatModal />
                </Router>
            </ModalProvider>
        </AuthProvider>
    );
};export default App;