// pages/thank-you.js
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-popins">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4 text-green-600 dark:text-green-400">
          Thank you!
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Your payment was successful. We’ll send a confirmation email shortly.
        </p>
        <Link href="/" className="text-indigo-600 hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
}
