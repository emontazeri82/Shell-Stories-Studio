export default function BasicsFields({ register, errors }) {
    return (
      <div>
        <label htmlFor="name" className="block font-medium">Product Name</label>
        <input
          id="name"
          type="text"
          className="p-2 border rounded w-full"
          {...register('name', { required: 'Name is required' })}
        />
        {errors?.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>
    );
  }
  