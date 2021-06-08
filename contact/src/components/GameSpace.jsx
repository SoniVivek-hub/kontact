import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import Timer from "react-compound-timer";

export default function GameSpace({ socket }) {
  let stopTimer = useRef();
  let startTimer = useRef();
  let history = useHistory();
  const [dashes, setDashes] = useState();
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
      setDashes(" _".repeat(secretWordLength - revealedWord.length));
      setsecretWord(secretWord.toLowerCase());
      setshowSecretWordInput(true);
      alert(msg);
    });
  }
  function contactExpired() {
    socket.emit("contact-expired");
  }
  function makeContact() {
    console.log(contact, revealedWord);
    if (contact.codeWord.substring(0, revealedWord.length) === revealedWord) {
      socket.emit("make-contact", contact);
    } else {
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
    socket.on("start-15-timer", (name) => {
      setChats((prevChats) => {
        return [
          ...prevChats,
          `A guess has been made by ${name}, the gameMaster's time to guess has already started so hurry`,
        ];
      });
      setTrigger15(true);
      startTimer.current();
    });
    return () => {
      socket.off("start-15-timer");
    };
  });
  useEffect(() => {
    socket.on("contact-expired-reply", (contactWord) => {
      stopTimer.current();
      setshowMatchContact(false);
      setChats((prevChats) => {
        return [
          ...prevChats,
          `The contact word was ${contactWord}!, and time passed out and noone could guess it`,
        ];
      });
    });
    return () => {
      socket.off("contact-expired-reply");
    };
  });
  useEffect(() => {
    socket.on("set-revealed-word", (revealedWord, secretWordLength) => {
      setRevealedWord(revealedWord);
      setSecretWordLength(secretWordLength);
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
          setTrigger15(false);
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
  useEffect(() => {
    socket.on("reset-timer-reply", () => {
      if (trigger15) {
        setTrigger15(false);
        stopTimer.current();
        socket.emit("match-contact-direct");
      }
    });
    return () => {
      socket.off("reset-timer-reply");
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
        onStop={() => console.log("onStop hook")}
        checkpoints={[
          {
            time: 0,
            callback: () => {
              contactExpired();
            },
          },
          {
            time: 25000,
            callback: () => {
              //end of 15 timer emit this to the server
              socket.emit("reset-timer");
            },
          },
        ]}
      >
        {({ start, resume, pause, stop, reset, timerState }) => {
          stopTimer.current = () => {
            stop();
            setShowTimer(false);
            reset();
          };
          startTimer.current = () => {
            reset();
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
