const express = require("express");
const bodyParser = require("body-parser");
const io = require("socket.io")(5000, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

let activeRooms = {};
let socketMapForHost = {};
let socketMapForPlayer = {};

io.on("connection", (socket) => {
  //   console.log(socket.id);
  socket.on("game-created", (gameVars) => {
    if (socketMapForHost[socket.id]) {
      socket.leave(socketMapForHost[socket.id]);
      delete activeRooms[socketMapForHost[socket.id]];
      delete socketMapForHost[socket.id];
    }
    let roomCode;
    do {
      roomCode = toString(Math.floor(Math.random() * 900000 + 100000));
    } while (roomCode in activeRooms);
    socketMapForHost[socket.id] = roomCode;
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
    console.log(activeRooms, socketMapForHost);
    socket.emit("game-hosted", activeRooms[roomCode]);
  });

  socket.on("join-room", (roomCode, name, sendAlert) => {
    if (activeRooms[roomCode]) {
      if (socketMapForPlayer[socket.id]) {
        socket.leave(activeRooms[socketMapForPlayer[socket.id]].roomCode);
        activeRooms[socketMapForPlayer[socket.id]].players = activeRooms[socketMapForPlayer[socket.id]].players.filter((player) => {
          return player.id !== socket.id;
        })
        io.in(activeRooms[socketMapForPlayer[socket.id]].roomCode).emit(
          "player-left",
          activeRooms[socketMapForPlayer[socket.id]]
        );
      } 
      socketMapForPlayer[socket.id] = roomCode;
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
