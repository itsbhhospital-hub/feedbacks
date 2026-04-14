import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AccessGuard = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Simulated Hospital Network Check
    const verifyAccess = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        setError('');

        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simple simulated check - user can change this password
        if (password === 'SBH-HOSPITAL-2222') {
            setIsAuthenticated(true);
            localStorage.setItem('hospital_access', 'true');
        } else {
            setError('Invalid Access Credentials. Please check with the administrator.');
        }
        setIsVerifying(false);
    };

    useEffect(() => {
        const savedAccess = localStorage.getItem('hospital_access');
        if (savedAccess === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    if (isAuthenticated) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20" />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                        <Shield className="w-12 h-12 text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Hospital Network Access
                </h1>
                <p className="text-gray-400 text-center text-sm mb-8">
                    This system is restricted to authorized hospital networks. Please verify your identity.
                </p>

                <form onSubmit={verifyAccess} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold ml-1">
                            Access Code
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-white/10"
                                required
                            />
                            <Lock className="absolute right-4 top-3.5 w-5 h-5 text-white/20" />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                            >
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={isVerifying}
                        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isVerifying
                                ? 'bg-gray-800 cursor-not-allowed text-gray-400'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5'
                            }`}
                    >
                        {isVerifying ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Verify Network Access
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        Secure Backend Hospital Management System
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessGuard;
