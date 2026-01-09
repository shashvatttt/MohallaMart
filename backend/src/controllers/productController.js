const Product = require('../models/Product');
const Community = require('../models/Community');
const cloudinary = require('../utils/cloudinary');

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Community Member only)
const createProduct = async (req, res) => {
    try {
        const { title, description, price, category, communityId } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Please upload at least one image' });
        }

        // Check if community exists
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: 'Community not found' });
        }

        // Check if user is a member
        if (!community.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'You must be a member to post products' });
        }

        // Upload images to Cloudinary
        const imageUrls = [];
        for (const file of req.files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'mohalla-mart/products'
            });
            imageUrls.push(result.secure_url);
        }

        const product = await Product.create({
            title,
            description,
            price,
            category,
            images: imageUrls,
            community: communityId,
            seller: req.user.id
        });

        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get products (filtered by community)
// @route   GET /api/products
// @access  Private (Community Member only for specific feed, or All joined communities for home feed)
const getProducts = async (req, res) => {
    try {
        const { communityId } = req.query;
        let query = { status: 'Available' };

        if (communityId) {
            // Get products for a specific community
            // Check membership
            const community = await Community.findById(communityId);
            if (!community) {
                return res.status(404).json({ message: 'Community not found' });
            }
            if (!community.members.includes(req.user.id)) {
                return res.status(403).json({ message: 'Access denied' });
            }
            query.community = communityId;
        } else {
            // Get products from ALL joined communities (Home Feed)
            const user = await req.user.populate('joinedCommunities');
            const communityIds = user.joinedCommunities.map(c => c._id);
            query.community = { $in: communityIds };
        }

        const products = await Product.find(query)
            .populate('seller', 'name')
            .populate('community', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'name')
            .populate('community', 'name image');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if member of the community
        const community = await Community.findById(product.community._id);
        if (!community.members.includes(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark product as sold
// @route   PUT /api/products/:id/sold
// @access  Private (Seller only)
const markSold = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.seller.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        product.status = 'Sold';
        await product.save();

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    markSold
};
