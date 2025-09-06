"use client"

import { useState, useEffect } from "react"

// extract image progress value as JSON
// call setImageProgress() with extracted value


export const ProgressBar = () => {

const [imageProgress, setImageProgress] = useState(0)

console.log("running useEffect")
    // console.log("mounting websocket")
    // const webSocket = new WebSocket("ws://localhost:8000/ws");
    // webSocket.onopen = (event) => {
    //     console.log("✅ WebSocket opened:", webSocket.readyState); // should be 1 (OPEN)

    // }
    // webSocket.onmessage = (event) => {
    //     console.log(event.data);
    // }

useEffect(() => {
    console.log("mounting websocket")
    const webSocket = new WebSocket("ws://localhost:8000/ws");
    webSocket.onopen = (event) => {
        console.log("✅ WebSocket opened:", webSocket.readyState); // should be 1 (OPEN)
    }
    webSocket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log(data.progress);
            const percentCompleted = data.progress * 100;
            setImageProgress(percentCompleted)
        } catch (error) {
            console.log(event.data)
        }
    }
    // webSocket.close();
    return () => {
        console.log("Closing old socket");
        webSocket.close();
    };
}, []);
console.log("done running useEffect")


    return (
        <div>
            <label htmlFor="imageProgress">Image progress:</label>
            <progress id="imageProgress" max="100" value={imageProgress}></progress>
        </div>
    )
}