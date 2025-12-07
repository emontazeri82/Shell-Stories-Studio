export default function ShippingBadge({ status }) {
    const base = "px-2 py-1 text-xs font-semibold rounded-full";
  
    if (status === "Delivered")
      return <span className={`${base} bg-green-100 text-green-800`}>Delivered</span>;
  
    if (status === "Shipped")
      return <span className={`${base} bg-blue-100 text-blue-800`}>Shipped</span>;
  
    return <span className={`${base} bg-gray-200 text-gray-700`}>Pending</span>;
  }
  