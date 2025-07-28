import React, { useState } from 'react';
import { validateForm } from '../utils/auth';

const AuthForm = ({ 
    isLogin = true, 
    onSubmit, 
    loading = false, 
    error = null,
    title 
}) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const validation = validateForm(formData, isLogin);
        
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }
        
        setErrors({});
        onSubmit(formData);
    };

    const formFields = [
        ...(!isLogin ? [{
            name: 'name',
            type: 'text',
            placeholder: 'Full Name',
            required: true
        }] : []),
        {
            name: 'email',
            type: 'email',
            placeholder: 'Email Address',
            required: true
        },
        {
            name: 'password',
            type: showPassword ? 'text' : 'password',
            placeholder: 'Password',
            required: true
        },
        ...(!isLogin ? [{
            name: 'confirmPassword',
            type: showPassword ? 'text' : 'password',
            placeholder: 'Confirm Password',
            required: true
        }] : [])
    ];

    return (
        <div className="auth-form-container">
            <div className="auth-form">
                <h2 className="auth-title">{title || (isLogin ? 'Sign In' : 'Sign Up')}</h2>
                
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {formFields.map((field) => (
                        <div key={field.name} className="form-group">
                            <input
                                type={field.type}
                                name={field.name}
                                placeholder={field.placeholder}
                                value={formData[field.name]}
                                onChange={handleChange}
                                className={`form-input ${errors[field.name] ? 'error' : ''}`}
                                required={field.required}
                            />
                            {errors[field.name] && (
                                <span className="field-error">{errors[field.name]}</span>
                            )}
                        </div>
                    ))}

                    {!isLogin && (
                        <div className="form-group">
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="user">User</option>
                                <option value="provider">Service Provider</option>
                            </select>
                        </div>
                    )}

                    {(formData.password || formData.confirmPassword) && (
                        <div className="form-group">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={(e) => setShowPassword(e.target.checked)}
                                />
                                Show Password
                            </label>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>
            </div>

            <style jsx>{`
                .auth-form-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f5f5f5;
                    padding: 20px;
                }

                .auth-form {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                }

                .auth-title {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    color: #333;
                    font-size: 1.5rem;
                }

                .error-message {
                    background-color: #fee;
                    color: #c53030;
                    padding: 0.75rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    border: 1px solid #fed7d7;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-input,
                .form-select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                    box-sizing: border-box;
                }

                .form-input:focus,
                .form-select:focus {
                    outline: none;
                    border-color: #4299e1;
                    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
                }

                .form-input.error {
                    border-color: #e53e3e;
                }

                .field-error {
                    color: #e53e3e;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: block;
                }

                .checkbox-container {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #666;
                    cursor: pointer;
                }

                .checkbox-container input[type="checkbox"] {
                    margin: 0;
                }

                .auth-button {
                    width: 100%;
                    padding: 0.75rem;
                    background-color: #4299e1;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .auth-button:hover:not(:disabled) {
                    background-color: #3182ce;
                }

                .auth-button:disabled {
                    background-color: #a0aec0;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default AuthForm;
