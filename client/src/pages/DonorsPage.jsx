import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DonorsPage = () => {
  const [needers, setNeeders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNeeders();
  }, []);

  const fetchNeeders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/needers');
      const data = await res.json();
      setNeeders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const filteredNeeders = filter === 'all' ? needers : needers.filter(n => n.requiredBloodGroup === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-red-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 p-2 rounded-xl shadow-lg"
              >
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                RedBridge
              </span>
            </Link>
            <Link to="/donor-registration">
              <button className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition">
                + Register as Donor
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              People Who Need Your Help
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            {needers.length} people waiting for blood donors like you
          </p>
        </div>

        {/* Blood Group Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-red-50'
              }`}
            >
              All ({needers.length})
            </button>
            {bloodGroups.map((bg) => (
              <button
                key={bg}
                onClick={() => setFilter(bg)}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  filter === bg
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-red-50'
                }`}
              >
                {bg} ({needers.filter(n => n.requiredBloodGroup === bg).length})
              </button>
            ))}
          </div>
        </div>

        {/* Donors Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredNeeders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🙏</div>
            <p className="text-xl text-gray-600">No needers found for {filter}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNeeders.map((needer, index) => (
              <div
                key={needer._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition p-6 border-2 border-transparent hover:border-red-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{needer.name}</h3>
                    <p className="text-sm text-gray-600">{needer.age} years, {needer.gender}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-lg">
                    {needer.requiredBloodGroup}
                  </div>
                </div>

                <div
                  className={`mb-4 px-4 py-2 rounded-lg font-semibold text-center shadow-md ${
                    needer.urgency === 'Critical' ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' :
                    needer.urgency === 'High' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' :
                    needer.urgency === 'Medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
                    'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  }`}
                >
                  🚨 {needer.urgency} Urgency
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {needer.phone}
                  </div>
                  <div className="flex items-start">
                    <svg className="h-4 w-4 mr-2 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="line-clamp-2">{needer.address}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <a
                    href={`tel:${needer.phone}`}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center hover:shadow-lg transition"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Contact Needer
                  </a>
                  {needer.bloodReportFile && (
                    <button
                      onClick={() => window.open(`http://localhost:5000/api/needers/blood-report/${needer._id}`, '_blank')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-xl font-semibold flex items-center justify-center hover:shadow-lg transition"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Blood Report
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorsPage;
