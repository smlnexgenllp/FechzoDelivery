import { io } from "socket.io-client";

// Get API URL from env
const API_URL = import.meta.env.VITE_API_URL;

// Remove "/api" from end
const SOCKET_URL = API_URL.replace("/api", "");

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

// Join delivery partner room
export const joinPartnerRoom = (partnerId) => {
  if (!partnerId) return;
  console.log(`Joining partner room: ${partnerId}`);
  socket.emit("joinPartner", partnerId);
};

// Listen for backend events
export const listenPartnerEvents = () => {
  socket.on("orderAssigned", (data) => {
    console.log("New order assigned:", data);
  });

  socket.on("orderStatusUpdated", (data) => {
    console.log("Order status updated:", data);
  });
};