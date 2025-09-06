"use client"

import { Context } from "@/context/global-state"
import { useEffect, useContext } from "react"

export const ParameterSliders = () => {

    const { samplingSteps, setSamplingSteps } = useContext(Context);
    
    // useEffect(() => {
    //     const input = document.querySelector<HTMLInputElement>("#sampling_steps");
    //     const value = document.querySelector<HTMLOutputElement>("#value");
    //     value.textContent = input.value;
    //     input.addEventListener("input", (e) => {
    //         value.textContent = e.target.value;
    //     })
    // }, [])

    return (
        <div>
            <input
                type="range"
                id="sampling_steps"
                name="sampling_steps"
                min="1"
                max="25"
                value={samplingSteps}
                step="1"
                onChange={(e) => {
                    setSamplingSteps(e.target.value);
                }}
            />
            <p>Sampling steps: <output id="value">{samplingSteps}</output></p>
        </div>
    )
}