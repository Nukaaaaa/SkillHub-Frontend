import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, setStoredUser as saveUserToStorage, MOCK_USERS, updateMockUsers } from '../mockData';
import type { User } from '../types';
import { getServiceClient } from '../api/client';

const userClient = getServiceClient('USER');

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: {
        firstname: string;
        lastname: string;
        email: string;
        password: string;
        universite: string;
        bio: string;
    }) => Promise<boolean>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    resetToDefaults: () => void;
    selectDirection: (id: number) => void;
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
            const storedUser = getStoredUser();
            // Load selected direction from localStorage
            const savedDirId = localStorage.getItem(`selected_direction_${storedUser?.id}`);
            if (savedDirId) {
                storedUser.selectedDirectionId = Number(savedDirId);
            }
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await userClient.post('/auth/login', { email, password });
            const { token: newToken } = response.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);

            // For now, we still use mock user data associated with the token
            const userToSet = getStoredUser();

            // Load selected direction from localStorage for this specific user
            const savedDirId = localStorage.getItem(`selected_direction_${userToSet?.id}`);
            if (savedDirId) {
                userToSet.selectedDirectionId = Number(savedDirId);
            }

            setUser(userToSet);
            saveUserToStorage(userToSet);

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (userData: {
        firstname: string;
        lastname: string;
        email: string;
        password: string;
        universite: string;
        bio: string;
    }) => {
        try {
            const response = await userClient.post('/auth/register', userData);
            const { token: newToken } = response.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);

            // Map real data to mock structure for UI compatibility
            const userToSet = {
                ...getStoredUser(),
                id: Math.floor(Math.random() * 1000000), // Random ID for new user
                name: `${userData.firstname} ${userData.lastname}`,
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email,
                avatar: `https://ui-avatars.com/api/?name=${userData.firstname}+${userData.lastname}&background=random`,
                selectedDirectionId: undefined // ALWAYS reset direction for new users
            };
            setUser(userToSet);
            saveUserToStorage(userToSet);

            return true;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
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

    const selectDirection = (id: number) => {
        if (!user) return;
        const updatedUser = { ...user, selectedDirectionId: id };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
        localStorage.setItem(`selected_direction_${user.id}`, id.toString());
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, register, logout,
            updateUser, resetToDefaults, selectDirection,
            isAuthenticated: !!token, loading
        }}>
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
