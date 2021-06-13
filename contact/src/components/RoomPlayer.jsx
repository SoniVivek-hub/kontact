import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";

export default function RoomPlayer({ socket }) {
  let history = useHistory();
  const [gameData, setGameData] = useState({});
  useEffect(() => {
    socket.on("game-hosted", (gameData) => {
      setGameData(gameData);
    });
    return () => {
      socket.off("game-hosted");
    };
  });
  useEffect(() => {
    socket.on("players-update", (gameData) => {
      setGameData(gameData);
      return () => {
        socket.off("players-update");
      };
    });
  });
  useEffect(() => {
    socket.emit("get-gameData");
  }, []);
  useEffect(() => {
    socket.on("player-is-kicked", () => {
      console.log("kicked bro");
      alert("you were kicked");
      history.push("/");
    });
    return () => {
      socket.off("player-is-kicked");
    };
  });
  useEffect(() => {
    socket.on("send-alert-for-game-started", () => {
      alert("the host has started the game");
      history.push("/gamespace");
    });
    return () => {
      socket.off("send-alert-for-game-started");
    };
  });
  useEffect(() => {
    socket.on("clear-data", () => {
      setGameData({});
      history.push("/");
    });
    return () => {
      socket.off("clear-data");
    };
  });
  function leaveRoom() {
    socket.emit("player-left");
    history.push("/");
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
      {gameData.players &&
        gameData.players[0].id === socket.id &&
        gameData.players.length >= 3 && (
          <button onClick={startGame}>Start game</button>
        )}
      {gameData.players &&
        gameData.players[0].id === socket.id &&
        gameData.players.length < 3 && (
          <button onClick={startGame} disabled>
            Start game
          </button>
        )}

      {gameData.players && <button onClick={leaveRoom}>Leave Room</button>}
    </div>
  );
}
