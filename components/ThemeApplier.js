// components/ThemeApplier.js
"use client";

import useThemeMode from "@/hooks/useThemeMode";

export default function ThemeApplier({ children }) {
    useThemeMode(); // This manages theme syncing
    return children;
}

