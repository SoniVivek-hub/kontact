import React from 'react'

export default function StartGame() {
    return (
        <div>
            <h1>Enter the display name</h1>
            <div>
                <label>Time to guess</label>
                <input type="number"></input>
                <label>Total length</label>
                <input type="number"></input>
            </div>
            <input type="radio"></input>
            <label>Check for dictionary words</label>
            <buton>Create Game</buton>
        </div>
    )
}
