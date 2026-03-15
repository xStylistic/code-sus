import { io } from "socket.io-client";
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  socket.emit("joinRoom", { roomId: "test1", playerName: "Bot" });
});

socket.on("roomState", (state) => {
  if (state.state === "lobby") {
    socket.emit("setReady", true);
  }
});

socket.on("playerReady", () => {
    socket.emit("startGame");
});

socket.on("roomState", (state) => {
  if (state.state === "in_game") {
    console.log("Got layout ID:", state.map.id);
    socket.disconnect();
    process.exit(0);
  }
});
