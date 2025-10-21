export default function PriceStockFields({ register, errors }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block font-medium">Price</label>
          <input
            id="price"
            type="number"
            step="0.01"
            className="p-2 border rounded w-full"
            {...register('price', {
              required: 'Price is required',
              valueAsNumber: true,
              pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Up to 2 decimals allowed' },
            })}
          />
          {errors?.price && <p className="text-red-500">{errors.price.message}</p>}
        </div>
  
        <div>
          <label htmlFor="stock" className="block font-medium">Stock</label>
          <input
            id="stock"
            type="number"
            className="p-2 border rounded w-full"
            placeholder="Default: 0"
            {...register('stock', { valueAsNumber: true })}
          />
        </div>
      </div>
    );
  }
  