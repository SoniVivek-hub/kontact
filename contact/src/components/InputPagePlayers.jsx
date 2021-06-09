import React, { useState, useEffect } from "react";
import axios from "axios";
import randomTypeOfName from "../typeOfNamesLink";
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
  useEffect(async () => {
    axios
      .get(
        `http://names.drycodes.com/1?nameOptions=${
          randomTypeOfName[Math.floor(Math.random() * randomTypeOfName.length)]
        }&separator=space`
      )
      .then((response) => {
        console.log(response.data);
        setName(response.data[0]);
      })
      .catch((err) => {
        console.log(err);
        console.log("couldn't get the name from api");
      });
  }, []);
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
