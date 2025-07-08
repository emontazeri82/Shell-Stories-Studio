import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { Toaster } from "react-hot-toast";
import ThemeApplier from "@/components/ThemeApplier";
import AppInitializer from "@/utils/sessionInitializer";

function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <ThemeApplier>
        <ErrorBoundary>
          <AppInitializer />
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </ErrorBoundary>
      </ThemeApplier>
    </Provider>  
  );
}

export default App;

