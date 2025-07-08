import { useRouter } from "next/router";

export default function CatchAll() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-2">Oops! Route not found</h1>
      <p className="text-lg">You visited: <code>{router.asPath}</code></p>
    </div>
  );
}
