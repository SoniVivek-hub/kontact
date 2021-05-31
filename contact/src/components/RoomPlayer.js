import React, { useState } from "react";

export default function RoomPlayer({ socket }) {
  const [gameData, setGameData] = useState({});
  socket.on("game-hosted", (gameData) => {
    console.log(gameData);
    setGameData(gameData);
  });
  return (
    <div>
      <h1>Room Code</h1>
      <div>{gameData.roomCode}</div>
      <h2>Players</h2>
      <div>
        {gameData.players &&
          gameData.players.map((player, key) => {
            return <p key={key}>{player.name}</p>;
          })}
      </div>
      <button>Waiting for host to start the game</button>
    </div>
  );
}
