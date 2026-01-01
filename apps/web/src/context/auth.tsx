import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface User {
    id: number;
    email: string;
    fullName: string;
    storeId: number;
    isSuperAdmin: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await axios.get('/api/auth/me', { withCredentials: true });
            setUser(res.data);
        } catch (e) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (credentials: any) => {
        const res = await axios.post('/api/auth/login', credentials, { withCredentials: true });
        setUser(res.data.user);
    };

    const logout = async () => {
        await axios.post('/api/auth/logout', {}, { withCredentials: true });
        setUser(null);
    };

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.isSuperAdmin) return true;
        // Todo: Implement role-based checks here
        return false;
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
