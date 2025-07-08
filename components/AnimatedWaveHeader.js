"use client";
import { motion } from "framer-motion";

const waveTransition = {
  repeat: Infinity,
  ease: "linear",
  duration: 12,
};

export default function AnimatedWaveHeader() {
  return (
    <div className="relative overflow-hidden h-48 z-0">
      <motion.div
        className="absolute bottom-0 left-0 flex w-[200%] h-full"
        animate={{ x: ["0%", "-50%"] }}
        transition={waveTransition}
        style={{ transform: "translateZ(0)" }}
      >
        <div
          className="w-1/2 h-full shrink-0"
          style={{
            backgroundImage: "url('/assets/images/banners/chatgpt2.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
            marginRight: "-1px",
          }}
        />
        <div
          className="w-1/2 h-full shrink-0"
          style={{
            backgroundImage: "url('/assets/images/banners/chatgpt2.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
        />
      </motion.div>
    </div>
  );
}










