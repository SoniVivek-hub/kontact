import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import randomNames from "../names";

export default function StartGame({ socket }) {
  let history = useHistory();
  const [contactExpireTime, setContactExpireTime] = useState(40);
  const [name, setName] = useState("");
  const [gameMasterGuessTime, setGameMasterGuessTime] = useState(15);
  const [gameTime, setGameTime] = useState(6);
  const [wordLength, setWordLength] = useState(5);
  const [checkDictionaryWords, setCheckDictionaryWords] = useState(true);
  function initaliseGame() {
    const gameData = {
      contactExpireTime: contactExpireTime,
      name: name,
      wordLength: wordLength,
      checkDictionaryWords: checkDictionaryWords,
      gameMasterGuessTime: gameMasterGuessTime,
      gameTime: gameTime,
    };
    socket.emit("game-created", gameData);
    history.push("/roomplayer");
  }
  useEffect(() => {
    setName(randomNames[Math.floor(Math.random() * randomNames.length)]);
  }, []);

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
      </div>
      <div>
        <label>Contact expire time</label>
        <input
          type="number"
          value={contactExpireTime}
          onChange={(e) => {
            setContactExpireTime(e.target.value);
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
        <label>Enter gameMaster guess time</label>
        <input
          type="number"
          value={gameMasterGuessTime}
          onChange={(e) => {
            setGameMasterGuessTime(e.target.value);
          }}
        />
        <label>Enter the Game Time</label>
        <input
          type="number"
          value={gameTime}
          onChange={(e) => {
            setGameTime(e.target.value);
          }}
        />
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
