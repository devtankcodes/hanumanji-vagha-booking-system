export function getWhatsAppLink(booking) {
  const phone = `91${booking.phone}`; // India country code + 10-digit number

  const msg = `🙏 Jai Siyaram

Your Vagha booking is confirmed.
📅 Date: ${booking.date}
📌 Day: ${booking.dayType}

Thank you 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}