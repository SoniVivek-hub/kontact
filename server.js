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
// const app = express();
// const server = require('http').Server(app)
// const io = require('socket.io')(server);

//this is the active rooms with all the details and the key as the roomCode

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
//       madeBy:,
//       contactWord:,
//       clue:,
//       thisContactTime:,
//       otherPlayerGuesses: [{name:,playerId:,guess:}],
//       gameMasterGuesses: [],
//     }
//   }
// }

//********************************************************************************** */

// activeRooms[roomCode] = {
//   roomCode: ,
//   gameMasterId: ,
//   time: ,
//   wordLength: ,
//   gameStarted: ,
//   checkDictionaryWords: ,
//   gameMasterCount:,
//   players: [
//     {
//       name: ,
//       id: ,
//     },
//   ],
// };

let activeGames = {};
let socketMapForHost = {};
let socketMapForPlayer = {};
let playerNames = {};

const removePlayer = async ({ playerId, socket }) => {
  if (socket === null || socket === undefined) {
    const sockets = await io.in(playerId).fetchSockets();
    socket = sockets[0];
  }
  socket.leave(socketMapForPlayer[playerId]);
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
  socket.emit("clear-data");
  delete socketMapForPlayer[playerId];
};

io.on("connection", (socket) => {
  //   console.log(socket.id);
  socket.on("game-created", (gameVars) => {
    if (socketMapForPlayer[socket.id]) {
      removePlayer({ playerId: socket.id, socket: socket });
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
    playerNames[socket.id] = gameVars.name;
    activeRooms[roomCode] = {
      roomCode: roomCode,
      gameMasterId: socket.id,
      contactExpireTime: parseInt(gameVars.contactExpireTime),
      gameTime: parseInt(gameVars.gameTime),
      gameMasterGuessTime: parseInt(gameVars.gameMasterGuessTime),
      wordLength: gameVars.wordLength,
      gameStarted: false,
      checkDictionaryWords: gameVars.checkDictionaryWords,
      gameMasterCount: 1,
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

  socket.on("player-joined", async (roomCode, name, sendAlert) => {
    roomCode = parseInt(roomCode);
    if (activeRooms[roomCode] && activeRooms[roomCode].gameStarted) {
      sendAlert("Game has already start,Please wait for it to finish.");
    } else if (activeRooms[roomCode]) {
      if (socketMapForPlayer[socket.id]) {
        removePlayer({ playerId: socket.id, socket: socket });
      }
      playerNames[socket.id] = name;
      socketMapForPlayer[socket.id] = roomCode;
      socket.join(roomCode);
      activeRooms[roomCode].players = [
        ...activeRooms[roomCode].players,
        { name: name, id: socket.id },
      ];
      await sendAlert("");
      io.in(roomCode).emit("game-hosted", activeRooms[roomCode]);
    } else {
      sendAlert("The room code is invalid");
    }
  });
  const events = ["player-left", "disconnect"];
  events.forEach((event) => {
    socket.on(event, () => {
      if (activeRooms[socketMapForPlayer[socket.id]] === undefined) {
        console.log(
          "room is not there and is undefined in reality as player might be kicked"
        );
      } else {
        console.log("yes you are right room is there bro");
        if (
          activeRooms[socketMapForPlayer[socket.id]].gameMasterId === socket.id
        ) {
          if (
            activeRooms[socketMapForPlayer[socket.id]].players[0].id ===
            socket.id
          ) {
            if (activeRooms[socketMapForPlayer[socket.id]].players.length > 1) {
              activeRooms[socketMapForPlayer[socket.id]].gameMasterId =
                activeRooms[socketMapForPlayer[socket.id]].players[1].id;
            }
          } else {
            activeRooms[socketMapForPlayer[socket.id]].gameMasterId =
              activeRooms[socketMapForPlayer[socket.id]].players[0].id;
          }
        }
        removePlayer({ playerId: socket.id, socket: socket });
      }
    });
  });
  socket.on("kick-player", async (playerId) => {
    if (activeRooms[socketMapForPlayer[playerId]].gameMasterId === playerId) {
      activeRooms[socketMapForPlayer[playerId]].gameMasterId =
        activeRooms[socketMapForPlayer[playerId]].players[0].id;
    }
    const sockets = await io.in(playerId).fetchSockets();
    sockets[0].emit("player-is-kicked");
    removePlayer({ playerId: playerId, socket: null });
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
      activeGames[socketMapForPlayer[socket.id]].revealedWord =
        secretWord.substr(0, 1);
      console.log(
        `the revealed word ${
          activeGames[socketMapForPlayer[socket.id]].revealedWord
        }`
      );
      io.in(socketMapForPlayer[socket.id]).emit(
        "set-revealed-word",
        activeGames[socketMapForPlayer[socket.id]].revealedWord,
        activeGames[socketMapForPlayer[socket.id]].gameMasterWord.length
      );
      io.in(socketMapForPlayer[socket.id]).emit("gamemaster-word-received");
    }
  });

  socket.on("make-contact", ({ codeWord, clue }) => {
    if (
      activeGames[socketMapForPlayer[socket.id]].currContactData === undefined
    ) {
      activeGames[socketMapForPlayer[socket.id]].currContactData = {
        madeBy: socket.id,
        contactWord: codeWord,
        clue: clue,
        thisContactTime: 10,
        otherPlayerGuesses: "",
        gameMasterGuesses: "",
        playerName: playerNames[socket.id],
      };
      io.in(socketMapForPlayer[socket.id]).emit(
        "display-code",
        playerNames[socket.id],
        clue
      );
    } else {
      //curr round is going on
    }
  });
  socket.on("match-contact", (guess) => {
    if (socket.id === activeRooms[socketMapForPlayer[socket.id]].gameMasterId) {
      activeGames[
        socketMapForPlayer[socket.id]
      ].currContactData.gameMasterGuesses = guess;
      let wasCorrect = false;
      if (
        guess ===
        activeGames[socketMapForPlayer[socket.id]].currContactData.contactWord
      ) {
        wasCorrect = true;
      }
      io.in(socketMapForPlayer[socket.id]).emit(
        "break-contact-attempt",
        wasCorrect,
        guess,
        activeGames[socketMapForPlayer[socket.id]].currContactData,
        activeGames[socketMapForPlayer[socket.id]].gameMasterWord
      );
      if (wasCorrect)
        activeGames[socketMapForPlayer[socket.id]].currContactData = undefined;
    } else {
      activeGames[
        socketMapForPlayer[socket.id]
      ].currContactData.otherPlayerGuesses = guess;
      console.log(
        activeGames[socketMapForPlayer[socket.id]].currContactData
          .otherPlayerGuesses
      );
      io.in(socketMapForPlayer[socket.id]).emit(
        "start-15-timer",
        playerNames[socket.id]
      );
    }
  });
  socket.on("match-contact-direct", () => {
    console.log(activeGames[socketMapForPlayer[socket.id]]);
    if (
      activeGames[socketMapForPlayer[socket.id]] &&
      activeGames[socketMapForPlayer[socket.id]].currContactData
    ) {
      guess =
        activeGames[socketMapForPlayer[socket.id]].currContactData
          .otherPlayerGuesses;
      let wasCorrect = false;
      // console.log(guess,activeG);
      if (
        guess ===
        activeGames[socketMapForPlayer[socket.id]].currContactData.contactWord
      ) {
        wasCorrect = true;
      }
      console.log(guess, wasCorrect, "plz say yes");
      io.in(socketMapForPlayer[socket.id]).emit(
        "make-contact-attempt",
        wasCorrect,
        guess,
        activeGames[socketMapForPlayer[socket.id]].currContactData,
        playerNames[socket.id],
        activeGames[socketMapForPlayer[socket.id]].gameMasterWord
      );
      activeGames[socketMapForPlayer[socket.id]].currContactData = undefined;
    }
  });

  socket.on("guess-word", async (gameMasterWordGuess) => {
    // console.log("got it");
    if (
      activeGames[socketMapForPlayer[socket.id]].gameMasterWord ===
      gameMasterWordGuess
    ) {
      io.in(socketMapForPlayer[socket.id]).emit(
        "game-over",
        playerNames[socket.id],
        gameMasterWordGuess
      );
      //game over new roud start
      activeGames[socketMapForPlayer[socket.id]] = {
        ...activeGames[socketMapForPlayer[socket.id]],
        gameMasterWord: "",
        revealedWord: "",
        currContactData: undefined,
      };
      let currGameMasterIndex;
      activeRooms[socketMapForPlayer[socket.id]].players.map((player, key) => {
        if (
          activeRooms[socketMapForPlayer[socket.id]].gameMasterId === player.id
        ) {
          currGameMasterIndex = key;
        }
      });
      console.log(currGameMasterIndex);
      if (
        activeRooms[socketMapForPlayer[socket.id]].gameMasterCount <
        activeRooms[socketMapForPlayer[socket.id]].players.length
      ) {
        activeRooms[socketMapForPlayer[socket.id]].gameMasterCount++;
        activeRooms[socketMapForPlayer[socket.id]].gameMasterId =
          activeRooms[socketMapForPlayer[socket.id]].players[
            (currGameMasterIndex + 1) %
              activeRooms[socketMapForPlayer[socket.id]].players.length
          ].id;
        console.log(activeRooms[socketMapForPlayer[socket.id]].gameMasterId);
        io.in(socketMapForPlayer[socket.id]).emit(
          "next-game-started",
          playerNames[activeRooms[socketMapForPlayer[socket.id]].gameMasterId]
        );
        io.in(socketMapForPlayer[socket.id]).emit(
          "update-game-space",
          activeGames[socketMapForPlayer[socket.id]]
        );
      } else {
        //game over take to waiting room
        activeRooms[socketMapForPlayer[socket.id]].gameStarted = false;
        delete activeGames[socketMapForPlayer[socket.id]];
        io.in(socketMapForPlayer[socket.id]).emit(
          "players-update",
          activeRooms[socketMapForPlayer[socket.id]]
        );
        io.in(socketMapForPlayer[socket.id]).emit(
          "game-ended-back-to-WR",
          activeRooms[socketMapForPlayer[socket.id]]
        );
      }
    } else {
      io.in(socketMapForPlayer[socket.id]).emit(
        "failed-guess",
        playerNames[socket.id],
        gameMasterWordGuess
      );
    }
  });
  socket.on("get-gameData", () => {
    if (
      socketMapForPlayer[socket.id] &&
      activeRooms[socketMapForPlayer[socket.id]]
    )
      socket.emit("players-update", activeRooms[socketMapForPlayer[socket.id]]);
  });
  socket.on("get-gameDataAndRoomData", () => {
    console.log(activeRooms[socketMapForPlayer[socket.id]]);
    socket.emit(
      "players-update-game-space",
      activeGames[socketMapForPlayer[socket.id]],
      activeRooms[socketMapForPlayer[socket.id]]
    );
  });
  socket.on("contact-expired", () => {
    if (activeGames[socketMapForPlayer[socket.id]].currContactData) {
      io.in(socketMapForPlayer[socket.id]).emit(
        "contact-expired-reply",
        activeGames[socketMapForPlayer[socket.id]].currContactData.contactWord
      );
      activeGames[socketMapForPlayer[socket.id]].currContactData = undefined;
    }
  });
  socket.on("reset-timer", () => {
    io.in(socketMapForPlayer[socket.id]).emit("reset-timer-reply");
  });

  socket.on("game-time-over", () => {
    if (
      activeRooms &&
      activeRooms[socketMapForPlayer[socket.id]] &&
      activeRooms[socketMapForPlayer[socket.id]].players &&
      socket.id === activeRooms[socketMapForPlayer[socket.id]].players[0].id
    ) {
      io.in(socketMapForPlayer[socket.id]).emit(
        "game-over",
        null,
        activeGames[socketMapForPlayer[socket.id]].gameMasterWord
      );
      //game over new roud start
      activeGames[socketMapForPlayer[socket.id]] = {
        ...activeGames[socketMapForPlayer[socket.id]],
        gameMasterWord: "",
        revealedWord: "",
        currContactData: undefined,
      };
      let currGameMasterIndex;
      activeRooms[socketMapForPlayer[socket.id]].players.map((player, key) => {
        if (
          activeRooms[socketMapForPlayer[socket.id]].gameMasterId === player.id
        ) {
          currGameMasterIndex = key;
        }
      });
      console.log(currGameMasterIndex);
      if (
        activeRooms[socketMapForPlayer[socket.id]].gameMasterCount <
        activeRooms[socketMapForPlayer[socket.id]].players.length
      ) {
        activeRooms[socketMapForPlayer[socket.id]].gameMasterCount++;
        activeRooms[socketMapForPlayer[socket.id]].gameMasterId =
          activeRooms[socketMapForPlayer[socket.id]].players[
            (currGameMasterIndex + 1) %
              activeRooms[socketMapForPlayer[socket.id]].players.length
          ].id;
        console.log(activeRooms[socketMapForPlayer[socket.id]].gameMasterId);
        io.in(socketMapForPlayer[socket.id]).emit(
          "next-game-started",
          playerNames[activeRooms[socketMapForPlayer[socket.id]].gameMasterId]
        );
        io.in(socketMapForPlayer[socket.id]).emit(
          "update-game-space",
          activeGames[socketMapForPlayer[socket.id]]
        );
      } else {
        //game over take to waiting room
        activeRooms[socketMapForPlayer[socket.id]].gameStarted = false;
        delete activeGames[socketMapForPlayer[socket.id]];
        io.in(socketMapForPlayer[socket.id]).emit(
          "players-update",
          activeRooms[socketMapForPlayer[socket.id]]
        );
        io.in(socketMapForPlayer[socket.id]).emit(
          "game-ended-back-to-WR",
          activeRooms[socketMapForPlayer[socket.id]]
        );
      }
    } else {
      //ignore timer end
      console.log("ignore call from timer");
    }
  });
});
instrument(io, {
  auth: false,
});
// const path = require("path");
// app.use(
//   express.static(path.join(__dirname, "./contact/build"))
// );
// app.get("*", function (req, res) {
//   res.sendFile(
//     path.join(__dirname, "./contact", "build", "index.html")
//   );
// });
// server.listen(process.env.PORT ||5000);
