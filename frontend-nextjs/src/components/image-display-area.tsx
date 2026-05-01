import { Context } from "@/context/global-state"
import { useContext, useState, useEffect } from "react"

export const ImageDisplayArea = () => {
    const {
    fullPrompt,
    imageWidth,
    setImageWidth,
    imageHeight,
    setImageHeight,
    selectedImage,
    setSelectedImage,
    gallery,
    setGallery
    } = useContext(Context);
    
    const [isResizing, setIsResizing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startSize, setStartSize] = useState({ width: Number(imageWidth), height: Number(imageHeight) });

    const MIN_SIZE = 50;
    const MAX_SIZE = 512;

    useEffect(() => {
        const handleMove = (e) => {
            if (!isResizing) return;
            const dx = e.clientX - startPos.x;
            const dy = e.clientY - startPos.y;
            
            // ✅ Snap to nearest multiple of 8
            let newWidth = startSize.width + dx;
            let newHeight = startSize.height + dy;

            newWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newWidth));
            newHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newHeight));

            // ✅ Snap to nearest multiple of 8
            newWidth = Math.round(newWidth / 8) * 8;
            newHeight = Math.round(newHeight / 8) * 8;

            setImageWidth(newWidth.toString());
            setImageHeight(newHeight.toString());
            console.log(imageWidth);
            console.log(imageHeight);
        };

        const handleUp = () => setIsResizing(false);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [isResizing, startPos, startSize]);

    return (
        <div style={{ position: 'relative', width: '512px', height: 'auto' }}>
            <h3>Generated Image:</h3>
            
            {/* selected image */}
            {selectedImage && (
                <div>
                    <img
                        src={selectedImage}
                        alt="Generated"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            maxWidth: '512px',
                            height: 'auto',
                            display: 'block',
                            zIndex: 2,
                        }}
                    />
                </div>
            )}

            {/* Overlay grid preview */}
            <div
                onMouseDown={(e) => {
                    setIsResizing(true);
                    setStartPos({ x: e.clientX, y: e.clientY });
                    setStartSize({ width: Number(imageWidth), height: Number(imageHeight) });
                    // console.log(startPos.x);
                    // console.log(startPos.y);
                    // console.log(startSize.width);
                    // console.log(startSize.height);

                }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)',
                    backgroundSize: '20px 20px',
                    cursor: isResizing ? 'grabbing' : 'grab',
                    zIndex: 1,
                }}
            />
            <a href={selectedImage} download={`${fullPrompt}.png`}>
                Download
            </a>               
        </div>
    )
}