import axios from 'axios';

const API_BASE_URL = 'https://localhost:7194/api';

const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
            email: email,
            password: password
        });


        if (response.data.token) {

            localStorage.setItem("user", JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        const message = error.response?.data || "An unexpected error occurred.";
        throw message;
    }
};

const register = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Auth/register`, userData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data || "Registration failed.";
        throw (typeof message === 'object' ? JSON.stringify(message) : message);
    }
};

const verifyEmail = async (email, code) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Auth/verify-email`, { email, code });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.response?.data || "Verification failed.";
        throw (typeof message === 'object' ? JSON.stringify(message) : message);
    }
};

const logout = () => {
    localStorage.removeItem("user");
};

const getCurrentUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
};

const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Auth/forgot-password`, { email });
        return response.data;
    } catch (error) {
        const message = error.response?.data || "Failed to send reset code.";
        throw (typeof message === 'object' ? JSON.stringify(message) : message);
    }
};

const verifyResetCode = async (email, code) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Auth/verify-reset-code`, { email, code });
        return response.data;
    } catch (error) {
        const message = error.response?.data || "Invalid reset code.";
        throw (typeof message === 'object' ? JSON.stringify(message) : message);
    }
};

const resetPassword = async (email, code, newPassword) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/Auth/reset-password`, { email, code, newPassword });
        return response.data;
    } catch (error) {
        const message = error.response?.data || "Failed to reset password.";
        throw (typeof message === 'object' ? JSON.stringify(message) : message);
    }
};

export default {
    login,
    register,
    verifyEmail,
    logout,
    getCurrentUser,
    forgotPassword,
    verifyResetCode,
    resetPassword
};
