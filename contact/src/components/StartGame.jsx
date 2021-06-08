import React, { useState } from "react";
import { useHistory } from "react-router-dom";

export default function StartGame({ socket }) {
  let history = useHistory();
  const [time, setTime] = useState(5);
  const [name, setName] = useState("");
  const [wordLength, setWordLength] = useState(5);
  const [checkDictionaryWords, setCheckDictionaryWords] = useState(true);
  function initaliseGame() {
    const gameData = {
      time: time,
      name: name,
      wordLength: wordLength,
      checkDictionaryWords: checkDictionaryWords,
    };
    socket.emit("game-created", gameData);
    history.push("/roomplayer");
  }
  return (
    <div>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        ></input>
        <button>Edit name</button>
      </div>
      <div>
        <label>Time to guess</label>
        <input
          type="number"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
          }}
        ></input>
        <label>Total length</label>
        <input
          type="number"
          value={wordLength}
          onChange={(e) => {
            setWordLength(e.target.value);
          }}
        ></input>
      </div>
      <input
        type="checkbox"
        checked={checkDictionaryWords}
        onChange={(e) => {
          setCheckDictionaryWords(e.target.checked);
        }}
      ></input>
      <label>Check for dictionary words</label>
      <button onClick={initaliseGame}>Create Game</button>
    </div>
  );
}
