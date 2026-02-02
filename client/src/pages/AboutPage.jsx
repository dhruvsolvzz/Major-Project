import React from 'react';
import { motion } from 'framer-motion';
import { FaHeart, FaHandHoldingHeart, FaUsers, FaGlobeAsia } from 'react-icons/fa';
import Footer from '../components/Footer';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* Hero Section */}
            <section className="relative py-24 lg:py-32 bg-slate-900 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-orange-600/20 z-0"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-red-300 font-bold text-sm mb-6">
                            <FaHeart className="animate-pulse" /> OUR MISSION
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8">
                            Connecting Blood, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                Connecting Lives.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                            RedBridge is an AI-powered platform dedicated to bridging the critical gap between blood donors and patients in need, ensuring no life is lost due to unavailability.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { icon: <FaUsers />, label: "Active Donors", value: "12K+" },
                        { icon: <FaHandHoldingHeart />, label: "Lives Impacted", value: "50K+" },
                        { icon: <FaGlobeAsia />, label: "Cities Covered", value: "85" },
                        { icon: <FaHeart />, label: "Successful Matches", value: "98%" }
                    ].map((stat, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx}
                            className="bg-white p-8 rounded-2xl shadow-xl text-center border border-slate-100"
                        >
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4 text-xl">
                                {stat.icon}
                            </div>
                            <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Story & Vision */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Story</h2>
                            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                                <p>
                                    It started with a simple observation: while there are millions of willing blood donors, the connection mechanism was broken. Critical time was lost in finding the right match during emergencies.
                                </p>
                                <p>
                                    RedBridge was born to solve this. We leveraged geolocation and AI to create a system that doesn't just list donors, but actively matches and verifies them in real-time.
                                </p>
                                <p>
                                    Today, we are a community-driven platform empowering individuals to become heroes in their local neighborhoods.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl transform rotate-3 opacity-20"></div>
                            <div className="bg-slate-900 rounded-3xl p-12 text-white relative shadow-2xl">
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                    <FaGlobeAsia className="text-orange-400" /> Our Vision
                                </h3>
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    "To build a world where access to safe blood is never a cause for worry. We envision a seamless, automated, and unified blood donation network that operates with the speed and reliability of emergency services."
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 bg-slate-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-16">Core Values</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Transparency", desc: "Every step from request to donation is tracked and verified." },
                            { title: "Speed", desc: "Technology optimized to save every possible second during emergencies." },
                            { title: "Empathy", desc: "Designed with the human experience at the center of our technology." }
                        ].map((val, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">{val.title}</h3>
                                <p className="text-slate-600">{val.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default AboutPage;
