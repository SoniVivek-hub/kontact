import React, { useEffect, useState } from "react";

export default function RoomPlayer({ socket }) {
  const [gameData, setGameData] = useState({});
  useEffect(() => {
    socket.on("game-hosted", (gameData) => {
      console.log(gameData);
      setGameData(gameData);
    });
    return () => {
      socket.off("game-hosted");
    };
  });
  useEffect(() => {
    socket.on("players-update", (gameData) => {
      console.log(gameData);
      setGameData(gameData);
      return () => {
        socket.off("players-update");
      };
    });
  });
  useEffect(() => {
    socket.on("player-is-kicked", () => {
      alert("you were kicked");
    });
    return () => {
      socket.off("player-is-kicked");
    };
  });
  useEffect(() => {
    socket.on("send-alert-for-game-started", () => {
      alert("the host has started the game");
    });
    return () => {
      socket.off("send-alert-for-game-started");
    };
  });
  useEffect(() => {
    socket.on("clear-data", () => {
      setGameData({});
    });
    return () => {
      socket.off("clear-data");
    };
  });
  function leaveRoom() {
    socket.emit("player-left", () => {
      alert("left successfully");
    });
  }
  function kickPlayer(playerId) {
    socket.emit("kick-player", playerId);
  }

  function makeGameMaster(playerId) {
    socket.emit("make-gamemaster", playerId);
  }
  function startGame() {
    socket.emit("start-game");
  }
  return (
    <div>
      <h1>Room Code</h1>
      <div>{gameData.roomCode}</div>
      <h2>Players</h2>
      <div>
        {gameData.players &&
          gameData.players.map((player, key) => {
            return (
              <div key={key}>
                <p key={key}>
                  {player.name}
                  {key === 0 ? "(host)" : null}
                  {gameData.gameMasterId === player.id ? "(game master)" : null}
                </p>
                {gameData.players[0].id === socket.id && key !== 0 ? (
                  <button
                    onClick={() => {
                      // alert(`The player : ${player.id}`);
                      kickPlayer(player.id);
                    }}
                  >
                    kick this bitch
                  </button>
                ) : null}
                {gameData.players[0].id === socket.id &&
                gameData.gameMasterId !== player.id ? (
                  <button
                    onClick={() => {
                      makeGameMaster(player.id);
                    }}
                  >
                    Make gameMaster{" "}
                  </button>
                ) : null}
              </div>
            );
          })}
      </div>
      {gameData.players && gameData.players[0].id !== socket.id ? (
        <button disabled>Waiting for host to start the game</button>
      ) : null}
      {gameData.players && gameData.players[0].id === socket.id ? (
        <button onClick={startGame}>Start game</button>
      ) : null}

      {gameData.players && <button onClick={leaveRoom}>Leave Room</button>}
    </div>
  );
}
