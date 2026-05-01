"use client"
import { Context } from "@/context/global-state"
import { useState, useEffect, useContext } from "react"

// extract image progress value as JSON
// call setImageProgress() with extracted value


export const ProgressBar = () => {

    // const [imageProgress, setImageProgress] = useState(0)
    const { imageProgress, setImageProgress } = useContext(Context);
    const { webSocket } = useContext(Context);

    // wait until webSocket is established
    useEffect(() => {
        if (!webSocket) return; 
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
    }, [webSocket]);


    // // moving to global state because need accessible by multiple components: progress bar AND  abort controller
    // useEffect(() => {
    //     console.log("mounting websocket")
    //     const webSocket = new WebSocket("ws://localhost:8000/ws");
    //     webSocket.onopen = (event) => {
    //         console.log("✅ WebSocket opened:", webSocket.readyState); // should be 1 (OPEN)
    //     }
    //     webSocket.onmessage = (event) => {
    //         try {
    //             const data = JSON.parse(event.data);
    //             console.log(data.progress);
    //             const percentCompleted = data.progress * 100;
    //             setImageProgress(percentCompleted)
    //         } catch (error) {
    //             console.log(event.data)
    //         }
    //     }
    //     // webSocket.close();
    //     return () => {
    //         console.log("Closing old socket");
    //         webSocket.close();
    //     };
    // }, []);
    // console.log("done running useEffect")


    return (
        <div>
            <label htmlFor="imageProgress">Image progress:</label>
            <progress id="imageProgress" max="100" value={imageProgress}></progress>
        </div>
    )
}