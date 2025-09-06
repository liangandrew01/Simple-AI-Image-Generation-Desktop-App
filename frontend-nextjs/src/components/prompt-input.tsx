import { handleSubmitPrompt } from "./hooks/handle-submit-prompt"
import { Context } from "@/context/global-state"
import { useContext, useState } from "react"

export const ImagePromptBox = () => {
    const { prompt, setPrompt } = useContext(Context);
    const { fullPrompt, setFullPrompt } = useContext(Context);
    const { samplingSteps, setSamplingSteps } = useContext(Context);
    const { abortController, setAbortController } = useContext(Context);
    const [ loading, setLoading ] = useState(false);
    const [ generatedImage, setGeneratedImage ] = useState(null);
    const [ error, setError ] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);

        const newAbortController = new AbortController()
        setAbortController(newAbortController)

        try {
            const result = await handleSubmitPrompt(prompt, samplingSteps, newAbortController.signal);
            setGeneratedImage(result.image);
        } catch (err) {
            setError("Failed to generate image. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancelImage = () => {
        if (abortController) {
            abortController.abort() // sends abort signal to underlying request, which is the handleSubmitPrompt function
            
        }
    }

    return (
        <div>
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
                    console.log("Button clicked!");
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

            {/* equivalent to {generatedImage ? (  <div>...</div>) : null} */}
            {generatedImage && (
                <div>
                    <h3>Generated Image:</h3>
                    <img
                        src={generatedImage}
                        alt="Generated"
                        style={{maxWidth: '512px', height: 'auto'}}
                    />
                </div>
            )}

            <a href={generatedImage} download={`${fullPrompt}.png`}>
                Download
            </a>
            
        </div>
    )
}