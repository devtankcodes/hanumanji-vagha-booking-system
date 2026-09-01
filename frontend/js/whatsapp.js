export function getWhatsAppLink(booking) {
  const phone = `91${booking.phone}`;

  const formattedDate = new Date(booking.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const msg = `🙏 Jai Siyaram, ${booking.name} ji

Your Vagha booking at Shree Hanumanji Mandir is confirmed.

📅 Date: ${formattedDate}
🕉️ Occasion: ${booking.dayType === "Friday" ? "Weekly Friday Vagha" : "Special Day Vagha"}

Please arrive a little before the scheduled time. For any changes, feel free to reply to this message.

Jai Hanuman 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}