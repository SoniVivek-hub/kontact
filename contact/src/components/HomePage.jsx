import React from 'react'
import {useHistory} from "react-router-dom"

export default function HomePage() {
    let history = useHistory();
    return (
        <div>
            <button className="red" onClick={() => {history.push("/startgame") }}>Create Game</button>
            <button onClick={() => { history.push("/inputpageplayer")}}>Join Game</button>
        </div>
    )
}

