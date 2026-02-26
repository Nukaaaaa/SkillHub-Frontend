/**
 * Decodes a JWT token and returns its payload.
 */
export const parseJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

/**
 * Extracts the user ID from a JWT token.
 * Adjust the key ('sub' or 'id') based on your backend implementation.
 */
export const getUserIdFromToken = (token: string): number | null => {
    const payload = parseJwt(token);
    if (!payload) return null;

    console.log('JWT Payload Keys:', Object.keys(payload)); // Show all available fields
    console.log('Full JWT Payload:', payload); // Show the whole thing for debugging

    // Try a broad range of possible ID claim names
    const id = payload?.sub ||
        payload?.id ||
        payload?.userId ||
        payload?.user_id ||
        payload?.uid ||
        payload?.ID ||
        payload?.Id;

    return id ? Number(id) : null;
};
