const express = require("express");
const bodyParser = require("body-parser");
const { instrument } = require("@socket.io/admin-ui");
const checkWord = require("check-word");
const words = checkWord("en");
const io = require("socket.io")(5000, {
  cors: {
    origin: ["http://localhost:3000", "https://admin.socket.io"],
  },
});
const app = express();

let activeRooms = {};

// let activeGames={
//   roomcode:{
//     gameMasterWord:,
//     roundTime:,
//     checkForDictionary:,
//     wordLength:,
//     revealedWord:,
//     guessedWords:,
//     currContactData:{
//       playerChosenWord:,
//       hint:,
//       thisContactTime:,
//       otherPlayerGuesses: [{name:,guess:}],
//       gameMasterGuesses: [],
//     }
//   }
// }

let activeGames = {};

let socketMapForHost = {};
let socketMapForPlayer = {};

const removePlayer = async (playerId) => {
  const sockets = await io.in(playerId).fetchSockets();
  sockets[0].leave(socketMapForPlayer[playerId]);
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
    socketMapForPlayer[socket.id] = roomCode;
    activeRooms[roomCode] = {
      roomCode: roomCode,
      gameMasterId: socket.id,
      time: gameVars.time,
      wordLength: gameVars.wordLength,
      gameStarted: false,
      checkDictionaryWords: gameVars.checkDictionaryWords,
      players: [
        {
          name: gameVars.name,
          id: socket.id,
        },
      ],
    };
    socket.join(roomCode);
    socket.emit("game-hosted", activeRooms[roomCode]);
  });

  socket.on("player-joined", (roomCode, name, sendAlert) => {
    roomCode = parseInt(roomCode);
    if (activeRooms[roomCode] && activeRooms[roomCode].gameStarted) {
      sendAlert("Game has already start,Please wait for it to finish.");
    } else if (activeRooms[roomCode]) {
      if (socketMapForPlayer[socket.id]) {
        removePlayer(socket.id);
      }
      socketMapForPlayer[socket.id] = roomCode;
      socket.join(roomCode);
      activeRooms[roomCode].players = [
        ...activeRooms[roomCode].players,
        { name: name, id: socket.id },
      ];
      io.in(roomCode).emit("game-hosted", activeRooms[roomCode]);
    } else {
      sendAlert("The room code is invalid");
    }
  });

  socket.on("player-left", (alertPlayer) => {
    if (activeRooms[socketMapForPlayer[socket.id]].gameMasterId === socket.id) {
      if (
        activeRooms[socketMapForPlayer[socket.id]].players[0].id === socket.id
      ) {
        if (activeRooms[socketMapForPlayer[socket.id]].players.size > 1) {
          activeRooms[socketMapForPlayer[socket.id]].gameMasterId =
            activeRooms[socketMapForPlayer[socket.id]].players[1].id;
        }
      } else {
        activeRooms[socketMapForPlayer[socket.id]].gameMasterId =
          activeRooms[socketMapForPlayer[socket.id]].players[0].id;
      }
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

  socket.on("start-game", (sendAlert) => {
    activeRooms[socketMapForPlayer[socket.id]].gameStarted = true;
    activeGames[socketMapForPlayer[socket.id]] = {
      roundTime: activeRooms[socketMapForPlayer[socket.id]].time,
      checkDictionaryWords:
        activeRooms[socketMapForPlayer[socket.id]].checkDictionaryWords,
      wordLength: activeRooms[socketMapForPlayer[socket.id]].wordLength,
    };
    console.log(activeGames);
    io.in(socketMapForPlayer[socket.id]).emit("send-alert-for-game-started");
  });

  socket.on("secret-word", (secretWord, sendAlert) => {
    console.log(`Secret word : ${secretWord}`);
    console.log(activeGames);
    console.log(
      activeGames[socketMapForPlayer[socket.id]].wordLength,
      secretWord.length
    );
    if (
      secretWord.length >
      parseInt(activeGames[socketMapForPlayer[socket.id]].wordLength)
    ) {
      sendAlert("The word exceeds the maximum word length!");
    } else if (
      activeGames[socketMapForPlayer[socket.id]].checkDictionaryWords &&
      !words.check(secretWord)
    ) {
      //check if dictionary if not sendAlert() for the mistake
      sendAlert(
        "The word is not a dictionary word! Please use only dictionary words"
      );
    } else {
      activeGames[socketMapForPlayer[socket.id]].gameMasterWord = secretWord;
      io.in(socketMapForPlayer[socket.id]).emit("gamemaster-word-received");
    }
  });
});

instrument(io, {
  auth: false,
});
//app.get("/", (req, res) => {
//res.send("working like a charm");
// })
// app.listen(5000, () => {
//   console.log("server is listening on port 5000");
// })
