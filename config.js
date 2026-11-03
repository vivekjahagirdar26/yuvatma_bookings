// Edit these values only. Everything else reads from here.
window.YUV = {
  // 1. Google Apps Script Web App URL
  // Paste your published Web App URL below (must end in /exec):
  API_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE",

  // 2. Booking Status & Marketing Control
  // Set BOOKINGS_OPEN to:
  //   false -> Shows "Bookings open on 7th November" and allows WhatsApp notifications/preview
  //   true  -> Bookings are live and active!
  BOOKINGS_OPEN: false,
  BOOKING_OPEN_DATE_STR: "7th November 2026",

  // 3. Trip & Seat Capacity
  PRICE: 1785,                        // Contribution per person (₹)
  TOTAL_SEATS: 35,                     // Total bus seat capacity (live tracked)

  // 4. Payment UPI Details
  UPI_ID: "vivekvj26@ybl",             // Shown in payment step & QR code
  UPI_NAME: "YUVATMA",

  // 5. Contact Details
  WHATSAPP: "919739755771",            // Country code + 10 digits (no + or spaces)
  PHONE: "+91 9739755771",
  EMAIL: "jahagirdarvivek26@gmail.com"
};
