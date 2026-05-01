import { handleSubmitPrompt } from "./hooks/handle-submit-prompt"
import { Context } from "@/context/global-state"
import { useContext, useState } from "react"
// import { writeFile } from 'node:fs/promises';

export const ImagePromptBox = () => {
    const { 
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
        selectedImage,
        setSelectedImage,
        gallery,
        setGallery
    } = useContext(Context);

    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);

        const newAbortController = new AbortController()
        setAbortController(newAbortController)

        try {
            const result = await handleSubmitPrompt(prompt, samplingSteps, imageWidth, imageHeight, newAbortController.signal, webSocket);
            setSelectedImage(result.image);
            setGallery(prev => [result.image, ...prev].slice(0, 5));
            // writeFile(`${fullPrompt}.jpg`, result.image); // we are going to save it at the backend instead
        } catch (err) {
            setError("Failed to generate image. Please try again.");
            console.log("teetsack1"); 
            console.error(err); // TypeError: Cannot read properties of null (reading 'image')
            console.log(error); // "null"
            console.log("teetsack2"); 
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancelImage = () => {
        if (abortController) {
            abortController.abort() // sends abort signal to underlying request, which is the handleSubmitPrompt function
            setError("Image canceled")
            setImageProgress(0);
        }
    }

    return (
        <div className = "dark">
            <input
                value={prompt}
                placeholder="Enter your prompt here"
                onChange={(e) => { 
                    setPrompt(e.target.value);
                }}
                disabled={loading}
            />
            <button
                value="Enter prompt here..."
                onClick={() => {
                    console.log(`imageWidth: ${imageWidth} (type: ${typeof imageWidth})`);
                    console.log(`imageHeight: ${imageHeight} (type: ${typeof imageHeight})`)
                    handleGenerate();
                }}
                disabled={loading || !prompt.trim()}
            >
                {loading ? "Generating..." : "Generate Image"}
            </button>

            {loading && (
                <div>
                    <p>🎨 Creating your image... This may take 10-30 seconds</p>
                    <div>Progress: AI is thinking...</div>
                    <button
                        value="Cancel image"
                        onClick={handleCancelImage}
                    >
                         Cancel generation
                    </button>
                </div>
            )}

            {error && (
                <div style={{color: "red"}}>
                    Error: {error}
                </div>
            )}            
        </div>
    )
}