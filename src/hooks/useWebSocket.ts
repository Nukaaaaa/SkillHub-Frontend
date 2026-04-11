import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWebSocketOptions {
    onMessage?: (data: any) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
    shouldConnect?: boolean;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
    const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('closed');
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectCount = useRef(0);
    const maxReconnectDelay = 30000;
    
    // Use refs for callbacks to avoid re-triggering the connection effect on every render
    const onMessageRef = useRef(options.onMessage);
    const onConnectRef = useRef(options.onConnect);
    const onDisconnectRef = useRef(options.onDisconnect);
    const onErrorRef = useRef(options.onError);

    useEffect(() => {
        onMessageRef.current = options.onMessage;
        onConnectRef.current = options.onConnect;
        onDisconnectRef.current = options.onDisconnect;
        onErrorRef.current = options.onError;
    }, [options.onMessage, options.onConnect, options.onDisconnect, options.onError]);

    const connect = useCallback(() => {
        // Don't connect if already connecting or open
        if (socketRef.current?.readyState === WebSocket.OPEN || 
            socketRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        console.log('Connecting to WebSocket:', url);
        setStatus('connecting');
        
        try {
            const ws = new WebSocket(url);
            socketRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setStatus('open');
                reconnectCount.current = 0;
                onConnectRef.current?.();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessageRef.current?.(data);
                } catch (e) {
                    console.error('Failed to parse WS message:', e);
                }
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setStatus('closed');
                onDisconnectRef.current?.();
                
                // Auto-reconnect logic if it wasn't a clean close and we still should be connected
                if (socketRef.current === ws) { // Ensure we're not reconnecting for an old socket
                    const delay = Math.min(1000 * Math.pow(2, reconnectCount.current), maxReconnectDelay);
                    setTimeout(() => {
                        if (socketRef.current === null || socketRef.current.readyState === WebSocket.CLOSED) {
                            reconnectCount.current++;
                            connect();
                        }
                    }, delay);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('error');
                onErrorRef.current?.(error);
            };
        } catch (err) {
            console.error('Error creating WebSocket:', err);
            setStatus('error');
        }
    }, [url]);

    const sendMessage = useCallback((data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
            return true;
        }
        console.warn('Cannot send message, WS status:', status);
        return false;
    }, [status]);

    useEffect(() => {
        if (options.shouldConnect !== false && url && url.includes('token=') && !url.includes('token=null')) {
            connect();
        }

        return () => {
            if (socketRef.current) {
                console.log('Cleaning up WebSocket connection');
                socketRef.current.onclose = null; // Prevent reconnect on unmount
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [connect, options.shouldConnect, url]);

    return { status, sendMessage, connect };
};
