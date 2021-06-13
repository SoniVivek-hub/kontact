import React, { useState, useEffect } from "react";
import randomNames from "../names";
import { useHistory } from "react-router-dom";
export default function InputPagePlayers({ socket }) {
  let history = useHistory();
  function joinRoom() {
    console.log("ppp");
    socket.emit("player-joined", roomCode, name, (msg) => {
      if (msg !== "") alert(msg);
      else {
        history.push("/roomplayer");
      }
    });
  }

  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  useEffect(() => {
    setName(randomNames[Math.floor(Math.random() * randomNames.length)]);
  }, []);
  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value.toLowerCase());
        }}
      ></input>
      <input
        type="text"
        value={roomCode}
        onChange={(e) => {
          setRoomCode(e.target.value.toLowerCase());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "NumpadEnter") {
            joinRoom();
          }
        }}
      ></input>
      <button onClick={joinRoom}>Submit</button>
    </div>
  );
}
