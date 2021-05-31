const express = require("express");
const bodyParser = require("body-parser");
// const http=require("http")
const io = require("socket.io")(5000, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});
const app = express();

//this is the active rooms with all the details and the key as the roomCode
let activeRooms = {};
//these are the socketmaps which map the id of the socket to the roomcode which has all the info in active rooms
let socketMapForHost = {};
let socketMapForPlayer = {};

io.on("connection", (socket) => {
  //   console.log(socket.id);
  socket.on("game-created", (gameVars) => {
    if (socketMapForPlayer[socket.id]) {
      socket.leave(socketMapForPlayer[socket.id]);
      console.log(activeRooms);
        activeRooms[socketMapForPlayer[socket.id]].players = activeRooms[socketMapForPlayer[socket.id]].players.filter((player) => {
          return player.id !== socket.id;
        })
        io.in(activeRooms[socketMapForPlayer[socket.id]].roomCode).emit(
          "player-left",
          activeRooms[socketMapForPlayer[socket.id]]
        );
    }
    if (socketMapForHost[socket.id]) {
      socket.leave(socketMapForHost[socket.id]);
      delete activeRooms[socketMapForHost[socket.id]];
      delete socketMapForHost[socket.id];
    }
    
    let roomCode;
    do {
      roomCode = (Math.floor(Math.random() * 900000 + 100000));
    } while (roomCode in activeRooms);
    socketMapForHost[socket.id] = roomCode;
    socketMapForPlayer[socket.id] = roomCode;
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
    roomCode=parseInt(roomCode)
    if (activeRooms[roomCode]) {
      if (socketMapForPlayer[socket.id]) {
        socket.leave(activeRooms[socketMapForPlayer[socket.id]].roomCode);
        activeRooms[socketMapForPlayer[socket.id]].players = activeRooms[socketMapForPlayer[socket.id]].players.filter((player) => {
          return player.id !== socket.id;
        })
        // console.log(activeRooms[socketMapForPlayer[socket.id]].players)
        io.in(activeRooms[socketMapForPlayer[socket.id]].roomCode).emit(
          "player-left",
          activeRooms[socketMapForPlayer[socket.id]]
        );
      }
      if (socketMapForHost[socket.id]) {
        socket.leave(socketMapForHost[socket.id]);
        delete activeRooms[socketMapForHost[socket.id]];
        delete socketMapForHost[socket.id];
      }
      socketMapForPlayer[socket.id] = roomCode;
      socket.join(roomCode);
      activeRooms[roomCode].players = [
        ...activeRooms[roomCode].players,
        { name: name, id: socket.id },
      ];
      io.in(roomCode).emit(
        "game-hosted",
        activeRooms[roomCode]
      );
      
    } else {
      sendAlert();
    }
  });
});

// app.get("/", (req, res) => {
//   res.send("working like a charm");
// })
// app.listen(5000, () => {
//   console.log("server is listening on port 5000");
// })