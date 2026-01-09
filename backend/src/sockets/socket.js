const { Server } = require("socket.io");
const Message = require('../models/Message');

const socketParams = {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
};

// Map of userId -> socketId
const userSockets = new Map();

const initSocket = (server) => {
    const io = new Server(server, socketParams);

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join", (userId) => {
            if (userId) {
                userSockets.set(userId, socket.id);
                console.log(`User ${userId} joined with socket ${socket.id}`);
            }
        });

        socket.on("sendMessage", async (data) => {
            const { senderId, receiverId, content } = data;

            try {
                // Save to DB
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    content
                });

                const populatedMessage = await newMessage.populate('sender', 'name');

                // Emit to receiver if online
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receiveMessage", populatedMessage);
                }

                // Emit back to sender (optional, can just append locally)
                socket.emit("messageSent", populatedMessage);

            } catch (error) {
                console.error("Socket error saving message:", error);
            }
        });

        socket.on("disconnect", () => {
            // Remove user from map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

module.exports = initSocket;
