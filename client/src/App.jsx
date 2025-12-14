import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DonorRegistration from './pages/DonorRegistration';
import NeederRegistration from './pages/NeederRegistration';
import DonorLogin from './pages/DonorLogin';
import NeederLogin from './pages/NeederLogin';
import DonorsPage from './pages/DonorsPage';
import NeedersPage from './pages/NeedersPage';
import NearbyFinder from './pages/NearbyFinder';
import Matchmaking from './pages/Matchmaking';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/donor-registration" element={<DonorRegistration />} />
        <Route path="/needer-registration" element={<NeederRegistration />} />
        <Route path="/donor-login" element={<DonorLogin />} />
        <Route path="/needer-login" element={<NeederLogin />} />
        <Route path="/donors" element={<DonorsPage />} />
        <Route path="/needers" element={<NeedersPage />} />
        <Route path="/nearby" element={<NearbyFinder />} />
        <Route path="/match" element={<Matchmaking />} />
      </Routes>
    </div>
  );
}

export default App;
