// utils/validateInfoForm.js

export function validateInfoForm({ email = "", phone = "", deliveryMethod = "" }) {
    const errors = {};
  
    // Normalize inputs
    email = email.trim();
    phone = phone.trim();
    deliveryMethod = deliveryMethod.trim();
  
    // Validate email (RFC-5322-like regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
  
    // Validate phone (optional but should be digits and +, -, or spaces)
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (phone && !phoneRegex.test(phone)) {
      errors.phone = "Phone number is invalid. Use only digits, spaces, +, -, or ().";
    }
  
    // Validate delivery method
    const validMethods = ["standard", "express", "pickup"];
    if (!deliveryMethod) {
      errors.deliveryMethod = "Please select a delivery method.";
    } else if (!validMethods.includes(deliveryMethod)) {
      errors.deliveryMethod = "Invalid delivery method selected.";
    }
  
    return errors;
  }
  
  