import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Timer from "react-compound-timer";

export default function GameSpace({ socket }) {
  let stopTimer;
  let startTimer;
  let history = useHistory();
  const [secretWord, setsecretWord] = useState("");
  const [revealedWord, setRevealedWord] = useState("");
  const [contact, setContact] = useState({ codeWord: null, clue: null });
  const [chats, setChats] = useState([]);
  const [guess, setGuess] = useState("");
  const [gameMasterWordGuess, setGameMasterWordGuess] = useState("");
  const [roomData, setRoomData] = useState({});
  const [gameData, setGameData] = useState({});
  const [showTimer, setShowTimer] = useState(false);
  const [showMakeContact, setShowMakeContact] = useState(true);
  function giveSecretWord() {
    socket.emit("secret-word", secretWord, (msg) => {
      alert(msg);
    });
  }
  function makeContact() {
    console.log(contact, revealedWord);
    if (contact.codeWord.substring(0, revealedWord.length) === revealedWord) {
      socket.emit("make-contact", contact);
    }
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
    socket.emit("get-gameDataAndRoomData");
  }, []);
  useEffect( () => {
    socket.on("players-update-game-space", (gameData,roomData) => {
      setRoomData(roomData);
      setGameData(gameData);
      console.log(roomData,gameData);
      if (gameData && gameData.currContactData) {
        alert(gameData.currContactData.madeBy);
      }
    });
    return () => {
      socket.off("players-update-game-space");
    };
  }, []);
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
      socket.emit("get-gameDataAndRoomData");
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
          stopTimer();
          setShowMakeContact(false);
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
          stopTimer();
          setShowMakeContact(false);
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
      setShowMakeContact(true);
      socket.emit("get-gameDataAndRoomData");
      startTimer();
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
    <>
    <Timer initialTime={40000} startImmediately={false} direction="backward">
      {({ start, resume, pause, stop, reset, timerState }) => {
        stopTimer = () => {
          stop();
          setShowTimer(false);
        };
        startTimer = () => {
          start();
          setShowTimer(true);
        };
        return (
          <>
            {showTimer && (
              <div>
                <Timer.Seconds /> seconds
              </div>
            )}
            </>
        );
      }}
    </Timer>

            <br />
            <div>Chat Box</div>
            <div>
              {chats.map((chat, key) => {
                return <p key={key}>{chat}</p>;
              })}
            </div>
            <div>{revealedWord}</div>
      {roomData && roomData.gameMasterId === socket.id &&
        (<>
            <input
              type="text"
              value={secretWord}
              onChange={(e) => setsecretWord(e.target.value)}
            ></input>
            <button type="submit" onClick={giveSecretWord}>
          Enter secret word
            </button>
        </>)
      }
      {roomData && roomData.gameMasterId !== socket.id &&
        (<>
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
            <button
              type="submit"
              onClick={() => {
                makeContact();
              }}
            >
          Make Contact
            </button>
        </>)}
      {(showMakeContact && gameData.currContactData && (gameData.currContactData.madeBy !== socket.id)) &&
        (<>
            <input
              type="text"
              value={guess}
              onChange={(e) => {
                setGuess(e.target.value);
              }}
            ></input>
            <button
              type="submit"
              onClick={() => {
                matchContact();
              }}
            >
          {roomData && (roomData.gameMasterId !== socket.id?"Match Contact":"Break Contact")}
        </button>
      </>)}
      {roomData && roomData.gameMasterId !== socket.id &&
        (<>
            <input
              type="text"
              onChange={(e) => {
                setGameMasterWordGuess(e.target.value);
              }}
            ></input>
            <button
              type="submit"
              onClick={() => {
                guessWord();
              }}
            >
          Guess Word
            </button>
        </>)}
          </>
  );
}
