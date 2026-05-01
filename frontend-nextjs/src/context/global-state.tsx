"use client"

import { createContext } from 'react'
import { useState, useEffect } from "react"
import type { Dispatch, SetStateAction } from "react";

// define shape of the context/state
interface ImageGenContext {
  prompt: string
  setPrompt: Dispatch<SetStateAction<string>>
  fullPrompt: string
  setFullPrompt: Dispatch<SetStateAction<string>>
  samplingSteps: string
  setSamplingSteps: Dispatch<SetStateAction<string>>
  imageWidth: string
  setImageWidth: Dispatch<SetStateAction<string>>
  imageHeight: string
  setImageHeight: Dispatch<SetStateAction<string>>
  webSocket: WebSocket | null
  imageProgress: number
  setImageProgress: Dispatch<SetStateAction<number>>
  abortController: AbortController | null
  setAbortController: Dispatch<SetStateAction<AbortController | null>>
  error: string
  setError: Dispatch<SetStateAction<string>>
  selectedImage: string,
  setSelectedImage: Dispatch<SetStateAction<string>>
  gallery: string[]
  setGallery: Dispatch<SetStateAction<string[]>>
}

// starts the whole thing. Declare values that will be passed and their defaults (if no other values are provided)
export const Context = createContext<ImageGenContext>({ 
  prompt: "",
  setPrompt: () => {}, // setPrompt will default to an arrow function that takes prompt and returns {} aka nothing
  fullPrompt: "",
  setFullPrompt: () => {},
  samplingSteps: "",
  setSamplingSteps: () => {},
  imageWidth: "",
  setImageWidth: () => {},
  imageHeight: "",
  setImageHeight: () => {},
  webSocket: null,
  imageProgress: 0,
  setImageProgress: () => {},
  abortController: null,
  setAbortController: () => {},
  error: "",
  setError: () => {},
  selectedImage: null,
  setSelectedImage: () => {},
  gallery: [],
  setGallery: () => {}
});


export const GlobalState = ({ children }) => {
    const [prompt, setPrompt] = useState<string>(""); // declare actual state variables and their setter functions with defaults. These will override the createContext defaults
    const [fullPrompt, setFullPrompt] = useState<string>("");
    const [samplingSteps, setSamplingSteps] = useState<string>("13");
    const [imageWidth, setImageWidth] = useState<string>("384");
    const [imageHeight, setImageHeight] = useState<string>("384");
    const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
    const [imageProgress, setImageProgress] = useState<number>(0);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>(null);
    const [error, setError] = useState<string>(null);
    const [gallery, setGallery] = useState<string[]>([]);

    // moving to global state because need accessible by multiple components: progress bar AND  abort controller
    useEffect(() => {
        console.log("mounting websocket")
        const webSocket = new WebSocket("ws://127.0.0.1:8000/ws"); // production
        // const webSocket = new WebSocket("ws://localhost:8000/ws"); // development
        setWebSocket(webSocket);
        webSocket.onopen = (event) => {
            console.log("✅ WebSocket opened:", webSocket.readyState); // should be 1 (OPEN)
        }
        webSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // console.log(data.progress);
                // const percentCompleted = data.progress * 100;
                // setImageProgress(percentCompleted)
            } catch (error) {
                console.log(event.data)
            }
        }
        // whatvever is stored as the return function acts as a cleanup function that fires upon unmounting
        return () => {
            setTimeout(() => console.log("Closing old socket"), 0);
            webSocket.close();
        };
    }, []);
    console.log("done running useEffect")

    return (
        <Context.Provider // load the feeder with useState values. You can pass them because createContext expects them
            value={{
                prompt,
                setPrompt,
                fullPrompt,
                setFullPrompt,
                samplingSteps,
                setSamplingSteps,
                imageWidth,
                setImageWidth,
                imageHeight,
                setImageHeight,
                webSocket,
                imageProgress,
                setImageProgress,
                abortController,
                setAbortController,
                error,
                setError,
                selectedImage,
                setSelectedImage,
                gallery,
                setGallery
            }}
        >
            {children}
        </Context.Provider>
    )
}

