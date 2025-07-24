"use client";

import dynamic from "next/dynamic";

// Dynamically load ReactPlayer only on client
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function Background() {
  try {
    return (
      <div className="w-full h-full">
        <ReactPlayer
          url="/assets/videos/underwater.mp4"
          playing
          loop
          muted
          width="100%"
          height="100%"
          config={{
            file: {
              attributes: {
                playsInline: true,
                style: {
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                },
              },
            },
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>
    );
  } catch (err) {
    console.error("ReactPlayer failed:", err);
    return (
      <div className="text-red-500">
        Failed to load background video.
      </div>
    );
  }
}

