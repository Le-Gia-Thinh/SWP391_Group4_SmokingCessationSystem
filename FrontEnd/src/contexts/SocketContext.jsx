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
    const [activeRooms, setActiveRooms] = useState([]);

    useEffect(() => {
        // Tạo Socket.IO connection với cấu hình tối ưu hơn
        const newSocket = io('http://localhost:5000', {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,         // Cho phép kết nối lại
            reconnectionAttempts: 5,    // Số lần thử kết nối lại
            reconnectionDelay: 1000,    // Độ trễ giữa các lần thử (milliseconds)
            timeout: 20000              // Timeout cho việc kết nối (milliseconds)
        });

        // Connection events
        newSocket.on('connect', () => {
            setIsConnected(true);
            
            // Khi kết nối lại, cần join lại tất cả các room đã join trước đó
            if (activeRooms.length > 0) {
                activeRooms.forEach(room => {
                    newSocket.emit('joinRoom', room);
                });
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            setIsConnected(false);
        });
        
        // Lắng nghe ping để xác nhận kết nối đang hoạt động
        newSocket.on('pong', (data) => {
            // Nhận pong từ server
        });
        
        // Gửi ping định kỳ để giữ kết nối
        const pingInterval = setInterval(() => {
            if (newSocket.connected) {
                newSocket.emit('ping', { ts: new Date().toISOString() });
            }
        }, 30000); // Mỗi 30 giây

        setSocket(newSocket);

        // Cleanup khi component unmount
        return () => {
            clearInterval(pingInterval);
            newSocket.close();
        };
    }, [activeRooms]);

    // Join session room
    const joinSession = (sessionId) => {
        if (socket && sessionId) {
            socket.emit('joinSession', sessionId);
            
            // Track active rooms
            setActiveRooms(prev => {
                if (!prev.includes(sessionId)) {
                    return [...prev, sessionId];
                }
                return prev;
            });
        }
    };

    // Leave session room
    const leaveSession = (sessionId) => {
        if (socket && sessionId) {
            socket.emit('leaveSession', sessionId);
            
            // Remove from active rooms
            setActiveRooms(prev => prev.filter(room => room !== sessionId));
        }
    };
    
    // Join chat room
    const joinRoom = (roomId) => {
        if (socket && roomId) {
            socket.emit('joinRoom', roomId);
            
            // Track active rooms
            setActiveRooms(prev => {
                if (!prev.includes(roomId)) {
                    return [...prev, roomId];
                }
                return prev;
            });
            
            // Force join nếu kết nối đã sẵn sàng để đảm bảo join thành công
            if (socket.connected) {
                socket.emit('forceJoinRoom', roomId);
            }
            
            // Lắng nghe sự kiện join thành công
            socket.on('joinSuccess', (data) => {
                // Đã join thành công
            });
        }
    };
    
    // Leave chat room
    const leaveRoom = (roomId) => {
        if (socket && roomId) {
            socket.emit('leaveRoom', roomId);
            
            // Remove from active rooms
            setActiveRooms(prev => prev.filter(room => room !== roomId));
        }
    };

    const value = {
        socket,
        isConnected,
        joinSession,
        leaveSession,
        joinRoom,
        leaveRoom,
        activeRooms
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}; 