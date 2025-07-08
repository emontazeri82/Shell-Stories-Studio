// utils/toastLoading.js
import { toast } from "react-hot-toast";

let toastId = null;

export function showLoading(message = "Processing...") {
  toastId = toast.loading(message);
}

export function hideLoading() {
  if (toastId) {
    toast.dismiss(toastId);
    toastId = null;
  }
}
