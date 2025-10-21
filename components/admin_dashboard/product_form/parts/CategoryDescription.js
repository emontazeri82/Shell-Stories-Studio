export default function CategoryDescription({ register }) {
    return (
      <>
        <div>
          <label htmlFor="category" className="block font-medium">Category</label>
          <select id="category" className="p-2 border rounded w-full" {...register('category')}>
            <option value="floral">Floral</option>
            <option value="bird">Bird</option>
            <option value="decor">Decor</option>
          </select>
        </div>
  
        <div>
          <label htmlFor="description" className="block font-medium">Description</label>
          <textarea id="description" rows={4} className="p-2 border rounded w-full" {...register('description')} />
        </div>
      </>
    );
  }
  