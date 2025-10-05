import { io } from 'socket.io-client';

// export const initSocket = async () => {
//     const options = {
//         'force new connection': true,
//         reconnectionAttempts: Infinity, // number, not string
//         timeout: 10000,
//         transports: ['websocket'],
//     };

//     if (!process.env.REACT_APP_BACKEND_URL) {
//         throw new Error("Backend URL not defined in .env");
//     }

//     return io(process.env.REACT_APP_BACKEND_URL, options);
// };
export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket'],
    };

    console.log('Connecting to backend:', process.env.REACT_APP_BACKEND_URL);

    const socket = io(process.env.REACT_APP_BACKEND_URL, options);

    socket.on('connect', () => {
        console.log('✅ Connected to socket server with id:', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Socket connection failed:', err.message);
    });

    return socket;
};

