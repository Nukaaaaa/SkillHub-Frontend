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
    registerSendCode: (email: string) => Promise<boolean>;
    register: (userData: {
        firstname: string;
        lastname: string;
        email: string;
        password: string;
        confirm_password: string;
        code: string;
        universite: string;
        bio: string;
        avatar?: File;
    }) => Promise<boolean>;
    logout: () => void;
    updateUser: (userData: Partial<User> & { avatarFile?: File }) => Promise<void>;
    resetToDefaults: () => void;
    selectDirection: (id: number, slug: string) => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    joinedRoomIds: number[];
    isMember: (roomId: number) => boolean;
    joinRoom: (roomSlug: string) => Promise<void>;
    leaveRoom: (roomSlug: string) => Promise<void>;
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
                            avatar: realUser.avatar_url || '',
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
                    const savedDirId = localStorage.getItem(`selected_direction_id_${userToSet.id}`);
                    const savedDirSlug = localStorage.getItem(`selected_direction_slug_${userToSet.id}`);
                    if (savedDirId) {
                        userToSet.selectedDirectionId = Number(savedDirId);
                    }
                    if (savedDirSlug) {
                        userToSet.selectedDirectionSlug = savedDirSlug;
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

    const joinRoom = async (roomSlug: string) => {
        if (!user) return;
        try {
            await roomService.joinRoom(roomSlug, user.id);
            await refreshUserRooms();
        } catch (error) {
            console.error('Failed to join room:', error);
            throw error;
        }
    };

    const leaveRoom = async (roomSlug: string) => {
        if (!user) return;
        try {
            await roomService.leaveRoom(roomSlug, user.id);
            await refreshUserRooms();
        } catch (error) {
            console.error('Failed to leave room:', error);
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response = await userClient.post('/auth/login', { email, password });
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
                        avatar: realUser.avatar_url || '',
                    };
                } catch (e) {
                    console.error('Failed to fetch user by ID');
                }
            }

            if (!userToSet) {
                console.error('Could not determine user identity');
                throw new Error('Authentication failed: Could not retrieve user profile from backend');
            }

            const savedDirId = localStorage.getItem(`selected_direction_id_${userToSet.id}`);
            const savedDirSlug = localStorage.getItem(`selected_direction_slug_${userToSet.id}`);
            if (savedDirId) {
                userToSet.selectedDirectionId = Number(savedDirId);
            }
            if (savedDirSlug) {
                userToSet.selectedDirectionSlug = savedDirSlug;
            }

            setUser(userToSet);
            refreshUserRooms(userToSet.id);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const registerSendCode = async (email: string) => {
        try {
            await userClient.post('/auth/register/send-code', { email });
            return true;
        } catch (error) {
            console.error('Send code failed:', error);
            throw error;
        }
    };

    const register = async (userData: {
        firstname: string;
        lastname: string;
        email: string;
        password: string;
        confirm_password: string;
        code: string;
        universite: string;
        bio: string;
        avatar?: File;
    }): Promise<boolean> => {
        try {
            // 1. Создаем FormData
            const formData = new FormData();
            formData.append('firstname', userData.firstname);
            formData.append('lastname', userData.lastname);
            formData.append('email', userData.email);
            formData.append('password', userData.password);
            formData.append('confirm_password', userData.confirm_password);
            formData.append('code', userData.code);
            formData.append('universite', userData.universite);
            formData.append('bio', userData.bio);
            if (userData.avatar) {
                formData.append('avatar', userData.avatar);
            }

            // 2. Регистрируем пользователя
            const response = await userClient.post('/auth/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const { token: newToken } = response.data;

            if (!newToken) throw new Error('Token not returned');

            // 2. Сохраняем токен
            localStorage.setItem('token', newToken);
            setToken(newToken);

            // 3. Получаем userId из токена
            const userId = getUserIdFromToken(newToken);
            if (!userId) throw new Error('Cannot extract userId from token');

            // 4. Делаем запрос профиля
            const realUser = await userService.getUserById(userId);

            if (!realUser) {
                throw new Error('Registration succeeded, but profile retrieval failed');
            }

            const userToSet = {
                ...realUser,
                name: `${realUser.firstname} ${realUser.lastname}`,
                avatar: realUser.avatar_url || '',
            };

            // 5. Сохраняем пользователя и комнаты
            setUser(userToSet);
            refreshUserRooms(userToSet.id);

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

    const updateUser = async (userData: Partial<User> & { avatarFile?: File }) => {
        if (!user) return;

        let avatarUrl = user.avatar;

        if (userData.avatarFile) {
            try {
                const result = await userService.uploadAvatar(userData.avatarFile);
                avatarUrl = result.avatar_url;
            } catch (error) {
                console.error('Failed to upload avatar to MinIO:', error);
            }
        } else if (userData.avatar && userData.avatar.startsWith('data:')) {
            avatarUrl = userData.avatar;
        }

        const updatedUser = { 
            ...user, 
            ...userData, 
            avatar: avatarUrl 
        };

        const newFirstname = userData.firstname || user.firstname;
        const newLastname = userData.lastname || user.lastname;
        updatedUser.name = `${newFirstname} ${newLastname}`.trim();

        setUser(updatedUser);

        const { avatar, avatarFile, name, ...backendFields } = userData;
        if (Object.keys(backendFields).length > 0) {
            try {
                await userService.updateUser(user.id, backendFields);
            } catch (error) {
                console.error('Failed to sync profile with backend:', error);
            }
        }
    };

    const resetToDefaults = () => {
        localStorage.clear();
        window.location.reload();
    };

    const selectDirection = async (id: number, slug: string) => {
        if (!user) return;
        const updatedUser = { ...user, selectedDirectionId: id, selectedDirectionSlug: slug };
        setUser(updatedUser);
        localStorage.setItem(`selected_direction_id_${user.id}`, id.toString());
        localStorage.setItem(`selected_direction_slug_${user.id}`, slug);

        // Try to persist to backend as well
        try {
            await userService.updateUser(user.id, { selectedDirectionId: id });
        } catch (error) {
            console.error('Failed to sync direction with backend:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, register, registerSendCode, logout,
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
