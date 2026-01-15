const { Server } = require("socket.io");
const Message = require('../models/Message');

const socketParams = {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://mohallamart.store",
            "https://www.mohallamart.store"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
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
            const { senderId, receiverId, content, tempId } = data;

            // Basic validation
            if (!senderId || !receiverId || !content?.trim()) {
                console.error("Invalid message data received:", data);
                socket.emit("messageError", { error: "Sender, receiver, and content are required" });
                return;
            }

            try {
                // 1. Save to DB first to ensure persistence
                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    content: content.trim()
                });

                const populatedMessage = await Message.findById(newMessage._id).populate([
                    { path: 'sender', select: '_id name' },
                    { path: 'receiver', select: '_id name' }
                ]);

                if (!populatedMessage) {
                    throw new Error("Failed to populate message");
                }

                const responseData = {
                    ...populatedMessage.toObject(),
                    tempId // Echo back the tempId so frontend can replace the optimistic message
                };

                // 2. Emit to receiver if online
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("receiveMessage", responseData);
                }

                // 3. Emit back to sender to confirm receipt and update UI
                const senderSocketId = userSockets.get(senderId);
                socket.emit("receiveMessage", responseData);

                if (senderSocketId && senderSocketId !== socket.id) {
                    io.to(senderSocketId).emit("receiveMessage", responseData);
                }

            } catch (error) {
                console.error("Socket error saving message:", error);
                socket.emit("messageError", { error: "Failed to send message: " + error.message, tempId });
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
