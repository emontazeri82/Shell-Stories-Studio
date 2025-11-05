import axios from "axios";

export async function toggleActiveStatus({ id, isActive }) {
  const url = `/api/admin/manage_products/${id}`;
  console.log("[Axios] Calling:", url);
  console.log("📦 Payload:", { is_active: isActive });

  try {
    const { data } = await axios.patch(
      url,
      { is_active: isActive },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Server response:", data);
    return data;
  } catch (err) {
    // Log detailed error for easier debugging
    console.error("[Axios] Error at:", url, err);

    // If the server provided a response, show it clearly
    if (err.response) {
      console.error("❌ Server responded with:", err.response.data);
      throw new Error(
        `Failed to update active status: ${err.response.status} ${err.response.statusText}`
      );
    }

    // If no response (network or timeout)
    throw new Error("Network error or no response from server");
  }
}
