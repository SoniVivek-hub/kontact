import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

export default function GameSpace({ socket }) {
  let history = useHistory();
  const [secretWord, setsecretWord] = useState("");
  const [revealedWord, setRevealedWord] = useState("");
  const [contact, setContact] = useState({ codeWord: null, clue: null });
  const [chats, setChats] = useState([]);
  const [guess, setGuess] = useState("");
  const [gameMasterWordGuess, setGameMasterWordGuess] = useState("");
  function giveSecretWord() {
    socket.emit("secret-word", secretWord, (msg) => {
      alert(msg);
    });
  }
  function makeContact() {
    console.log(contact, revealedWord);
    if (contact.codeWord.substring(0, revealedWord.length) === revealedWord)
      socket.emit("make-contact", contact);
    else {
      alert("the word must start with the secret word");
    }
  }
  function matchContact() {
    socket.emit("match-contact", guess);
  }
  function guessWord() {
    socket.emit("guess-word", gameMasterWordGuess);
  }
  useEffect(() => {
    socket.on("set-revealed-word", (revealedWord) => {
      setRevealedWord(revealedWord);
    });
    return () => {
      socket.off("set-revealed-word");
    };
  });
  useEffect(() => {
    socket.on("update-game-space", (gameVars) => {
      setRevealedWord(gameVars.revealedWord);
      setsecretWord("");
      if (gameVars.currContactData === undefined) {
        setContact({});
      } else {
        setContact({
          clue: gameVars.currContactData,
          codeWord: gameVars.currContactData.contactWord,
        });
      }
      setGuess("");
      setGameMasterWordGuess("");
    });
    return () => {
      socket.off("update-game-space");
    };
  });
  useEffect(() => {
    socket.on("gamemaster-word-received", () => {
      setChats((prevChats) => {
        return [...prevChats, "The gamemaster has entered the word!"];
      });
    });
    return () => {
      socket.off("gamemaster-word-received");
    };
  });
  useEffect(() => {
    socket.on("game-over", (playerName, gameMasterWordGuess) => {
      alert(
        `game over game master's word -"${gameMasterWordGuess}" has been guessed by ${playerName}`
      );
    });
    return () => {
      socket.off("game-over");
    };
  });
  useEffect(() => {
    socket.on("next-game-started", (gameMasterName) => {
      alert(`New game has started with ${gameMasterName} as the game master`);
      setChats([]);
    });
    return () => {
      socket.off("next-game-started");
    };
  });
  useEffect(() => {
    socket.on("failed-guess", (playerName, gameMasterWordGuess) => {
      setChats((prevChats) => {
        return [
          ...prevChats,
          `${playerName} failed to guess the secret word with ${gameMasterWordGuess}`,
        ];
      });
    });
    return () => {
      socket.off("failed-guess");
    };
  });
  useEffect(() => {
    socket.on(
      "break-contact-attempt",
      (wasCorrect, guess, currContactData, gameMasterWord) => {
        if (wasCorrect) {
          setChats((prevChats) => {
            return [
              ...prevChats,
              `The Game master successfully matched the contact word ${currContactData.contactWord}!`,
            ];
          });

          // alert(revealed)
        } else {
          setChats((prevChats) => {
            return [
              ...prevChats,
              `Game Master tried to match the contact with ${guess}`,
            ];
          });
        }
      }
    );
    return () => {
      socket.off("break-contact-attempt");
    };
  });

  useEffect(() => {
    socket.on(
      "make-contact-attempt",
      (wasCorrect, guess, currContactData, name, gameMasterWord) => {
        if (wasCorrect) {
          setChats((prevChats) => {
            return [
              ...prevChats,
              `${name} successfully matched the contact word ${currContactData.contactWord}!`,
            ];
          });
          setRevealedWord(gameMasterWord.substring(0, revealedWord.length + 1));
        } else {
          setChats((prevChats) => {
            return [
              ...prevChats,
              `${name} tried to match ${guess} with ${currContactData.contactWord}`,
            ];
          });
        }
      }
    );
    return () => {
      socket.off("make-contact-attempt");
    };
  });

  useEffect(() => {
    socket.on("display-code", (name, clue) => {
      setChats((prevChats) => {
        return [...prevChats, `${name} made a contact with the clue ${clue}!`];
      });
    });
    return () => {
      socket.off("display-code");
    };
  });

  useEffect(() => {
    socket.on("game-ended-back-to-WR", (gameData) => {
      history.push("/roomplayer");
    });
    return () => {
      socket.off("game-ended-back-to-WR");
    };
  });

  return (
    <div>
      <div>Chat Box</div>
      <div>
        {chats.map((chat, key) => {
          return <p key={key}>{chat}</p>;
        })}
      </div>
      <div>{revealedWord}</div>
      <input
        type="text"
        value={secretWord}
        onChange={(e) => setsecretWord(e.target.value)}
      ></input>
      <button type="submit" onClick={giveSecretWord}>
        Enter secret word
      </button>
      <input
        type="text"
        placeholder="Enter clue"
        value={contact.clue}
        onChange={(e) => {
          setContact((prevValue) => {
            return {
              ...prevValue,
              clue: e.target.value,
            };
          });
        }}
      ></input>
      <input
        type="text"
        placeholder="Enter the contact word"
        value={contact.codeWord}
        onChange={(e) => [
          setContact((prevValue) => {
            return {
              ...prevValue,
              codeWord: e.target.value,
            };
          }),
        ]}
      ></input>
      <button type="submit" onClick={makeContact}>
        Make Contact
      </button>
      <input
        type="text"
        value={guess}
        onChange={(e) => {
          setGuess(e.target.value);
        }}
      ></input>
      <button type="submit" onClick={matchContact}>
        Match/break contact
      </button>
      <input
        type="text"
        onChange={(e) => {
          setGameMasterWordGuess(e.target.value);
        }}
      ></input>
      <button type="submit" onClick={guessWord}>
        Guess Word
      </button>
    </div>
  );
}
