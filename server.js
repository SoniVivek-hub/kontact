const express = require("express");
const bodyParser = require("body-parser");
const io = require("socket.io")(5000, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

let activeRooms = {};
let socketMap = {};

io.on("connection", (socket) => {
  //   console.log(socket.id);
  socket.on("game-created", (gameVars) => {
    if (socketMap[socket.id]) {
      socket.leave(socketMap[socket.id]);
      delete activeRooms[socketMap[socket.id]];
      delete socketMap[socket.id];
    }
    let roomCode;
    do {
      roomCode = Math.floor(Math.random() * 900000 + 100000);
    } while (roomCode in activeRooms);
    socketMap[socket.id] = roomCode;
    activeRooms[roomCode] = {
      roomCode: roomCode,
      hostName: gameVars.name,
      hostId: socket.id,
      time: gameVars.time,
      wordLength: gameVars.wordLength,
      checkDictWords: gameVars.checkDictionaryWords,
      players: [
        {
          name: gameVars.name,
          id: socket.id,
        },
      ],
    };
    socket.join(roomCode);
    console.log(activeRooms, socketMap);
    socket.emit("game-hosted", activeRooms[roomCode]);
  });

  socket.on("join-room", (roomCode, name, sendAlert) => {
    if (activeRooms[roomCode]) {
      socket.join(activeRooms[roomCode].roomCode);
      activeRooms[roomCode].players = [
        ...activeRooms[roomCode].players,
        { name: name, id: socket.id },
      ];
      io.in(activeRooms[roomCode].roomCode).emit(
        "game-hosted",
        activeRooms[roomCode]
      );
    } else {
      sendAlert();
    }
  });
});
