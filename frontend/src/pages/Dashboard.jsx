import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // ----------------------------------------
  // Fetch protected dashboard data on mount
  // ----------------------------------------
  // This request goes through the api instance,
  // which automatically attaches the access token.
  // If the token has expired, the response
  // interceptor silently refreshes it and
  // retries this request — you'll see this happen
  // automatically with no extra code here.

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/users/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        console.warn(err);
        setError('Failed to load dashboard data.');
      }
    };

    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">JWT Auth App</h1>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {loggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.username}
          </h2>
          <p className="text-gray-500 mb-6">
            This is a protected page. You can only see this because your access token was verified by the backend.
          </p>

          {/* User info card — comes from AuthContext (decoded from login response) */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Your account (from AuthContext)
            </h3>
            <dl className="text-sm text-gray-600 space-y-1">
              <div className="flex gap-2">
                <dt className="font-medium">ID:</dt>
                <dd>{user?.id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Username:</dt>
                <dd>{user?.username}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Email:</dt>
                <dd>{user?.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Role:</dt>
                <dd className="capitalize">{user?.role}</dd>
              </div>
            </dl>
          </div>

          {/* Data fetched live from protected backend route */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Live response from /api/users/dashboard
            </h3>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {!error && !dashboardData && (
              <p className="text-gray-500 text-sm">Loading...</p>
            )}
            {dashboardData && (
              <pre className="text-xs text-gray-700 bg-white rounded p-3 overflow-x-auto">
                {JSON.stringify(dashboardData, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;