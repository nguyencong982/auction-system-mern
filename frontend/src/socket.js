import { io } from "socket.io-client";

// URL của Backend trên Render
const SOCKET_URL = "https://auction-system-mern-xeyx.onrender.com";

const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

// Kiểm tra kết nối để debug
socket.on("connect", () => {
    console.log("✅ Connected to Socket.io on Render:", socket.id);
});

socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
});

export default socket;