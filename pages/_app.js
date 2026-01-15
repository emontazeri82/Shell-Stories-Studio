import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { Toaster } from "react-hot-toast";
import ThemeApplier from "@/components/ThemeApplier";
import AppInitializer from "@/utils/sessionInitializer";
import ProductsInitializer from "@/components/ProductsInitializer";
import {
  poppins,
  inter,
  playfair,
  quicksand,
  merriweather,
  josefin,
} from "@/utils/fonts";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePersistentCart } from "@/hooks/usePersistentCart";
import { SessionProvider } from "next-auth/react";

const queryClient = new QueryClient();

function PersistentCartProvider({ children }) {
  usePersistentCart();
  return children;
}

function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <div
      className={`
        ${poppins.variable} ${inter.variable} ${playfair.variable}
        ${quicksand.variable} ${merriweather.variable} ${josefin.variable}
      `}
    >
      <SessionProvider session={session}>
        <Provider store={store}>
          {/* ✅ MUST be here */}
          <ProductsInitializer />
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
      </SessionProvider>
    </div>
  );
}

export default App;


