"use client";
import { useEffect, useState } from "react";
import FavoriteWindows from "./FavoriteWindows";

const FRAME_COUNT = 25;
const FRAME_RATE = 4;

export default function ShellAnimation() {
  const [frame, setFrame] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (frame >= FRAME_COUNT - 1) {
      setAnimationComplete(true);
      return;
    }

    const intervalId = setInterval(() => {
      setFrame((prev) => {
        if (prev >= FRAME_COUNT - 1) {
          clearInterval(intervalId);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / FRAME_RATE);

    return () => clearInterval(intervalId);
  }, [frame]);

  const bgUrl = `/assets/images/animations/shell-frames/shell_frame_${String(Math.min(frame, FRAME_COUNT - 1)).padStart(2, "0")}.png`;

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-transparent overflow-hidden">
      {/* Shell Animation */}
      <div className="absolute w-[80vmin] h-[80vmin] max-w-[500px] max-h-[500px]">
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat transition-all duration-100 ease-linear"
          style={{ backgroundImage: `url(${bgUrl})` }}
        />

        {/* Pulse Effect */}
        {animationComplete && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 rounded-full bg-white/20 animate-pulseRing"></div>
          </div>
        )}
      </div>

      {/* Favorite Images expanding from center of shell image */}
      {animationComplete && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <FavoriteWindows />
        </div>
      )}
    </div>
  );
}











