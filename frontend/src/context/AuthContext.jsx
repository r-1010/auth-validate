import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import axios from 'axios';

// ----------------------------------------
// Create the context
// ----------------------------------------
// This is the actual "broadcast channel".
// We export it so useAuth hook can tune into it.

const AuthContext = createContext(null);

// createContext(null) — creates the broadcast channel with a default value of null. The actual value gets filled in by AuthProvider.




// ----------------------------------------
// AuthProvider component
// ----------------------------------------
// This wraps your entire app (in main.jsx)
// so every component inside has access to
// the auth state and functions.

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

//   useState(null) for user — the current logged in user. null means nobody is logged in. When login succeeds this becomes { id, username, email, role }.

// useState(true) for loading — starts as true because the app needs a moment on startup to check if there's an existing session. While loading is true, the ProtectedRoute component (coming soon) will show a loading screen instead of redirecting to login. Without this, every page refresh would flash the login page for a split second even if the user is already logged in.




  // ----------------------------------------
  // Restore session on app startup
  // ----------------------------------------
  // When the app first loads (or page refreshes),
  // check if there is a valid refresh token cookie.
  // If there is, silently get a new access token
  // and fetch the user's profile to restore their session.
  // This is what keeps the user logged in across page refreshes.

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Use plain axios here — NOT the `api` instance.
        // This call is EXPECTED to fail with 401 if there's no
        // valid refresh cookie (e.g. first visit, logged out).
        // If we used `api`, the response interceptor would catch
        // that 401, try to refresh AGAIN, fail AGAIN, and redirect
        // via window.location.href — causing a full page reload
        // that re-triggers this exact function = infinite loop.
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshResponse.data.accessToken;

        // Save the new access token
        localStorage.setItem('accessToken', newAccessToken);

        // Now fetch the user's profile with the new token
        const profileResponse = await api.get('/users/profile');
        setUser(profileResponse.data.user);

      } catch (error) {
        // No valid session found — this is fine, user just needs to log in
        setUser(null);
        localStorage.removeItem('accessToken');
        console.warn(`Restore Session Error: ${error?.message || error}`);
      } finally {
        // Whether session restored or not, we're done loading.
        // Components waiting on this can now render.
        setLoading(false);
      }
    };

    restoreSession();
  }, []); // Empty array means this runs once when the app first mounts

//   useEffect with restoreSession — this runs once when the app first loads. It tries to silently refresh the access token using the cookie. If it works, the user's session is restored seamlessly. If it fails, the user sees the login page. This is what gives your app the "stay logged in" behaviour.




  // ----------------------------------------
  // LOGIN function
  // ----------------------------------------
  // Called from the Login page component.
  // Sends credentials to the backend, stores
  // the access token, and saves the user to state.

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user } = response.data;

    // Store access token in localStorage so the
    // request interceptor can attach it to future requests
    localStorage.setItem('accessToken', accessToken);

    // Save user to context state —
    // this triggers a re-render in all components
    // that are subscribed to this context
    setUser(user);

    return response.data;
  };

  // ----------------------------------------
  // LOGOUT function
  // ----------------------------------------
  // Called from any component (Navbar, Dashboard etc.)
  // Tells the backend to invalidate the refresh token,
  // clears local storage and wipes the user from state.

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if the backend call fails, we still
      // clean up the frontend — the user should
      // always be able to log out locally
      console.warn(`Logout Error: ${error?.message || error}`);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  // ----------------------------------------
  // Register function
  // ----------------------------------------
  // Called from the Register page component.
  // Just creates the account — does not log in.
  // After registering, the user is redirected
  // to the login page to sign in.

  const register = async (username, email, password) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  };

  // ----------------------------------------
  // Value provided to all child components
  // ----------------------------------------

  const value = {
    user,        // the current logged in user object (or null)
    loading,     // true while restoring session on startup
    login,       // function to log in
    logout,      // function to log out
    register,    // function to register
    isLoggedIn: !!user, // convenient boolean — true if user exists
  };

//   isLoggedIn: !!user — the !! converts the user object to a boolean. If user is an object, !!user is true. If user is null, !!user is false. This is a convenience so components can write if (isLoggedIn) instead of if (user !== null).


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;