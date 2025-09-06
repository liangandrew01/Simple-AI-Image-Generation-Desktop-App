"use client"

import { Context } from "@/context/global-state"
import { useContext } from "react"

// const handleCancelImage = () => {
//     if (abortController) {
//         abortController.abort()
//     }
// }

export const handleSubmitPrompt = async (prompt, samplingSteps, signal) => {
    console.log(prompt);
    console.log(samplingSteps)
    console.log(JSON.stringify({
        prompt: prompt,
        samplingSteps: samplingSteps
    }))

    try {
        const response = await fetch('http://localhost:8000/generate', {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                samplingSteps: samplingSteps
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
        if (error.name === 'AbortError') {
            console.error('Error:', error);
            return null;
        } else {
            console.error('Error:', error);
            throw error;
        }
    }
};