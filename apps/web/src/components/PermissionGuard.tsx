import React from 'react';
import { useAuth } from '../context/auth';

interface PermissionGuardProps {
    requiredPermission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    requiredPermission,
    children,
    fallback = <div className="p-4 text-center text-red-500">Access Denied</div>
}) => {
    const { hasPermission, user } = useAuth();

    // Admin Override: Admin role usually implies all permissions or specific 'admin' permission
    // For now, let's assume 'admin' role has all access, or check specific permission
    const isAdmin = user?.role === 'admin';

    if (isAdmin || hasPermission(requiredPermission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
