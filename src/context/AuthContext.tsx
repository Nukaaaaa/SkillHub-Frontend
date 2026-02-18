import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, setStoredUser as saveUserToStorage, MOCK_USERS, updateMockUsers } from '../mockData';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: any) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    resetToDefaults: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            setUser(getStoredUser());
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, newUser: any) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        const userToSet = { ...getStoredUser(), ...newUser };
        setUser(userToSet);
        saveUserToStorage(userToSet);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);

        // Update in global list too
        const updatedUsersList = MOCK_USERS.map(u => u.id === updatedUser.id ? updatedUser : u);
        updateMockUsers(updatedUsersList);
    };

    const resetToDefaults = () => {
        localStorage.clear();
        window.location.reload();
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, resetToDefaults, isAuthenticated: !!token, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
