import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }
    return context;
};

// useAuth() hook — the custom hook at the bottom is a convenience wrapper. Any component that needs auth state just imports and calls useAuth() to get { user, login, logout, loading, isLoggedIn } all at once. The error throw inside it is a safety net — if someone accidentally uses useAuth() outside of AuthProvider, they get a clear error message instead of a confusing undefined crash.