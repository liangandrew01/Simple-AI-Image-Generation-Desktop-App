import { Context } from "@/context/global-state"
import { useContext, useState, useEffect } from "react"

export const ImageGallery = () => {
    const {
    selectedImage,
    setSelectedImage,
    gallery,
    setGallery
    } = useContext(Context);
    
    const [fetchedImageMetadata, setFetchedImageMetadata] = useState([]);

    const fetchImageData = async () => {
        const response = await fetch('http://localhost:8000/fetchImageData');
        if (!response.ok) throw new Error('Failed to fetch images');
        const data = await response.json()
        return data;
    };

    // // see maddening Image gen 9 convo on how a function which contains an async function call returns a promise.
    // // useEffect expects its callback to return either nothing (undefined, which is the default if no return statement specified), or a cleanup function
    // // in the following example, the await makes the whole callback async and return a promise, which is neither of what useEffect expects, so it errors
    // useEffect(() => {
    //     const images = await fetchImageData();
    // }, []);
    // this is calling an async function synchronously >:O
    useEffect(() => {
        const fetchData = async () => {
        try {
            const data = await fetchImageData();
            setFetchedImageMetadata(data);
        } catch (err) {
            console.error(err);
        }
        };
        fetchData();
    }, [gallery]);



    return (
        <div className="flex flex-row"> 
            {/* {gallery.map((src, index) => ( 
                // when mapping over an array and the callback returns an <img>
                // JSX/React has a special rule: if you return an array of elements inside {} it will render them as children automatically, so multiple images will be rendered
                // second arg of map method callback is array index, so key is literally set to 0, 1, 2, 3...
                <img
                    src={src}
                    key={index}
                    className="w-[60px] h-auto object-contain opacity-80 hover:opacity-100 cursor-pointer"
                    onClick={() => setSelectedImage(src)}
                />
            ))} */}
            {fetchedImageMetadata.map((imageMetadata, index) => {
                const src = `http://localhost:8000/fetchImages/${imageMetadata.filename}`
                return (
                    <img
                        src={src}
                        key={index}
                        className="w-[60px] h-auto object-contain opacity-80 hover:opacity-100 cursor-pointer"
                        onClick={() => setSelectedImage(src)}                    
                    />
                );
            })}
            {/* <img 
                className="w-[60px] h-auto object-contain opacity-80 hover:opacity-100 cursor-pointer"
                src="https://picsum.photos/150" 
                alt="Placeholder"
                onClick={() => setSelectedImage("https://picsum.photos/150")}
            />
            <img
                className="w-[60px] h-auto object-contain opacity-80 hover:opacity-100 cursor-pointer"
                src="https://picsum.photos/150?random=2"
                alt="Random 2"
                onClick={() => setSelectedImage("https://picsum.photos/150?random=2")}/> */}
        </div>
    )
}