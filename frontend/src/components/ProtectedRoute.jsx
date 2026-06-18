import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrap any route element with this to require an authenticated session.
 * - While the initial session check is in-flight, shows a loading state
 *   (prevents a flash-redirect to /login on page refresh).
 * - If there's no session, redirects to /login and remembers where the
 *   user was trying to go via location state.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          background: 'var(--bg-dark)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-family)',
        }}
      >
        Loading your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
