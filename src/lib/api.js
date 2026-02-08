const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

/**
 * Get stored JWT token
 */
export function getToken() {
    return localStorage.getItem('cloudpilot_token');
}

/**
 * Get stored user
 */
export function getUser() {
    const user = localStorage.getItem('cloudpilot_user');
    return user ? JSON.parse(user) : null;
}

/**
 * Store auth data
 */
export function setAuth(token, user) {
    localStorage.setItem('cloudpilot_token', token);
    localStorage.setItem('cloudpilot_user', JSON.stringify(user));
}

/**
 * Clear auth data
 */
export function clearAuth() {
    localStorage.removeItem('cloudpilot_token');
    localStorage.removeItem('cloudpilot_user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return !!getToken();
}

/**
 * Make authenticated API request
 */
export async function apiRequest(endpoint, options = {}) {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        clearAuth();
        // Prevent multiple reloads if multiple requests fail at once
        if (!window.__is_reloading) {
            window.__is_reloading = true;
            window.location.reload();
        }
        throw new Error('Unauthorized');
    }

    return response;
}

/**
 * Login with email
 */
export async function login(email) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setAuth(data.token, data.user);
    return data;
}

/**
 * Logout
 */
export function logout() {
    clearAuth();
    window.location.reload();
}

export default { apiRequest, login, logout, getToken, getUser, isAuthenticated };
