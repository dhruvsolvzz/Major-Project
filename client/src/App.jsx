import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const DonorRegistration = lazy(() => import('./pages/DonorRegistration'));
const NeederRegistration = lazy(() => import('./pages/NeederRegistration'));
const DonorLogin = lazy(() => import('./pages/DonorLogin'));
const NeederLogin = lazy(() => import('./pages/NeederLogin'));
const DonorsPage = lazy(() => import('./pages/DonorsPage'));
const NeedersPage = lazy(() => import('./pages/NeedersPage'));
const NearbyFinder = lazy(() => import('./pages/NearbyFinder'));
const Matchmaking = lazy(() => import('./pages/Matchmaking'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AboutPage = lazy(() => import('./pages/AboutPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/donor-registration" element={<DonorRegistration />} />
            <Route path="/needer-registration" element={<NeederRegistration />} />
            <Route path="/donor-login" element={<DonorLogin />} />
            <Route path="/needer-login" element={<NeederLogin />} />
            <Route path="/donors" element={<DonorsPage />} />
            <Route path="/needers" element={<NeedersPage />} />
            <Route path="/nearby" element={<NearbyFinder />} />
            <Route path="/matchmaking" element={<Matchmaking />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </ToastProvider>
  );
}

export default App;
