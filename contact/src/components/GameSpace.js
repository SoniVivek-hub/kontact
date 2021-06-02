import React, { useState } from "react";

export default function GameSpace({ socket }) {
  const [secretWord, setsecretWord] = useState("");

  function giveSecretWord() {
    socket.emit("secret-word", secretWord, (mssg) => {
      alert(mssg);
    });
  }

  return (
    <div>
      <div>Chat Box</div>
      <input type="text"></input>
      <button type="submit">Submit clue</button>
      <input
        type="text"
        value={secretWord}
        onChange={(e) => setsecretWord(e.target.value)}
      ></input>
      <button type="submit" onClick={giveSecretWord}>
        Make contact/enter secret word
      </button>
      <input type="text"></input>
      <button type="submit">Match/break contact</button>
      <input type="text"></input>
      <button type="submit">Guess Word</button>
    </div>
  );
}
