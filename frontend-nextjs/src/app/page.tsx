"use client"

import { ImagePromptBox } from "@/components/prompt-input"
import { GlobalState } from "@/context/global-state"
import { ImageStyleSettings } from "@/components/image-style-settings" 
import { ParameterSliders } from "@/components/parameter-sliders"
import { ProgressBar } from "@/components/progress-bar"


export default function Home() {
  // console.log("Home component loaded!");
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <GlobalState>
          <ImageStyleSettings />
          <ParameterSliders />
          <ImagePromptBox />
          <ProgressBar />
        </GlobalState>
      </main>
    </div>
  );
}
