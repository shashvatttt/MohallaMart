const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get chat history with a specific user
// @route   GET /api/chat/:userId
// @access  Private
const getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: userId },
                { sender: userId, receiver: req.user.id }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender', 'name')
            .populate('receiver', 'name');

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get list of users chatted with (with unread counts and last message)
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const currentUserId = new mongoose.Types.ObjectId(req.user.id);

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: currentUserId },
                        { receiver: currentUserId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", currentUserId] },
                            "$receiver",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiver", currentUserId] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    _id: "$userDetails._id",
                    name: "$userDetails.name",
                    email: "$userDetails.email",
                    unreadCount: 1,
                    lastMessage: {
                        content: "$lastMessage.content",
                        createdAt: "$lastMessage.createdAt",
                        sender: "$lastMessage.sender"
                    }
                }
            },
            {
                $sort: { "lastMessage.createdAt": -1 }
            }
        ]);

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error in getConversations:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get total unread messages count
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            receiver: req.user.id,
            isRead: false
        });
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark messages from a specific user as read
// @route   PUT /api/chat/:userId/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        await Message.updateMany(
            { sender: userId, receiver: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getChatHistory,
    getConversations,
    getUnreadCount,
    markAsRead
};
