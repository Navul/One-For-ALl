import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true,
    error: null
};

// Action types
const ActionTypes = {
    USER_LOADED: 'USER_LOADED',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    REGISTER_SUCCESS: 'REGISTER_SUCCESS',
    AUTH_ERROR: 'AUTH_ERROR',
    LOGOUT: 'LOGOUT',
    CLEAR_ERROR: 'CLEAR_ERROR',
    SET_LOADING: 'SET_LOADING'
};

// Reducer function
const authReducer = (state, action) => {
    switch (action.type) {
        case ActionTypes.USER_LOADED:
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload,
                error: null
            };
        case ActionTypes.LOGIN_SUCCESS:
        case ActionTypes.REGISTER_SUCCESS:
            localStorage.setItem('token', action.payload.token);
            return {
                ...state,
                ...action.payload,
                isAuthenticated: true,
                loading: false,
                error: null
            };
        case ActionTypes.AUTH_ERROR:
        case ActionTypes.LOGOUT:
            localStorage.removeItem('token');
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null,
                error: action.type === ActionTypes.AUTH_ERROR ? action.payload : null
            };
        case ActionTypes.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };
        case ActionTypes.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };
        default:
            return state;
    }
};

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Load user
    const loadUser = async () => {
        const token = localStorage.getItem('token');
        
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    dispatch({
                        type: ActionTypes.USER_LOADED,
                        payload: data.user
                    });
                } else {
                    dispatch({ type: ActionTypes.AUTH_ERROR });
                }
            } catch (error) {
                console.error('Error loading user:', error);
                dispatch({ type: ActionTypes.AUTH_ERROR });
            }
        } else {
            dispatch({ type: ActionTypes.AUTH_ERROR });
        }
    };

    // Register user
    const register = async (formData) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({
                    type: ActionTypes.REGISTER_SUCCESS,
                    payload: data
                });
                return { success: true, data, redirectTo: data.redirectTo };
            } else {
                dispatch({
                    type: ActionTypes.AUTH_ERROR,
                    payload: data.message
                });
                return { success: false, error: data.message };
            }
        } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            dispatch({
                type: ActionTypes.AUTH_ERROR,
                payload: errorMessage
            });
            return { success: false, error: errorMessage };
        }
    };

    // Login user
    const login = async (email, password) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({
                    type: ActionTypes.LOGIN_SUCCESS,
                    payload: data
                });
                return { success: true, data, redirectTo: data.redirectTo };
            } else {
                dispatch({
                    type: ActionTypes.AUTH_ERROR,
                    payload: data.message
                });
                return { success: false, error: data.message };
            }
        } catch (error) {
            const errorMessage = 'Network error. Please try again.';
            dispatch({
                type: ActionTypes.AUTH_ERROR,
                payload: errorMessage
            });
            return { success: false, error: errorMessage };
        }
    };

    // Logout
    const logout = () => {
        dispatch({ type: ActionTypes.LOGOUT });
    };

    // Clear errors
    const clearError = () => {
        dispatch({ type: ActionTypes.CLEAR_ERROR });
    };

    // Load user on mount
    useEffect(() => {
        loadUser();
    }, []);

    const value = {
        ...state,
        register,
        login,
        logout,
        clearError,
        loadUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
