import React, { useState } from 'react';
import { useAuth } from '../context/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, Store, User, Mail, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [storeName, setStoreName] = useState('');
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect logic
    const from = (location.state as any)?.from?.pathname || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login({ email, password });
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error(err);
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!fullName || !email || !password) {
            setError("All fields are required");
            setIsLoading(false);
            return;
        }

        try {
            await axios.post('/api/auth/register', {
                email,
                password,
                fullName,
                storeName
            });
            await login({ email, password });
            toast.success("Account created successfully!");
            navigate(from, { replace: true });

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-black/20">
                {/* Background Art */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
                </div>

                {/* Brand */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">OverSeek</h1>
                </div>

                {/* Hero Text */}
                <div className="relative z-10 space-y-6 max-w-lg">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold leading-tight"
                    >
                        Master Your Operations.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Scale Without Limits.
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-400 text-lg"
                    >
                        Experience the next generation of e-commerce management. Integrated analytics, seamless sync, and powerful automations.
                    </motion.p>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-sm text-gray-500">
                    © 2026 OverSeek Inc.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
                {/* Mobile bg */}
                <div className="absolute inset-0 lg:hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-full h-[500px] bg-indigo-600/10 blur-[80px]" />
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="mt-2 text-gray-400">
                            {isLogin
                                ? 'Enter your details to access your dashboard'
                                : 'Get started with your 14-day free trial'}
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                        <AnimatePresence mode="wait">
                            {isLogin ? (
                                <motion.form
                                    key="login"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleLogin}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Sign In
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.form
                                    key="register"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleRegister}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="fullName"
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="storeName">Store Name (Optional)</Label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="storeName"
                                                placeholder="My Brand"
                                                value={storeName}
                                                onChange={(e) => setStoreName(e.target.value)}
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-gray-600 focus:border-indigo-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <Button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Create Account <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            {isLogin
                                ? "Don't have an account? Sign up"
                                : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
