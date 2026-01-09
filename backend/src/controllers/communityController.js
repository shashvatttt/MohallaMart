const Community = require('../models/Community');
const User = require('../models/User');

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
const createCommunity = async (req, res) => {
    try {
        const { name, description, image, isPrivate } = req.body;

        // Generate a 6-character code
        // Simple random string for now. In production, check for uniqueness collision loop.
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        const community = await Community.create({
            name,
            description,
            image,
            isPrivate: isPrivate || false,
            code,
            creator: req.user.id,
            admins: [req.user.id],
            members: [req.user.id] // Creator is automatically a member
        });

        // Add to user's joined communities
        await User.findByIdAndUpdate(req.user.id, {
            $push: { joinedCommunities: community._id }
        });

        res.status(201).json(community);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Join a community by code
// @route   POST /api/communities/join
// @access  Private
const joinCommunityByCode = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Please provide a community code' });
        }

        const community = await Community.findOne({ code });

        if (!community) {
            return res.status(404).json({ message: 'Invalid community code' });
        }

        // Check if already a member
        if (community.members.includes(req.user.id)) {
            return res.status(400).json({ message: 'You are already a member of this community' });
        }

        community.members.push(req.user.id);
        await community.save();

        await User.findByIdAndUpdate(req.user.id, {
            $push: { joinedCommunities: community._id }
        });

        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all communities
// @route   GET /api/communities
// @access  Private
const getCommunities = async (req, res) => {
    try {
        // Only return public communities
        const communities = await Community.find({ isPrivate: false }).populate('creator', 'name');
        res.status(200).json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single community
// @route   GET /api/communities/:id
// @access  Private
const getCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate('creator', 'name')
            .populate('members', 'name');

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join a community
// @route   PUT /api/communities/:id/join
// @access  Private
const joinCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if already a member
        if (community.members.includes(req.user.id)) {
            return res.status(400).json({ message: 'Already a member' });
        }

        community.members.push(req.user.id);
        await community.save();

        await User.findByIdAndUpdate(req.user.id, {
            $push: { joinedCommunities: community._id }
        });

        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Leave a community
// @route   PUT /api/communities/:id/leave
// @access  Private
const leaveCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if creator
        if (community.creator.toString() === req.user.id) {
            return res.status(400).json({ message: 'Creator cannot leave community' });
        }

        // Check if member
        if (!community.members.includes(req.user.id)) {
            return res.status(400).json({ message: 'Not a member' });
        }

        community.members = community.members.filter(
            (member) => member.toString() !== req.user.id
        );
        await community.save();

        await User.findByIdAndUpdate(req.user.id, {
            $pull: { joinedCommunities: community._id }
        });

        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update community details
// @route   PUT /api/communities/:id
// @access  Private (Admin/Creator)
const updateCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if admin
        if (!community.admins.includes(req.user.id) && community.creator.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { name, description, image } = req.body;

        community.name = name || community.name;
        community.description = description || community.description;
        community.image = image || community.image;

        await community.save();
        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete community
// @route   DELETE /api/communities/:id
// @access  Private (Creator only)
const deleteCommunity = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if creator
        if (community.creator.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized (Creator only)' });
        }

        await community.deleteOne();

        // Remove from all users joinedCommunities is tricky without iterating.
        // For MVP, just leave it or do a multi update.
        // Optimally: await User.updateMany({ joinedCommunities: community._id }, { $pull: { joinedCommunities: community._id } });
        await User.updateMany(
            { joinedCommunities: community._id },
            { $pull: { joinedCommunities: community._id } }
        );

        res.status(200).json({ message: 'Community removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove member (Kick)
// @route   DELETE /api/communities/:id/members/:userId
// @access  Private (Admin)
const removeMember = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        const memberId = req.params.userId;

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if requester is admin
        if (!community.admins.includes(req.user.id) && community.creator.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Cannot kick creator
        if (community.creator.toString() === memberId) {
            return res.status(400).json({ message: 'Cannot kick creator' });
        }

        community.members = community.members.filter(m => m.toString() !== memberId);
        community.admins = community.admins.filter(a => a.toString() !== memberId); // Also remove from admins if there

        await community.save();

        await User.findByIdAndUpdate(memberId, {
            $pull: { joinedCommunities: community._id }
        });

        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Promote member
// @route   PUT /api/communities/:id/members/:userId/promote
// @access  Private (Creator only)
const promoteMember = async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        const memberId = req.params.userId;

        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if requester is creator
        if (community.creator.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized (Creator only)' });
        }

        if (!community.members.includes(memberId)) {
            return res.status(400).json({ message: 'User is not a member' });
        }

        if (!community.admins.includes(memberId)) {
            community.admins.push(memberId);
            await community.save();
        }

        res.status(200).json(community);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCommunity,
    getCommunities,
    getCommunity,
    joinCommunity,
    leaveCommunity,
    joinCommunityByCode,
    updateCommunity,
    deleteCommunity,
    removeMember,
    promoteMember
};
