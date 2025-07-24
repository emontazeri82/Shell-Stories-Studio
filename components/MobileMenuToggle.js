// components/MobileMenuToggle.js
"use client";

import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function MobileMenuToggle({ isOpen, toggle }) {
  return (
    <button
      onClick={toggle}
      className="md:hidden text-gray-700 hover:text-indigo-600 focus:outline-none"
      aria-label="Toggle Menu"
    >
      {isOpen ? (
        <XMarkIcon className="h-6 w-6" />
      ) : (
        <Bars3Icon className="h-6 w-6" />
      )}
    </button>
  );
}


