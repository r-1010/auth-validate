import axios from 'axios';

// ----------------------------------------
// Create a configured axios instance
// ----------------------------------------
// All requests made through this instance
// automatically go to your backend base URL.
// withCredentials: true is required so the
// browser sends the httpOnly cookie (refresh token)
// with every request automatically.

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

// axios.create({ baseURL, withCredentials }) — creates a custom axios instance. baseURL means you only write /auth/login in your components instead of the full http://localhost:5000/api/auth/login every time. withCredentials: true is the critical setting that tells the browser to include cookies in cross-origin requests — without this the refresh token cookie would never be sent to the backend.




// ----------------------------------------
// REQUEST interceptor
// ----------------------------------------
// Runs automatically before every request
// is sent. Attaches the access token from
// localStorage to the Authorization header.

api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Request interceptor — runs before every outgoing request. It reads the access token from localStorage and staples it onto the Authorization header automatically. This means no component ever needs to manually attach the token — it just happens.




// ----------------------------------------
// RESPONSE interceptor
// ----------------------------------------
// Runs automatically after every response
// comes back. Watches for 401 errors which
// mean the access token has expired.
// When that happens it silently requests a
// new access token using the refresh token
// cookie, then retries the original request
// once with the new token.

api.interceptors.response.use(
    // If the response is successful just return it as normal
    (response) => response,

    async (error) => {
        // Grab the original request that failed
        const originalRequest = error.config;

        // Check if it was a 401 (unauthorized) AND
        // we haven't already retried this request.
        // _retry flag prevents an infinite loop —
        // if the retry also fails with 401, we stop.
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            // Mark this request so we don't retry it again
            originalRequest._retry = true;

            try {
                // Ask the backend for a new access token.
                // The refresh token cookie is sent automatically
                // by the browser because withCredentials: true.
                const response = await axios.post(
                    'http://localhost:5000/api/auth/refresh',
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = response.data.accessToken;

                // Save the new access token
                localStorage.setItem('accessToken', newAccessToken);

                // Update the failed request's header with the new token
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Retry the original request with the new token
                return api(originalRequest);

            } catch (refreshError) {
                // Refresh token was also invalid or expired —
                // the session is completely dead.
                // Clear everything and send the user to login.
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // For any other error (400, 403, 404, 500 etc.)
        // just reject normally so the calling code can handle it.
        return Promise.reject(error);
    }
);

// Response interceptor — runs after every response comes back. Most of the time it does nothing and just passes the response through. But when it sees a 401 status, it kicks into action and attempts a silent token refresh.

// originalRequest._retry = true — this flag is the protection against an infinite loop. Imagine the refresh request itself returns a 401 — without this flag, the interceptor would try to refresh again, get another 401, try again, forever. The flag ensures each request is only ever retried once.

// axios.post('http://localhost:5000/api/auth/refresh') — notice we use the plain axios here, not our custom api instance. This is intentional — if we used api, a failed refresh would trigger the interceptor again, causing that infinite loop. Using plain axios bypasses the interceptor entirely.

// window.location.href = '/login' — if the refresh also fails, the session is completely dead. We clear the stored token and forcefully redirect to the login page. This is the only time the user actually sees they've been logged out.

export default api;



// Why localStorage for the access token?

// You might wonder why the access token goes in localStorage while the refresh token goes in an httpOnly cookie. Here's the reasoning:

// The access token needs to be readable by JavaScript so the request interceptor can attach it to headers. httpOnly cookies are invisible to JavaScript by design — so we can't use a cookie for the access token.

// The refresh token on the other hand should never be readable by JavaScript because it's long-lived and powerful. An httpOnly cookie is perfect — the browser sends it automatically but no JavaScript (including malicious scripts) can ever read it.