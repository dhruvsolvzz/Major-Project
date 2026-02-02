import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-red-50 flex items-center justify-center px-4">
            <div className="text-center">
                {/* 404 Icon */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-500 to-orange-500 rounded-full shadow-2xl shadow-red-500/30 mb-4">
                        <svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-8xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
                    404
                </h1>
                <h2 className="text-3xl font-semibold text-gray-800 mb-4">
                    Page Not Found
                </h2>
                <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                        <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Go Back
                    </button>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-4">Or try one of these pages:</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link to="/donor-registration" className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline">
                            Become a Donor
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/needer-registration" className="text-orange-600 hover:text-orange-700 font-medium text-sm hover:underline">
                            Need Blood
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/nearby" className="text-green-600 hover:text-green-700 font-medium text-sm hover:underline">
                            Find Nearby
                        </Link>
                        <span className="text-gray-300">•</span>
                        <Link to="/match" className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline">
                            Matchmaking
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
