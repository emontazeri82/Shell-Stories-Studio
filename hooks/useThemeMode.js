// hooks/useThemeMode.js
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setTheme } from "@/redux/slices/themeSlice";

export default function useThemeMode() {
  const mode = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored && stored !== mode) {
      dispatch(setTheme(stored));
    }
  }, [dispatch, mode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", mode === "dark");
      localStorage.setItem("theme", mode);
    }
  }, [mode]);

  return mode;
}

