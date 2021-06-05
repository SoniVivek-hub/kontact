import React, { useState, useEffect } from "react";
import {useHistory} from "react-router-dom"
export default function InputPagePlayers({ socket }) {
  let history = useHistory();
  function joinRoom() {
    console.log("ppp");
    socket.emit("player-joined", roomCode, name, (msg) => {
      if(msg!=="")
        alert(msg);
      else {
        history.push("/roomplayer");
      }
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
