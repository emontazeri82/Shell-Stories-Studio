import ShellAnimation from "@/components/ShellAnimation";
import Layout from "../components/Layout";
import Background from "@/components/Background";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <Layout>
      <div className="relative w-full min-h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <Background />
        </div>

        {/* Shell Animation centered over background */}
        <div className="relative z-10 flex flex-col items-center justify-center h-screen -translate-y-20">
          <ErrorBoundary>
            <ShellAnimation />
          </ErrorBoundary>
          
        </div>

        {/* Intro Text */}
        <div className="relative z-20 mt-[75vh] text-center px-4">
          <h1 className="text-4xl font-bold text-indigo-300 mb-4 drop-shadow-md">
            Welcome to Shell Stories Studio
          </h1>
          <p className="text-gray-100 text-lg max-w-xl mx-auto drop-shadow">
            Discover unique handmade shell decorations crafted with love.
          </p>
        </div>
      </div>
    </Layout>

  );
}






