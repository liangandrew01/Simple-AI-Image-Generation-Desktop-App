"use client"

import { Context } from "@/context/global-state"
import { useContext } from "react"

// const handleCancelImage = () => {
//     if (abortController) {
//         abortController.abort()
//     }
// }

export const handleSubmitPrompt = async (prompt, samplingSteps, imageWidth, imageHeight, signal, webSocket) => {
    console.log(prompt);
    console.log(samplingSteps);
    console.log(imageWidth);
    console.log(imageHeight);
    console.log(0);
    console.log(JSON.stringify({
        prompt: prompt,
        samplingSteps: samplingSteps,
        imageWidth: imageWidth,
        imageHeight: imageHeight,
    }))


    try {
        const response = await fetch('http://localhost:8000/generate', {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                samplingSteps: samplingSteps,
                imageHeight: imageHeight,
                imageWidth: imageWidth,
            }),
            signal,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log("Backend response:", data)
        return data;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log("handle-submit-prompt: catch error from /fetch")
            console.error('Error:', error); // "Error: AbortError: signal is aborted without reason at handleCancelImage"
            // setError(error);
            webSocket.send(JSON.stringify({ type: "abort" })) 
            return "testi";
        } else {
            console.error('Error:', error);
            throw error;
        }
    }
};