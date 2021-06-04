import React, { useState, useEffect } from "react";

export default function GameSpace({ socket }) {
  const [secretWord, setsecretWord] = useState("");
  const [revealedWord, setRevealedWord] = useState("");
  const [contact, setContact] = useState({ codeWord: null, clue: null });
  const [chats, setChats] = useState([]);
  const [guess, setGuess] = useState("");
  function giveSecretWord() {
    socket.emit("secret-word", secretWord, (msg) => {
      alert(msg);
    });
  }
  function makeContact() {
    socket.emit("make-contact", contact);
  }
  function matchContact() {
    socket.emit("match-contact", guess);
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
    socket.on("break-contact-attempt", (wasCorrect, guess, currContactData) => {
      if (wasCorrect) {
        setChats((prevChats) => {
          return [
            ...prevChats,
            `The Game master successfully matched the contact word ${currContactData.contactWord}!`,
          ];
        });
      } else {
        setChats((prevChats) => {
          return [
            ...prevChats,
            `Game Master tried to match the contact with ${guess}`,
          ];
        });
      }
    });
    return () => {
      socket.off("break-contact-attempt");
    };
  });

  useEffect(() => {
    socket.on(
      "make-contact-attempt",
      (wasCorrect, guess, currContactData, name) => {
        if (wasCorrect) {
          setChats((prevChats) => {
            return [
              ...prevChats,
              `${name} successfully matched the contact word ${currContactData.contactWord}!`,
            ];
          });
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
      <input type="text"></input>
      <button type="submit">Guess Word</button>
    </div>
  );
}
