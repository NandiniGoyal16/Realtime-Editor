import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: Infinity, // number, not string
        timeout: 10000,
        transports: ['websocket'],
    };

    if (!process.env.REACT_APP_BACKEND_URL) {
        throw new Error("Backend URL not defined in .env");
    }

    return io(process.env.REACT_APP_BACKEND_URL, options);
};
