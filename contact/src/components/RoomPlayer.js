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
    socket.once("player-left", gameData => {
      console.log(gameData);
      setGameData(gameData);
    })
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
