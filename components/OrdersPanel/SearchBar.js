// components/SearchBar.js
export default function SearchBar({ search, setSearch }) {
    return (
      <input
        type="text"
        placeholder="Search by email, name, or tracking..."
        className="border p-2 rounded w-80"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    );
  }
  