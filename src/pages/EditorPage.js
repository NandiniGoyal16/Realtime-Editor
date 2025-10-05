import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        // Prevent multiple socket initialization
        if (socketRef.current) return;

        const init = async () => {
            try {
                const socket = await initSocket();
                if (!socket) return;
                socketRef.current = socket;

                // Error handling
                socket.on('connect_error', handleErrors);
                socket.on('connect_failed', handleErrors);

                function handleErrors(e) {
                    console.error('Socket error:', e);
                    toast.error('Socket connection failed. Try again later.');
                    navigate('/');
                }

                // Join the room
                socket.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                // When a new client joins
                socket.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                    // Avoid showing yourself twice
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);

                    // Sync code with newly joined client
                    socket.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                });

                // When a client disconnects
                socket.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients(prev =>
                        prev.filter(client => client.socketId !== socketId)
                    );
                });
            } catch (err) {
                console.error('Socket initialization failed:', err);
                toast.error('Socket initialization failed.');
                navigate('/');
            }
        };

        init();

        return () => {
            // Cleanup socket on component unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            }
        };
    }, [roomId, location.state, navigate]);

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    };

    const leaveRoom = () => {
        navigate('/');
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/rembg-logo.png" alt="logo" />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map(client => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={code => {
                        codeRef.current = code;
                    }}
                />
            </div>
        </div>
    );
};

export default EditorPage;
