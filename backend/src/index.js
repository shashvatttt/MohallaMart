require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const { createServer } = require('http'); // For Socket.io later
// const { Server } = require('socket.io'); // For Socket.io later

const { createServer } = require('http');
const initSocket = require('./sockets/socket');

const cookieParser = require('cookie-parser');

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 5001;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://mohallamart.store',
        'https://www.mohallamart.store'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(helmet());
app.use(morgan('dev'));

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('MohallaMart API is running...');
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const communityRoutes = require('./routes/communityRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

// Config Socket.io
initSocket(httpServer);

// Start Server
const startServer = async () => {
    await connectDB();
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
