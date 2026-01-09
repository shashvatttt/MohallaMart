const Message = require('../models/Message');
const User = require('../models/User');

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

// @desc    Get list of users chatted with
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        // distinct senders/receivers
        const sentTo = await Message.distinct('receiver', { sender: req.user.id });
        const receivedFrom = await Message.distinct('sender', { receiver: req.user.id });

        const userIds = [...new Set([...sentTo, ...receivedFrom])].map(id => id.toString()); // Convert to string for Set uniqueness, if needed, but Mongoose ObjectIds act weird in Sets. better to map to string.

        const users = await User.find({ _id: { $in: userIds } }).select('name email');

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getChatHistory,
    getConversations
};
