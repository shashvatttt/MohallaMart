
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate Access Token
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m'
    });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });
};

// Cookie Options
// Use secure: true in production (implied by requirement 1)
// Ideally use checking process.env.NODE_ENV === 'production' but user explicitly asked for secure: true
// However, localhost over HTTP will fail with secure: true.
// I will use a helper to determine secure flag or default to strict based on user requirement while allowing localhost dev if possible.
// User req: "Ensure solution works for both development and production".
// Safe bet: secure: process.env.NODE_ENV === 'production'
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProduction, // secure only in prod to allow localhost testing
        sameSite: isProduction ? 'none' : 'lax', // none for cross-domain prod, lax for localhost
        path: '/'
    };
};

const sendTokenResponse = (user, statusCode, res) => {
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const options = getCookieOptions();

    // Access Token Cookie (15 min)
    res.cookie('accessToken', accessToken, {
        ...options,
        maxAge: 15 * 60 * 1000 // 15 mins
    });

    // Refresh Token Cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
        ...options,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(statusCode).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        joinedCommunities: user.joinedCommunities
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            sendTokenResponse(user, 201, res);
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user email
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            sendTokenResponse(user, 200, res);
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get new access token using refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token found' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Verify user exists
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const accessToken = generateAccessToken(user.id);
        const options = getCookieOptions();

        res.cookie('accessToken', accessToken, {
            ...options,
            maxAge: 15 * 60 * 1000
        });

        res.json({ message: 'Token refreshed' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Logout user / clear cookies
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
    const options = getCookieOptions();

    res.cookie('accessToken', '', { ...options, maxAge: 0 });
    res.cookie('refreshToken', '', { ...options, maxAge: 0 });

    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json(user);
};

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getMe
};
