import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isQuotePathAllowed, isVendorFullAccess } from '../engine/modeAccess';
import { useApp } from '../store/AppContext';

/** Redirect Vendor-only routes back to Site Measure when Mode is quote-path. */
export function ModeRouteGuard() {
  const { state } = useApp();
  const location = useLocation();
  const fullAccess = isVendorFullAccess(state);
  if (!fullAccess && !isQuotePathAllowed(location.pathname)) {
    return <Navigate to="/site-measure" replace />;
  }
  return <Outlet />;
}
