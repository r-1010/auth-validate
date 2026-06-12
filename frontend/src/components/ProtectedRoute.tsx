import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User } from '../types';

// ----------------------------------------
// ProtectedRoute component
// ----------------------------------------
// Wraps any page that requires authentication.
//
// Basic usage (any logged in user):
// <ProtectedRoute><Dashboard /></ProtectedRoute>
//
// Role restricted usage (admins only):
// <ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user: rawUser, loading, isLoggedIn } = useAuth();
    const user = rawUser as User | null;

    // ----------------------------------------
    // Still checking for existing session
    // ----------------------------------------
    // AuthContext is running restoreSession() on startup.
    // While that's in progress, loading is true.
    // We show a spinner instead of redirecting —
    // without this, every page refresh would flash
    // the login page for a split second even for
    // logged in users.

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // ----------------------------------------
    // Not logged in
    // ----------------------------------------
    // No user in context — redirect to login page.
    // The 'replace' prop replaces the current entry
    // in browser history instead of adding to it.
    // This means pressing the back button won't
    // bring the user back to the protected page.

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // ----------------------------------------
    // Logged in but wrong role
    // ----------------------------------------
    // User is authenticated but doesn't have
    // the required role for this specific page.
    // Redirect to dashboard instead of login
    // since they ARE logged in, just not authorized.

    if (requiredRole && user && user?.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    // ----------------------------------------
    // All checks passed — render the page
    // ----------------------------------------

    return children;
};

export default ProtectedRoute;


// loading check — the first guard. While AuthContext is running restoreSession() on startup, we show a spinner. This is a tiny window of time (fraction of a second usually) but without handling it, React would see user = null during that window and redirect to login even for logged-in users, causing a jarring flash.

// (!isLoggedIn) check — the second guard. If the session restore finished and there's no user, we redirect to /login. The replace prop is a subtle but important detail — it replaces the history entry so the back button doesn't let users navigate back to a page they're not allowed to see.

// requiredRole check — the third guard. Optional role-based protection. If you pass requiredRole="admin" to this component and the logged-in user has role: "user", they get redirected to /dashboard rather than /login — because they are logged in, they just don't have admin privileges.

// return children — if all three guards pass, we simply render whatever page was wrapped inside ProtectedRoute. The component becomes invisible — it did its job and steps aside.


// ======================++================++================++================++===================




// FRONTED VS BACKEND PROTECTION — WHY YOU NEED BOTH?

// You might wonder — the backend already rejects unauthorised requests, so why bother protecting the frontend too?

// They protect different things. The backend protects your data — even if someone bypasses the frontend, they can't get real data without a valid token. The frontend protects the user experience — it prevents logged-out users from seeing pages that would be broken or empty, and it prevents awkward states like a dashboard that shows nothing because all its API calls failed.

// Think of it like a bank — the vault door (backend) protects the actual money. The security guard at the entrance (frontend) stops people from even reaching the vault room. You want both.