import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHeartbeat, FaUser, FaSignOutAlt, FaTint, FaPhone, FaMapMarkerAlt, FaEnvelope, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        checkAuthStatus();
        const handleStorageChange = () => checkAuthStatus();
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [location]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const checkAuthStatus = () => {
        const donorToken = localStorage.getItem('donorToken');
        const donorData = localStorage.getItem('donorData');
        const neederToken = localStorage.getItem('neederToken');
        const neederData = localStorage.getItem('neederData');

        if (donorToken && donorData) {
            try {
                setUser(JSON.parse(donorData));
                setUserType('donor');
            } catch { setUser(null); setUserType(null); }
        } else if (neederToken && neederData) {
            try {
                setUser(JSON.parse(neederData));
                setUserType('needer');
            } catch { setUser(null); setUserType(null); }
        } else {
            setUser(null);
            setUserType(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('donorToken');
        localStorage.removeItem('donorData');
        localStorage.removeItem('neederToken');
        localStorage.removeItem('neederData');
        setUser(null);
        setUserType(null);
        setShowProfile(false);
        navigate('/');
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const navLinks = [
        { to: '/about', label: 'About' },
        { to: '/nearby', label: 'Find Centers' },
        { to: '/matchmaking', label: 'Smart Match' },
    ];

    return (
        <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2.5 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                            <FaHeartbeat className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                            RedBridge
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`font-medium transition-colors ${location.pathname === link.to ? 'text-red-600' : 'text-slate-600 hover:text-red-600'}`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="flex items-center space-x-4 pl-4 border-l border-slate-200">
                            {user ? (
                                /* Logged-in state */
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setShowProfile(!showProfile)}
                                        className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${userType === 'donor'
                                            ? 'bg-gradient-to-br from-red-500 to-orange-500'
                                            : 'bg-gradient-to-br from-blue-500 to-purple-500'
                                            }`}>
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{userType} • Logged in</p>
                                        </div>
                                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Profile Dropdown */}
                                    {showProfile && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* Header */}
                                            <div className={`px-6 py-5 ${userType === 'donor'
                                                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                                                }`}>
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border-2 border-white/30">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-lg">{user.name}</p>
                                                        <span className="inline-block mt-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white capitalize">
                                                            {userType === 'donor' ? '🩸 Donor' : '🤝 Needer'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="px-6 py-4 space-y-3">
                                                {(user.bloodGroup || user.requiredBloodGroup) && (
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <FaTint className="w-4 h-4 mr-3 text-red-500" />
                                                        <span>Blood Group: <strong className="text-slate-800">{user.bloodGroup || user.requiredBloodGroup}</strong></span>
                                                    </div>
                                                )}
                                                {user.phone && (
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <FaPhone className="w-4 h-4 mr-3 text-blue-500" />
                                                        <span>{user.phone}</span>
                                                    </div>
                                                )}
                                                {user.email && (
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <FaEnvelope className="w-4 h-4 mr-3 text-green-500" />
                                                        <span className="truncate">{user.email}</span>
                                                    </div>
                                                )}
                                                {user.address && (
                                                    <div className="flex items-center text-sm text-slate-600">
                                                        <FaMapMarkerAlt className="w-4 h-4 mr-3 text-purple-500 flex-shrink-0" />
                                                        <span className="line-clamp-2">{user.address}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dashboard Link + Logout */}
                                            <div className="px-4 pb-4 space-y-2">
                                                <Link
                                                    to={userType === 'donor' ? '/donors' : '/needers'}
                                                    onClick={() => setShowProfile(false)}
                                                    className="flex items-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    <FaUser className="w-4 h-4 mr-3 text-slate-400" />
                                                    View Dashboard
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <FaSignOutAlt className="w-4 h-4 mr-3" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Logged-out state */
                                <>
                                    <Link to="/donor-login" className="text-slate-700 hover:text-red-600 font-semibold transition-colors">
                                        Login
                                    </Link>
                                    <Link to="/donor-registration" className="bg-red-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-red-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                        Donate Now
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        {showMobileMenu ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
                    <div className="px-4 py-4 space-y-2">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setShowMobileMenu(false)}
                                className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="border-t border-slate-100 pt-3 mt-3">
                            {user ? (
                                <>
                                    <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 ${userType === 'donor' ? 'bg-red-50' : 'bg-blue-50'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${userType === 'donor'
                                            ? 'bg-gradient-to-br from-red-500 to-orange-500'
                                            : 'bg-gradient-to-br from-blue-500 to-purple-500'
                                            }`}>
                                            {getInitials(user.name)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{user.name}</p>
                                            <p className="text-xs text-slate-500 capitalize">{userType} • {user.bloodGroup || user.requiredBloodGroup || ''}</p>
                                        </div>
                                    </div>
                                    <Link
                                        to={userType === 'donor' ? '/donors' : '/needers'}
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        View Dashboard
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                                        className="w-full text-left px-4 py-3 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/donor-login"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/donor-registration"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="block px-4 py-3 rounded-xl bg-red-600 text-white text-center font-semibold hover:bg-red-700 transition-colors"
                                    >
                                        Donate Now
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
