import React, { useState } from 'react';
import { useAuth } from '../context/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, UserPlus, LogIn, Store } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Login Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Register Data
    const [fullName, setFullName] = useState('');
    const [storeName, setStoreName] = useState('');

    const [error, setError] = useState('');
    const { login } = useAuth(); // We might need to manually handle verify/set user for register if useAuth only has login
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect to where they came from
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

            // After register, we are logged in (cookie set). 
            // We can reload or force fetch user.
            // But useAuth login() also fetches user? 
            // Actually useAuth login() just posts to /login and sets user.
            // Let's just call login() with same creds to trigger context update or reload window.
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
        <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">

            {/* Ambient Background globs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />

            <Card className="w-full max-w-md border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl text-white z-10">
                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl shadow-lg ring-1 ring-white/20">
                            {isLogin ? <Lock className="h-8 w-8 text-white" /> : <UserPlus className="h-8 w-8 text-white" />}
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        {isLogin ? 'Enter your credentials to access your dashboard' : 'Get started with your premium dashboard experience'}
                    </CardDescription>
                </CardHeader>

                {isLogin ? (
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
                                />
                            </div>
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
                                    {error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/20" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign In'} <LogIn className="ml-2 h-4 w-4" />
                            </Button>
                            <p className="text-sm text-center text-gray-400">
                                Don't have an account?{' '}
                                <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                    Register now
                                </button>
                            </p>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Store Name (Optional)</Label>
                                <Input
                                    id="storeName"
                                    type="text"
                                    placeholder="My Awesome Store"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-indigo-500"
                                />
                            </div>
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
                                    {error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-purple-500/20" disabled={isLoading}>
                                {isLoading ? 'Creating Account...' : 'Create Account'} <Store className="ml-2 h-4 w-4" />
                            </Button>
                            <p className="text-sm text-center text-gray-400">
                                Already have an account?{' '}
                                <button type="button" onClick={() => { setIsLogin(true); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                    Sign In
                                </button>
                            </p>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
