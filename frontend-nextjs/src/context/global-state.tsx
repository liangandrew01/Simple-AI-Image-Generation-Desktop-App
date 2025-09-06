"use client"

import { createContext } from 'react'
import { useState } from "react"

// starts the whole thing. Declare values that will be passed and their defaults (if no other values are provided)
export const Context = createContext({ 
  prompt: "",
  setPrompt: (prompt: string) => {}, // setPrompt will default to an arrow function that takes prompt and returns {} aka nothing
  fullPrompt: "",
  setFullPrompt: (fullPrompt: string) => {},
  samplingSteps: "",
  setSamplingSteps: (samplingSteps: string) => {},
  abortController: null,
  setAbortController: (abortController: any) => {},
});


export const GlobalState = ({ children }) => {
    const [prompt, setPrompt] = useState<string>(""); // declare actual state variables and their setter functions with defaults. These will override the createContext defaults
    const [fullPrompt, setFullPrompt] = useState<string>("");
    const [ samplingSteps, setSamplingSteps ] = useState("13");
    const [ abortController, setAbortController ] = useState(null);
    return (
        <Context.Provider // load the feeder with useState values. You can pass them because createContext expects them
            value={{
                prompt,
                setPrompt,
                fullPrompt,
                setFullPrompt,
                samplingSteps,
                setSamplingSteps,
                abortController,
                setAbortController
            }}
        >
            {children}
        </Context.Provider>
    )
}

