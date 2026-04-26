/**
 * Utility to handle media URLs from the backend (MinIO, etc.)
 */
export const getFullMediaUrl = (url?: string | null): string | null => {
    if (!url) return null;
    
    // If it's already an absolute URL or base64, return as is
    if (url.startsWith('http') || url.startsWith('data:')) {
        return url;
    }

    // Get base URL from environment and remove /api if present
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api';
    const baseUrl = rawApiUrl.endsWith('/api') 
        ? rawApiUrl.slice(0, -4) 
        : rawApiUrl;

    // Ensure leading slash for the relative part
    const sanitizedPath = url.startsWith('/') ? url : `/${url}`;
    
    return `${baseUrl}${sanitizedPath}`;
};
