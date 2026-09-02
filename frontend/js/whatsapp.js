export function getWhatsAppLink(booking) {
  const dialCode = (booking.countryCode || "+91").replace("+", "");
  const phone = `${dialCode}${booking.phone}`;

  const formattedDate = new Date(booking.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const msg = `🙏 Jai Siyaram, *${booking.name}* ji

Your Vagha booking has been successfully confirmed at *Shree Chamatkarik Hanumanji Mandir*.

📅 Date: ${formattedDate}
🕉️ Occasion: ${booking.dayType === "Friday" ? "Weekly Friday Vagha" : "Special Day Vagha"}
📍 Venue: A.G. Chowk, Kalawad Road, Rajkot, Gujarat, 360005

📸 Your Vagha seva will be featured on our official Instagram page every Saturday: https://www.instagram.com/shreechamatkarikdham/

For any changes or inquiries, feel free to reply to this message.

Jai Hanumanji Maharaj 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}