import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email
    await resend.emails.send({
      from: process.env.SENDER_EMAIL,  
      to: process.env.CONTACT_RECEIVER_EMAIL,
      subject: `New message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="margin-bottom: 10px;">New Contact Form Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p style="margin-top: 20px;"><strong>Message:</strong></p>
          <p style="white-space: pre-line;">${message}</p>
        </div>
      `
    });

    return res.status(200).json({ message: "Email sent successfully" });

  } catch (error) {
    console.error("Resend error:", error);
    return res.status(500).json({ message: "Email failed to send" });
  }
}

