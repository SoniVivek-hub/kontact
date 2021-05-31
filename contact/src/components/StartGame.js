import React,{useState} from 'react'

export default function StartGame({socket}) {
    const [time, setTime] = useState(0);
    const[name,setName]=useState("");
    const[wordLength,setWordLength]=useState("");
    const[checkDictionaryWords,setCheckDictionaryWords]=useState(false);
    function initaliseGame(){
        const gameData = {
            time: time,
            name: name,
            wordLength: wordLength,
            checkDictionaryWords: checkDictionaryWords
        };
        socket.emit("game-created", gameData);
    }
    return (
        <div>
            <div>
                <input type="text" value={name} onChange={(e)=>{
                    setName(e.target.value);
                }}></input>
                <button>Edit name</button>
            </div>
            <div>
                <label>Time to guess</label>
                <input type="number" value={time} onChange={(e)=>{
                    setTime(e.target.value);
                }}></input>
                <label>Total length</label>
                <input type="number" value={wordLength} onChange={(e)=>{
                    setWordLength(e.target.value);
                }}></input>
            </div>
            <input type="radio" value={checkDictionaryWords} onChange={(e)=>{
                    setCheckDictionaryWords(e.target.value);
                }}></input>
            <label>Check for dictionary words</label>
            <button onClick={initaliseGame}>Create Game</button>
        </div>
    )
}
