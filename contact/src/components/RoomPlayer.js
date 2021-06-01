import React, { useEffect, useState } from "react";

export default function RoomPlayer({ socket }) {
  const [gameData, setGameData] = useState({});
  useEffect(() => {
    socket.once("game-hosted", (gameData) => {
      console.log(gameData);
      setGameData(gameData);
    });
  });
  useEffect(() => {
    socket.once("players-update", (gameData) => {
      console.log(gameData);
      setGameData(gameData);
    });
  });
  useEffect(() => {
    socket.once("player-is-kicked", () => {
      alert("you were kicked");
      setGameData({});
    });
  });
  function leaveRoom() {
    socket.emit("player-left", () => {
      alert("left successfully");
      setGameData({});
    });
  }
  function kickPlayer(playerId) {
    socket.emit("kick-player", playerId);
  }

  function makeGameMaster(playerId) {
    socket.emit("make-gamemaster", playerId);
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
      <button>Waiting for host to start the game</button>
      <button onClick={leaveRoom}>Leave Room</button>
    </div>
  );
}
