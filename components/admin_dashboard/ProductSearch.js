// components/admin_dashboard/ProductSearch.js
import { useEffect, useState } from 'react';

export default function ProductSearch({ value, onChange }) {
  const [input, setInput] = useState(value || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(input); // Pass search query to parent after debounce
    }, 400);
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder="Search products by name"
      className="p-2 border rounded w-full"
    />
  );
}

