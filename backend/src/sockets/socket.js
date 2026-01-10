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
                // Check if user is already connected with another socket, if so, maybe update or allow multiple?
                // For now, simple override is fine, or we could store an array of sockets per user.
                // Keeping it simple for this "Instagram-like" MVP.
                userSockets.set(userId, socket.id);
                console.log(`User ${userId} joined with socket ${socket.id}`);

                // Broadcast online status to others (optional enhancement)
                // io.emit("userOnline", userId);
            }
        });

        socket.on("sendMessage", async (data) => {
            const { senderId, receiverId, content } = data;

            try {
                // 1. Save to DB first to ensure persistence
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    content
                });

                const populatedMessage = await newMessage.populate([
                    { path: 'sender', select: 'name' },
                    { path: 'receiver', select: 'name' }
                ]);

                // 2. Emit to receiver if online
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receiveMessage", populatedMessage);
                }

                // 3. Emit back to sender to confirm receipt and update UI (if they have multiple tabs open)
                const senderSocketId = userSockets.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit("receiveMessage", populatedMessage); // treating it same as receive for simplicity in store
                } else {
                    // Fallback if sender socket ID lost (rare but possible during reconnects)
                    socket.emit("receiveMessage", populatedMessage);
                }

            } catch (error) {
                console.error("Socket error saving message:", error);
                socket.emit("messageError", { error: "Failed to send message" });
            }
        });

        socket.on("disconnect", () => {
            // Remove user from map
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    // io.emit("userOffline", userId);
                    break;
                }
            }
        });
    });

    return io;
};

module.exports = initSocket;
