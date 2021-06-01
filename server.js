const express = require("express");
const bodyParser = require("body-parser");
const { instrument } = require("@socket.io/admin-ui");
// const http=require("http")
const io = require("socket.io")(5000, {
  cors: {
    origin: ["http://localhost:3000", "https://admin.socket.io"],
  },
});
const app = express();

let activeRooms = {};
let socketMapForHost = {};
let socketMapForPlayer = {};

const removePlayer = async (playerId) => {
  console.log(`The player : ${playerId}`);
  const sockets = await io.in(playerId).fetchSockets();
  console.log(sockets);
  sockets[0].leave(socketMapForPlayer[playerId]);
  // console.log(activeRooms);
  activeRooms[socketMapForPlayer[playerId]].players = activeRooms[
    socketMapForPlayer[playerId]
  ].players.filter((player) => {
    return player.id !== playerId;
  });
  if (activeRooms[socketMapForPlayer[playerId]].players.size === 0) {
    delete activeRooms[socketMapForHost[playerId]];
  } else {
    io.in(activeRooms[socketMapForPlayer[playerId]].roomCode).emit(
      "players-update",
      activeRooms[socketMapForPlayer[playerId]]
    );
  }
  delete socketMapForPlayer[playerId];
};

io.on("connection", (socket) => {
  //   console.log(socket.id);
  socket.on("game-created", (gameVars) => {
    if (socketMapForPlayer[socket.id]) {
      removePlayer(socket.id);
    }
    // if (socketMapForHost[socket.id]) {
    //   socket.leave(socketMapForHost[socket.id]);
    //   delete activeRooms[socketMapForHost[socket.id]];
    //   delete socketMapForHost[socket.id];
    // }

    let roomCode;
    do {
      roomCode = Math.floor(Math.random() * 900000 + 100000);
    } while (roomCode in activeRooms);
    // socketMapForHost[socket.id] = roomCode;
    socketMapForPlayer[socket.id] = roomCode;
    activeRooms[roomCode] = {
      roomCode: roomCode,
      // hostName: gameVars.name,
      // hostId: socket.id,
      gameMasterId: socket.id,
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

  socket.on("player-joined", (roomCode, name, sendAlert) => {
    roomCode = parseInt(roomCode);
    if (activeRooms[roomCode]) {
      if (socketMapForPlayer[socket.id]) {
        removePlayer(socket.id);
      }
      // if (socketMapForHost[socket.id]) {
      //   socket.leave(socketMapForHost[socket.id]);
      //   delete activeRooms[socketMapForHost[socket.id]];
      //   delete socketMapForHost[socket.id];
      // }
      socketMapForPlayer[socket.id] = roomCode;
      socket.join(roomCode);
      activeRooms[roomCode].players = [
        ...activeRooms[roomCode].players,
        { name: name, id: socket.id },
      ];
      io.in(roomCode).emit("game-hosted", activeRooms[roomCode]);
    } else {
      sendAlert();
    }
  });

  socket.on("player-left", (alertPlayer) => {
    if (activeRooms[socketMapForPlayer[socket.id]].gameMasterId === socket.id) {
      activeRooms[socketMapForPlayer[socket.id]].gameMasterId =
        activeRooms[socketMapForPlayer[socket.id]].players[0].id;
    }
    removePlayer(socket.id);
    alertPlayer();
  });

  socket.on("kick-player", async (playerId) => {
    if (activeRooms[socketMapForPlayer[playerId]].gameMasterId === playerId) {
      activeRooms[socketMapForPlayer[playerId]].gameMasterId =
        activeRooms[socketMapForPlayer[playerId]].players[0].id;
    }
    const sockets = await io.in(playerId).fetchSockets();
    sockets[0].emit("player-is-kicked");
    removePlayer(playerId);
  });

  socket.on("make-gamemaster", (playerId) => {
    activeRooms[socketMapForPlayer[playerId]].gameMasterId = playerId;
    io.in(activeRooms[socketMapForPlayer[playerId]].roomCode).emit(
      "players-update",
      activeRooms[socketMapForPlayer[playerId]]
    );
  });
});

instrument(io, {
  auth: false,
});
// app.get("/", (req, res) => {
//   res.send("working like a charm");
// })
// app.listen(5000, () => {
//   console.log("server is listening on port 5000");
// })
