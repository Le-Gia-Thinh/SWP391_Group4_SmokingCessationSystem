import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Tạo Socket.IO connection
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        // Connection events
        newSocket.on('connect', () => {
            console.log('🔗 Socket.IO connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error);
            setIsConnected(false);
        });

        setSocket(newSocket);

        // Cleanup khi component unmount
        return () => {
            newSocket.close();
        };
    }, []);

    // Join session room
    const joinSession = (sessionId) => {
        if (socket && sessionId) {
            socket.emit('joinSession', sessionId);
            console.log(`👥 Joined session room: ${sessionId}`);
        }
    };

    // Leave session room
    const leaveSession = (sessionId) => {
        if (socket && sessionId) {
            socket.emit('leaveSession', sessionId);
            console.log(`👋 Left session room: ${sessionId}`);
        }
    };

    const value = {
        socket,
        isConnected,
        joinSession,
        leaveSession
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}; 