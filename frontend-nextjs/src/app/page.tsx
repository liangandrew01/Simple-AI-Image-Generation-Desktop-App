"use client"

import { ImagePromptBox } from "@/components/prompt-input"
import { GlobalState } from "@/context/global-state"
import { ImageStyleSettings } from "@/components/image-style-settings" 
import { ParameterSliders } from "@/components/parameter-sliders"
import { ProgressBar } from "@/components/progress-bar"
import { ImageDisplayArea } from "@/components/image-display-area"
import { ImageGallery } from "@/components/image-gallery"
import { useTheme } from 'next-themes'

export default function Home() {
  // console.log("Home component loaded!");
  
  const {theme, setTheme} = useTheme();

  return (
    <div>
      <div className="h-screen grid grid-rows-[30px_1fr_30px] items-start justify-items-start min-h-screen font-[family-name:var(--font-geist-sans)]">
        <button onClick={() => setTheme(theme === "dark"? "light" : "dark")}>
          Toggle dark mode
        </button>
        <main className="flex flex-row gap-4 row-start-2 w-full p-10">
          <GlobalState>
            <div className="flex-1 p-4 flex flex-col gap-4 border border-black">
              <ImageStyleSettings />
              <ImagePromptBox />
              <ParameterSliders />
              <ProgressBar />
            </div>

            <div className="flex-1 p-4 flex justify-start items-start">
              <ImageDisplayArea />
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <ImageGallery />
            </div>
          </GlobalState>
        </main>
      </div>     
    </div>

  );
}
