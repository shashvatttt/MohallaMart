const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCommunities)
    .post(protect, createCommunity);

router.post('/join-by-code', protect, joinCommunityByCode);

router.route('/:id')
    .get(protect, getCommunity)
    .put(protect, updateCommunity)
    .delete(protect, deleteCommunity);

router.put('/:id/join', protect, joinCommunity);
router.put('/:id/leave', protect, leaveCommunity);

router.delete('/:id/members/:userId', protect, removeMember);
router.put('/:id/members/:userId/promote', protect, promoteMember);

module.exports = router;
