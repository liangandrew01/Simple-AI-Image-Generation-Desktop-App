import { Context } from "@/context/global-state"
import { useState, useContext } from "react"

const imageStyles = [
    {
        style: "",
        modifiedPrompt: "",
        model: ""
    },
    {
        style: "photorealistic",
        modifiedPrompt: " in a photorealistic style",
        model: ""
    },
        {
        style: "anime",
        modifiedPrompt: " in the anime style",
        model: ""
    },
        {
        style: "cartoon",
        modifiedPrompt: " in a cartoon style",
        model: ""
    },
        {
        style: "artistic",
        modifiedPrompt: " in an artistic style",
        model: ""
    }
]

export const ImageStyleSettings = () => {

    const [imageStyle, setImageStyle] = useState("");
    const { prompt, setPrompt } = useContext(Context);
    const { fullPrompt, setFullPrompt } = useContext(Context);

    return (
        <div>
            <p>Select preset image style:</p>
            <select onChange={(e) => {
                const selectedStyle = imageStyles.find(styleParams => styleParams.style === e.target.value);
                setImageStyle(selectedStyle.style);
                setFullPrompt(prompt + selectedStyle.modifiedPrompt)
            }}>
                {imageStyles.map((imageStyleParams) => {
                    return (
                        <option key={imageStyleParams.style} value={imageStyleParams.style}>
                            {imageStyleParams.style}
                        </option>
                    )
                })}
            </select>
            <div>
                {/* {"imageStyle: " + imageStyle}<br /> */}
                {"prompt: " + prompt}<br />
                {/* {"fullPrompt: " + fullPrompt}<br /> */}
            </div>
        </div>

    )
}