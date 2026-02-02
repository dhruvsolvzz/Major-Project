import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaHeart, FaPaperPlane } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-slate-300 font-sans">
            {/* Newsletter Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-orange-900/20 z-0"></div>
                <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
                    <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-white space-y-2 text-center md:text-left">
                            <h2 className="text-3xl font-bold">Save Lives, Join Our Community</h2>
                            <p className="text-red-100 max-w-md">
                                Subscribe to our newsletter for updates on donation camps, success stories, and health tips.
                            </p>
                        </div>
                        <div className="w-full md:w-auto max-w-md flex bg-white/10 backdrop-blur-sm p-1.5 rounded-xl border border-white/20">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-transparent border-none outline-none text-white placeholder-red-200 px-4 py-2 flex-grow w-full md:w-64"
                            />
                            <button className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center gap-2">
                                Subscribe <FaPaperPlane className="text-sm" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">RedBridge</span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed max-w-sm">
                            Bridging the gap between donors and those in need. AI-powered, location-aware, and built with <FaHeart className="inline text-red-500 mx-1 animate-pulse" /> to save lives.
                        </p>
                        <div className="flex space-x-4">
                            {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, i) => (
                                <a key={i} href="#" className="bg-slate-800 p-2.5 rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 hover:-translate-y-1">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li><FooterLink to="/donor-registration">Donate Blood</FooterLink></li>
                            <li><FooterLink to="/needer-registration">Find Donor</FooterLink></li>
                            <li><FooterLink to="/nearby">Nearby Centers</FooterLink></li>
                            <li><FooterLink to="/match">Compatibility</FooterLink></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Company</h3>
                        <ul className="space-y-4">
                            <li><FooterLink to="/about">About Us</FooterLink></li>
                            <li><FooterLink to="/blog">Blog</FooterLink></li>
                            <li><FooterLink to="/careers">Careers</FooterLink></li>
                            <li><FooterLink to="/contact">Contact</FooterLink></li>
                        </ul>
                    </div>

                    {/* Blood Types */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">Blood Groups</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'All'].map((type) => (
                                <span
                                    key={type}
                                    className="bg-slate-800 hover:bg-red-600/20 hover:text-red-400 cursor-default transition-colors text-center py-1.5 rounded-md text-xs font-bold border border-slate-700 hover:border-red-500/50"
                                >
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <p>© {currentYear} RedBridge Inc. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-red-500 transition-colors">Terms of Use</a>
                        <a href="#" className="hover:text-red-500 transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Helper component for links
const FooterLink = ({ to, children }) => (
    <Link to={to} className="text-slate-400 hover:text-white hover:translate-x-1 transition-all inline-block">
        {children}
    </Link>
);

export default Footer;
