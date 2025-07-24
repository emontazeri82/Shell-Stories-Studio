// components/FormErrors.js
export default function FormErrors({ errors }) {
    if (!errors || Object.keys(errors).length === 0) return null;
  
    return (
      <div className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4 space-y-1 font-medium">
        {Object.entries(errors).map(([field, message]) => (
          <div key={field}>• {message}</div>
        ))}
      </div>
    );
  }
  