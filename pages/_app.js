import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { Toaster } from "react-hot-toast";
import ThemeApplier from "@/components/ThemeApplier";
import AppInitializer from "@/utils/sessionInitializer";
import {
  poppins,
  inter,
  playfair,
  quicksand,
  merriweather,
  josefin,
} from "@/utils/fonts";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { usePersistentCart } from "@/hooks/usePersistentCart";

const queryClient = new QueryClient();

function PersistentCartProvider({ children }) {
  usePersistentCart();
  return children;
}

function App({ Component, pageProps }) {
  return (
    <div
      className={`
        ${poppins.variable} ${inter.variable} ${playfair.variable} ${quicksand.variable}
        ${merriweather.variable} ${josefin.variable}
      `}
    >
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeApplier>
            <ErrorBoundary>
              <AppInitializer />
              <PersistentCartProvider>
                <Component {...pageProps} />
              </PersistentCartProvider>
              <Toaster position="top-right" />
            </ErrorBoundary>
          </ThemeApplier>
        </QueryClientProvider>
      </Provider>
    </div>
  );
}

export default App;

