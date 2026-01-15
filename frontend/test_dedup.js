const io = require('socket.io-client');

// Helper to create object ID
const objectId = () => {
    return Math.floor(Math.random() * 16777215).toString(16).padEnd(24, '0');
};

const senderId = objectId();
const receiverId = objectId();

const socket = io('http://localhost:5001', {
    transports: ['websocket', 'polling'],
    reconnection: true
});

const tempId = `temp-${Date.now()}`;

socket.on('connect', () => {
    console.log('Connected');

    // Join sender room (logic in backend joins by userId)
    socket.emit('join', senderId);

    // Send message with tempId
    socket.emit('sendMessage', {
        senderId,
        receiverId,
        content: 'Test Deduplication',
        tempId
    });
});

socket.on('receiveMessage', (msg) => {
    if (msg.tempId === tempId) {
        console.log('SUCCESS: Received message with correct tempId');
        process.exit(0);
    } else {
        console.log('RECEIVED MESSAGE but tempId mismatch or missing:', msg);
    }
});

socket.on('messageError', (err) => {
    console.error('ERROR:', err);
    process.exit(1);
});

setTimeout(() => {
    console.error('TIMEOUT: Did not receive echo back');
    process.exit(1);
}, 5000);
