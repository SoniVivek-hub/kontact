import React, { useState } from "react";
import { socket } from "socket.io";

export default function InputPagePlayers({ socket }) {
  function joinRoom() {
    console.log("ppp");
    socket.emit("join-room", roomCode, name, () => {
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
