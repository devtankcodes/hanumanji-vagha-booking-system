export function getWhatsAppLink(booking) {
  const dialCode = (booking.countryCode || "+91").replace("+", "");
  const phone = `${dialCode}${booking.phone}`;

  const formattedDate = new Date(booking.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const msg = `🙏 Jai Siyaram, *${booking.name}* ji,

Your Vagha booking has been successfully confirmed at *Shree Chamatkarik Hanumanji Mandir*.

*📅 Date:* ${formattedDate}
*🕉️ Seva:* ${booking.dayType === "Friday" ? "Friday Vagha Seva" : "Special Day Vagha Seva"}
*📍 Venue:* A.G. Chowk, Kalawad Road, Rajkot – 360005

📸 Your Vagha seva may be featured on our official Instagram page:  
https://www.instagram.com/shreechamatkarikdham/

For any queries or changes, please feel free to reply to this message.

🙏 Jai Hanumanji Maharaj 🚩  
— *Shree Chamatkarik Dham*`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
