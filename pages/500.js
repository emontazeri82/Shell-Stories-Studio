export default function ServerError() {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center bg-black text-white">
        <h1 className="text-5xl font-bold mb-4">500</h1>
        <p className="text-xl">Internal Server Error. Please try again later.</p>
      </div>
    );
  }
  