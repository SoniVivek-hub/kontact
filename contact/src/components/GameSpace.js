import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import Timer from "react-compound-timer";

export default function GameSpace({ socket }) {
  const stopTimer = useRef(null);
  const startTimer = useRef(null);
  const [dashes, setDashes] = useState();
  let history = useHistory();
  const [secretWord, setsecretWord] = useState("");
  const [revealedWord, setRevealedWord] = useState("");
  const [showWaiting, setShowWaiting] = useState(true);
  const [contact, setContact] = useState({ codeWord: null, clue: null });
  const [chats, setChats] = useState([]);
  const [guess, setGuess] = useState("");
  const [gameMasterWordGuess, setGameMasterWordGuess] = useState("");
  const [roomData, setRoomData] = useState({});
  const [gameData, setGameData] = useState({});
  const [showTimer, setShowTimer] = useState(false);
  const [showMatchContact, setshowMatchContact] = useState(false);
  const [showSecretWordInput, setshowSecretWordInput] = useState(true);
  const [secretWordLength, setSecretWordLength] = useState(0);
  const [trigger15, setTrigger15] = useState(false);
  function giveSecretWord() {
    setshowSecretWordInput(false);
    socket.emit("secret-word", secretWord.toLowerCase(), (msg) => {
      setshowSecretWordInput(true);
      setsecretWord(secretWord.toLowerCase());
      // console.log(secretWord.length - revealedWord.length);
      setDashes(" _".repeat(secretWordLength - revealedWord.length));
      alert(msg);
    });
  }
  function makeContact() {
    console.log(contact, revealedWord);
    if (contact.codeWord.substring(0, revealedWord.length) === revealedWord) {
      socket.emit("make-contact", contact);
    } else {
      alert("the word must start with the secret word");
    }
  }

  // function

  function matchContact() {
    // socket.emit("match-contact", guess);
    socket.emit("start-timer"); //15 second timer start
  }
  function guessWord() {
    socket.emit("guess-word", gameMasterWordGuess);
  }
  function contactExpire() {
    socket.emit("contact-expire");
  }
  function gameMasterTimeExpire() {
    if (trigger15) {
      socket.emit("match-contact", guess);
      stopTimer.current();
      setTrigger15(false);
    }
  }
  useEffect(() => {
    socket.on("start-timer-reply", () => {
      setTrigger15(true);
      stopTimer.current();
      startTimer.current();
    });
    return () => {
      socket.off("start-timer-reply");
    };
  });
  useEffect(() => {
    socket.on("contact-expire-get-contact", (contactWord) => {
      stopTimer.current();
      setshowMatchContact(false);
      setChats((prevChats) => {
        return [
          ...prevChats,
          `The contact word ${contactWord} expired! No new letter was revealed.`,
        ];
      });
    });
    return () => {
      socket.off("contact-expire-get-contact");
    };
  });
  useEffect(() => {
    socket.on("set-revealed-word", (revealedWord, secretWordLength) => {
      setRevealedWord(revealedWord);
      setSecretWordLength(secretWordLength);
      // console.log(secretWord.length - revealedWord.length);
      setDashes(" _".repeat(secretWordLength - revealedWord.length));
      setShowWaiting(false);
    });
    return () => {
      socket.off("set-revealed-word");
    };
  });
  useEffect(() => {
    socket.emit("get-gameDataAndRoomData");
  }, []);
  useEffect(() => {
    socket.on("players-update-game-space", (gameData, roomData) => {
      setRoomData(roomData);
      setGameData(gameData);
      console.log(roomData, gameData);
    });
    return () => {
      socket.off("players-update-game-space");
    };
  }, []);
  useEffect(() => {
    socket.on("update-game-space", (gameVars) => {
      setRevealedWord(gameVars.revealedWord);
      console.log(secretWord.length - revealedWord.length);
      setDashes(" _".repeat(secretWordLength - revealedWord.length));
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
      setShowWaiting(true);
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
          stopTimer.current();
          setshowMatchContact(false);
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
          stopTimer.current();
          setshowMatchContact(false);
          setChats((prevChats) => {
            return [
              ...prevChats,
              `${name} successfully matched the contact word ${currContactData.contactWord}!`,
            ];
          });
          setRevealedWord(gameMasterWord.substring(0, revealedWord.length + 1));
          console.log(secretWord.length - revealedWord.length);
          setDashes(" _".repeat(secretWordLength - revealedWord.length));
        } else {
          setChats((prevChats) => {
            setshowMatchContact(false);
            stopTimer.current();
            socket.emit("get-gameDataAndRoomData");
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
      setshowMatchContact(true);
      socket.emit("get-gameDataAndRoomData");
      startTimer.current();
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

  if (showWaiting && socket.id !== roomData.gameMasterId) {
    return <h1>Waiting for GameMaster to enter the secret word</h1>;
  }

  return (
    <>
      <Timer
        initialTime={40000}
        startImmediately={false}
        direction="backward"
        checkpoints={[
          {
            time: 0,
            callback: () => {
              contactExpire();
            },
          },
          {
            time: 25,
            callback: () => {
              alert("fjldskafl");
              gameMasterTimeExpire();
            },
          },
        ]}
      >
        {({ start, resume, pause, stop, reset, timerState }) => {
          stopTimer.current = () => {
            stop();
            reset();
            setShowTimer(false);
          };
          startTimer.current = () => {
            start();
            setShowTimer(true);
          };
          return (
            <>
              {showTimer && (
                <div>
                  {!trigger15 ? (
                    <Timer.Seconds />
                  ) : (
                    <Timer.Seconds formatValue={(value) => value - 25} />
                  )}
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

      <div>
        {revealedWord} {dashes}
      </div>

      {showSecretWordInput && roomData && roomData.gameMasterId === socket.id && (
        <>
          <input
            type="text"
            value={secretWord}
            onChange={(e) => setsecretWord(e.target.value)}
          ></input>
          <button type="submit" onClick={giveSecretWord}>
            Enter secret word
          </button>
        </>
      )}
      {!showMatchContact && roomData && roomData.gameMasterId !== socket.id && (
        <>
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
        </>
      )}
      {showMatchContact &&
        gameData.currContactData &&
        gameData.currContactData.madeBy !== socket.id && (
          <>
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
              {roomData &&
                (roomData.gameMasterId !== socket.id
                  ? "Match Contact"
                  : "Break Contact")}
            </button>
          </>
        )}
      {roomData && roomData.gameMasterId !== socket.id && (
        <>
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
        </>
      )}
    </>
  );
}
