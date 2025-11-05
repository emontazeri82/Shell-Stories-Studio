import React from 'react';

export default function BasicsFields({ register, errors }) {
  if (!register) {
    console.error("❌ 'register' prop is missing in BasicsFields component.");
  }

  return (
    <div className="mb-4">
      <label htmlFor="name" className="block font-medium mb-1">
        Product Name
      </label>
      <input
        id="name"
        type="text"
        className="p-2 border rounded w-full"
        placeholder="Enter product name"
        {...(register ? register('name', { required: 'Name is required' }) : {})}
      />
      {errors?.name && (
        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
      )}
    </div>
  );
}
