function getEmailTemplate(name, date, type) {
  return `
  <html>
  <body style="margin:0; padding:0; background:#eef2f7; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">

        <table width="600" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden;">

          <tr>
            <td style="background:#ff6a00; padding:20px; text-align:center;">
              <h1 style="color:#ffffff; margin:0;">Shree Chamatkarik Dham</h1>
              <p style="color:#ffe0c7; margin:5px 0 0;">Rajkot</p>
            </td>
          </tr>

          <tr>
            <td style="padding:25px; color:#333;">
              <h2>🙏 Jai Siyaram, ${name} ji,</h2>

              <p>Your <b>Vagha Seva</b> is scheduled for tomorrow.</p>

              <p><b>📅 Date:</b> ${date}</p>
              <p><b>🕉️ Seva:</b> ${type}</p>

              <div style="text-align:center; margin-top:25px;">
                <a href="https://www.instagram.com/shreechamatkarikdham/" style="background:#ff6a00; color:#fff; padding:12px 20px; text-decoration:none; border-radius:6px;">
                   Instagram
                </a>
              </div>

              <div style="text-align:center; margin-top:25px;">
                <a href="https://maps.google.com/?q=Shree+Chamatkarik+Hanumanji+Mandir" style="background:#ff6a00; color:#fff; padding:12px 20px; text-decoration:none; border-radius:6px;">
                   Location
                </a>
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

  </body>
  </html>
  `;
}