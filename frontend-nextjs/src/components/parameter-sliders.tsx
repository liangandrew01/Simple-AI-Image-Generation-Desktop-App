"use client"

import { Context } from "@/context/global-state"
import { useEffect, useContext } from "react"

export const ParameterSliders = () => {

    const { 
        samplingSteps, 
        setSamplingSteps, 
        imageWidth,
        setImageWidth,
        imageHeight,
        setImageHeight,
    } = useContext(Context);


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
            {/* sampling steps */}
            <div className="flex items-center mb-2">
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
                <label htmlFor="sampling_steps_input">Sampling steps:</label>
                <input
                    type="number"
                    id="sampling_steps_input"
                    min="1"
                    max="25"
                    value={samplingSteps}
                    step="1"
                    onChange={(e) => {
                        setSamplingSteps(e.target.value);
                    }}
                    style={{ width: '60px', marginLeft: '8px' }}
                />
            </div>

            {/* image width */}
            <div className="flex items-center mb-2">
                <input
                    type="range"
                    id="image_width"
                    name="image_width"
                    min="0"
                    max="512"
                    value={imageWidth}
                    step="8"
                    onChange={(e) => {
                        setImageWidth(e.target.value);
                    }}
                />
                <label htmlFor="image_width_input">Image width (px):</label>
                <input
                    type="number"
                    id="image_width_input"
                    min="0"
                    max="512"
                    value={imageWidth}
                    step="8"
                    onChange={(e) => {
                        setImageWidth(e.target.value);
                    }}
                    style={{ width: '60px', marginLeft: '8px' }}
                />
            </div>
            
            {/* image height */}
            <div className="flex items-center mb-2">
                <input
                    type="range"
                    id="image_height"
                    name="image_height"
                    min="0"
                    max="512"
                    value={imageHeight}
                    step="8"
                    onChange={(e) => {
                        setImageHeight(e.target.value);
                    }}
                />
                <label htmlFor="image_height_input">Image height (px): </label>
                <input
                    type="number"
                    id="image_height_input"
                    min="0"
                    max="512"
                    value={imageHeight}
                    step="8"
                    onChange={(e) => {
                        setImageHeight(e.target.value);
                    }}
                    style={{ width: '60px', marginLeft: '8px' }}
                />
            </div>

        </div>
    )
}