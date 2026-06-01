import axios from 'axios';

const API_BASE_URL = "https://localhost:7194/api";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use((config) => {
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (e) {
            console.error("Error parsing user data from local storage", e);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export { API_BASE_URL };
export default apiClient;
