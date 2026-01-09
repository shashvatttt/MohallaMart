const express = require('express');
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProduct,
    markSold
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
    .get(protect, getProducts)
    .post(protect, upload.array('images', 5), createProduct);

router.route('/:id')
    .get(protect, getProduct);

router.put('/:id/sold', protect, markSold);

module.exports = router;
