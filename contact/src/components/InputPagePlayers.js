import React, { useState,useEffect } from "react";

export default function InputPagePlayers({ socket }) {
  function joinRoom() {
    console.log("ppp");
    socket.emit("player-joined", roomCode, name, () => {
      alert("the room code is invalid");
    });
  }

  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      ></input>
      <input
        type="text"
        value={roomCode}
        onChange={(e) => {
          setRoomCode(e.target.value);
        }}
      ></input>
      <button onClick={joinRoom}>Submit</button>
    </div>
  );
}
