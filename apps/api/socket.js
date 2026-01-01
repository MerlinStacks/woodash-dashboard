const { Server } = require('socket.io');

const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_page', (data) => {
            if (socket.currentRoom) {
                socket.leave(socket.currentRoom);
                socket.to(socket.currentRoom).emit('user_left', socket.id);
            }

            socket.join(data.page);
            socket.currentRoom = data.page;
            socket.userData = data;

            socket.to(data.page).emit('user_joined', { ...data, socketId: socket.id });
            socket.to(data.page).emit('request_announce', socket.id);
        });

        socket.on('announce_presence', (data) => {
            io.to(data.targetSocketId).emit('user_joined', {
                page: socket.currentRoom,
                user: socket.userData?.user,
                color: socket.userData?.color,
                socketId: socket.id
            });
        });

        socket.on('disconnect', () => {
            if (socket.currentRoom) {
                io.to(socket.currentRoom).emit('user_left', socket.id);
            }
        });
    });

    return io;
};

module.exports = { initSocket };
