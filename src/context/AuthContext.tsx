import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { getServiceClient } from '../api/client';
import { userService } from '../api/userService';
import { roomService } from '../api/roomService';
import { getUserIdFromToken } from '../utils/auth';

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
    selectDirection: (id: number) => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    joinedRoomIds: number[];
    isMember: (roomId: number) => boolean;
    joinRoom: (roomId: number) => Promise<void>;
    leaveRoom: (roomId: number) => Promise<void>;
    refreshUserRooms: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [joinedRoomIds, setJoinedRoomIds] = useState<number[]>([]);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                const userId = getUserIdFromToken(storedToken);
                let userToSet: User | null = null;

                if (userId) {
                    try {
                        const realUser = await userService.getUserById(userId);
                        userToSet = {
                            ...realUser,
                            name: `${realUser.firstname} ${realUser.lastname}`,
                        };
                    } catch (e) {
                        console.error('Failed to restore user by ID, trying /me');
                    }
                }

                // If token was cleared by interceptor (401), stop here
                if (!localStorage.getItem('token')) {
                    logout();
                    setLoading(false);
                    return;
                }

                // Check again for token removal
                if (!localStorage.getItem('token')) {
                    logout();
                    setLoading(false);
                    return;
                }

                // Check again for token removal
                if (!localStorage.getItem('token')) {
                    logout();
                    setLoading(false);
                    return;
                }

                if (userToSet) {
                    // Load selected direction from localStorage
                    const savedDirId = localStorage.getItem(`selected_direction_${userToSet.id}`);
                    if (savedDirId) {
                        userToSet.selectedDirectionId = Number(savedDirId);
                    }
                    setUser(userToSet);
                    refreshUserRooms(userToSet.id);
                } else {
                    // Strict Mode: No profile = No access
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const refreshUserRooms = useCallback(async (userId?: number) => {
        const id = userId || user?.id;
        if (!id) return;
        try {
            const rooms = await roomService.getUserRooms(id);
            setJoinedRoomIds(rooms.map(r => r.id));
        } catch (error) {
            console.error('Failed to refresh user rooms:', error);
            // Fallback to empty if not found
            setJoinedRoomIds([]);
        }
    }, [user?.id]);

    const isMember = useCallback((roomId: number) => {
        return joinedRoomIds.includes(Number(roomId));
    }, [joinedRoomIds]);

    const joinRoom = async (roomId: number) => {
        if (!user) return;
        try {
            await roomService.joinRoom(roomId, user.id);
            await refreshUserRooms();
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    };

    const leaveRoom = async (roomId: number) => {
        if (!user) return;
        try {
            await roomService.leaveRoom(roomId, user.id);
            await refreshUserRooms();
        } catch (error) {
            console.error('Failed to leave room:', error);
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await userClient.post('/auth/login', { email, password });
            console.log('Full Login Response:', response.data);
            const { token: newToken } = response.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);

            const userId = getUserIdFromToken(newToken);
            let userToSet: User | null = null;

            // Try to find user in response body first (many backends return {token, user})
            if (response.data.user) {
                userToSet = {
                    ...response.data.user,
                    name: `${response.data.user.firstname} ${response.data.user.lastname}`,
                };
            }

            if (!userToSet && userId) {
                try {
                    const realUser = await userService.getUserById(userId);
                    userToSet = {
                        ...realUser,
                        name: `${realUser.firstname} ${realUser.lastname}`,
                    };
                } catch (e) {
                    console.error('Failed to fetch user by ID');
                }
            }

            if (!userToSet) {
                console.error('Could not determine user identity');
                throw new Error('Authentication failed: Could not retrieve user profile from backend');
            }

            const savedDirId = localStorage.getItem(`selected_direction_${userToSet.id}`);
            if (savedDirId) {
                userToSet.selectedDirectionId = Number(savedDirId);
            }

            setUser(userToSet);
            refreshUserRooms(userToSet.id);
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

            let userToSet: User | null = null;

            // Try from response or fetch or fallback
            if (response.data.user) {
                userToSet = {
                    ...response.data.user,
                    name: `${response.data.user.firstname} ${response.data.user.lastname}`,
                };
            }

            if (!userToSet) {
                console.error('Could not fetch real user after register');
                throw new Error('Registration succeeded, but profile retrieval failed');
            }

            setUser(userToSet);
            if (userToSet) {
                refreshUserRooms(userToSet.id);
            }
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
        setJoinedRoomIds([]);
    };

    const updateUser = (userData: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
    };

    const resetToDefaults = () => {
        localStorage.clear();
        window.location.reload();
    };

    const selectDirection = async (id: number) => {
        if (!user) return;
        const updatedUser = { ...user, selectedDirectionId: id };
        setUser(updatedUser);
        localStorage.setItem(`selected_direction_${user.id}`, id.toString());

        // Try to persist to backend as well
        try {
            await userService.updateUser(user.id, { selectedDirectionId: id });
        } catch (error) {
            console.error('Failed to sync direction with backend:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, register, logout,
            updateUser, resetToDefaults, selectDirection,
            isAuthenticated: !!token, loading,
            joinedRoomIds, isMember, joinRoom, leaveRoom, refreshUserRooms
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
