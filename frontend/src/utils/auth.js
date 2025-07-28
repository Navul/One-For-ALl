// Authentication utility functions

export const getToken = () => {
    return localStorage.getItem('token');
};

export const setToken = (token) => {
    localStorage.setItem('token', token);
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;
    
    try {
        // Check if token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        return payload.exp > currentTime;
    } catch (error) {
        return false;
    }
};

export const getUserFromToken = () => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (error) {
        return null;
    }
};

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password) => {
    // At least 6 characters
    return password && password.length >= 6;
};

export const validateForm = (formData, isLogin = false) => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
        errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email';
    }
    
    // Password validation
    if (!formData.password) {
        errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
        errors.password = 'Password must be at least 6 characters';
    }
    
    // Additional validations for registration
    if (!isLogin) {
        if (!formData.name) {
            errors.name = 'Name is required';
        } else if (formData.name.length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }
        
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const formatUserRole = (role) => {
    if (!role) return 'User';
    
    const roleMap = {
        user: 'User',
        provider: 'Service Provider',
        admin: 'Administrator'
    };
    
    return roleMap[role] || role;
};

export const getAuthHeaders = () => {
    const token = getToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};
