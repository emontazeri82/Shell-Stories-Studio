"use client";

import { useEffect, useState } from "react";

export default function ProductSearch({ value, onChange }) {
  const [input, setInput] = useState(value || "");

  useEffect(() => {
    // 🕓 Debounce user input to avoid excessive queries
    const timer = setTimeout(() => {
      console.log("[ProductSearch] 🔍 Triggering search with query:", input);
      onChange?.(input); // safe call
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [input, onChange]);

  return (
    <input
      type="text"
      value={input}
      onChange={(e) => {
        console.log("[ProductSearch] ✏️ User typing:", e.target.value);
        setInput(e.target.value);
      }}
      placeholder="Search products by name"
      className="p-2 border rounded w-full"
    />
  );
}

