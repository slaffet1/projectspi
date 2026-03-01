import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';

// Routes inside /app that are allowed WITHOUT an active business
const EXEMPT_PATHS = [
  '/app/businesses',
  '/app/businesses/new',
];

export default function BusinessGuard({ children }: { children: React.ReactNode }) {
  const { activeBusiness, refreshBusinesses, businesses } = useBusiness();
  const { token } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const isExempt = EXEMPT_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (!token || isExempt) return;

    // If no active business cached, try to load businesses
    if (!activeBusiness) {
      refreshBusinesses().then(() => {
        // Still none after refresh → force create
        if (businesses.length === 0) {
          navigate('/app/businesses/new', { replace: true });
        } else {
          navigate('/app/businesses', { replace: true });
        }
      });
    }
  }, [activeBusiness, token, location.pathname]);

  return <>{children}</>;
}