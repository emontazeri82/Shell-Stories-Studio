// components/admin_dashboard/ProductDetailsRow.js
export default function ProductDetailsRow({ product }) {
  console.log("🔍 DetailRow product:", product);

    return (
      <tr className="bg-gray-50">
        <td colSpan="5" className="p-4">
          <p><strong>Description:</strong> {product.description}</p>
          <div className="mt-2">
            <strong>Image:</strong>
            <div className="mt-1">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-24 w-24 border border-red-500"
              />
            </div>
          </div>
        </td>
      </tr>
    );
  }
  