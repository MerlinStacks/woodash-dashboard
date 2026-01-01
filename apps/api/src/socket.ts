import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

export const initSocket = (server: HttpServer) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Configure carefully in production
            methods: ["GET", "POST"]
        },
        path: '/socket.io' // Explicitly set path to match client expectations
    });

    io.on('connection', (socket: Socket) => {
        console.log('User connected:', socket.id);

        // Weakly typed for now to match JS behavior
        (socket as any).currentRoom = null;
        (socket as any).userData = null;

        socket.on('join_page', (data: any) => {
            const currentRoom = (socket as any).currentRoom;
            if (currentRoom) {
                socket.leave(currentRoom);
                socket.to(currentRoom).emit('user_left', socket.id);
            }

            socket.join(data.page);
            (socket as any).currentRoom = data.page;
            (socket as any).userData = data;

            socket.to(data.page).emit('user_joined', { ...data, socketId: socket.id });
            socket.to(data.page).emit('request_announce', socket.id);
        });

        socket.on('announce_presence', (data: any) => {
            io.to(data.targetSocketId).emit('user_joined', {
                page: (socket as any).currentRoom,
                user: (socket as any).userData?.user,
                color: (socket as any).userData?.color,
                socketId: socket.id
            });
        });

        socket.on('disconnect', () => {
            const currentRoom = (socket as any).currentRoom;
            if (currentRoom) {
                io.to(currentRoom).emit('user_left', socket.id);
            }
        });
    });

    return io;
};
