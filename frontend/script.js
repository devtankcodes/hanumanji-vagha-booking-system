// =====================
// STATE
// =====================
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
let selectedIndex = null;

// =====================
// UTILITIES
// =====================
function save() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function isValidName(name) {
  return /^[A-Za-z\s]+$/.test(name);
}

function isValidPhone(phone) {
  const clean = phone.replace("+91 ", "");
  return clean.length === 10;
}

// =====================
// FORM HANDLING
// =====================
function addBooking() {
  let name = document.getElementById("name").value.trim();
  let phone = document.getElementById("phone").value;
  let dayType = document.getElementById("dayType").value;

  // Validation
  if (!name || !phone) {
    alert("Fill all fields");
    return;
  }

  if (!isValidName(name)) {
    alert("Name should contain only letters");
    return;
  }

  if (!isValidPhone(phone)) {
    alert("Phone must be 10 digits");
    return;
  }

  bookings.push({
    name,
    phone,
    dayType,
    status: "waiting",
    date: null,
  });

  save();
  resetForm();
  display();
}

// =====================
// RESETFORM
// =====================
function resetForm() {
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "+91 ";
  document.getElementById("dayType").value = "Friday";
}

// =====================
// MODAL
// =====================
function openModal(index) {
  selectedIndex = index;

  const booking = bookings[index];
  const input = document.getElementById("modalDate");

  input.onchange = null; // reset old listener

  if (booking.dayType === "Friday") {
    input.value = getNextAvailableFriday();

    input.onchange = function () {
      let selected = this.value;
      let corrected = forceFriday(selected);

      if (selected !== corrected) {
        alert("Only Friday allowed. Adjusted automatically.");
        this.value = corrected;
      }
    };
  } else {
    input.value = "";
  }

  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function saveDate() {
  let date = document.getElementById("modalDate").value;
  let booking = bookings[selectedIndex];

  if (!date) {
    alert("Select a date");
    return;
  }

  let selectedDay = new Date(date).getDay();

  // 🔴 STRICT RULE
  if (booking.dayType === "Friday" && selectedDay !== 5) {
    alert("Only Friday can be assigned for this booking!");
    return;
  }

  // Prevent duplicate booking
  let exists = bookings.find((b) => b.date === date);
  if (exists) {
    alert("Date already booked!");
    return;
  }

  booking.date = date;
  booking.status = "confirmed";

  save();
  closeModal();
  display();

  // Open WhatsApp AFTER confirm
  //window.open(getWhatsAppLink(booking), "_blank");
}

// =====================
// DISPLAY
// =====================
function display() {
  let waitingList = document.getElementById("waitingList");
  let confirmedList = document.getElementById("confirmedList");

  waitingList.innerHTML = "";
  confirmedList.innerHTML = "";

  bookings.forEach((b, index) => {
    let li = document.createElement("li");

    if (b.status === "waiting") {
      li.innerHTML = `
        <div class="item">
          <div>
            <strong>${b.name}</strong><br>
            <small>${b.phone} • ${b.dayType}</small>
          </div>
          <button class="assign-btn" onclick="openModal(${index})">
            Assign
          </button>
        </div>
      `;
      waitingList.appendChild(li);
    }

    if (b.status === "confirmed") {
      li.innerHTML = `
        <div class="item done">
          <div>
            <strong>${b.name}</strong><br>
            <small>${b.date} • ${b.dayType}</small>
          </div>
          <a href="${getWhatsAppLink(b)}" target="_blank">
            <button class="whatsapp-btn">WhatsApp</button>
          </a>
        </div>
      `;
      confirmedList.appendChild(li);
    }
  });
}

// =====================
// BUSINESS LOGIC
// =====================
function getNextAvailableFriday() {
  let date = new Date();

  while (true) {
    date.setDate(date.getDate() + 1);

    if (date.getDay() === 5) {
      let formatted = date.toISOString().split("T")[0];

      if (!bookings.find((b) => b.date === formatted)) {
        return formatted;
      }
    }
  }
}

function getWhatsAppLink(b) {
  let phone = b.phone.replace("+91 ", "91");

  let msg = `🙏 Jai Siyaram

Your Vagha booking is confirmed.
📅 Date: ${b.date}
📌 Type: ${b.dayType}

Thank you 🙏`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// =====================
// INPUT CONTROL
// =====================
function setupPhoneInput() {
  let input = document.getElementById("phone");

  input.addEventListener("input", function () {
    let val = this.value;

    if (!val.startsWith("+91 ")) {
      val = "+91 ";
    }

    let digits = val.slice(4).replace(/\D/g, "").slice(0, 10);

    this.value = "+91 " + digits;
  });
}

function forceFriday(dateStr) {
  let date = new Date(dateStr);

  // Move forward until Friday
  while (date.getDay() !== 5) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString().split("T")[0];
}

let calendar;

function initCalendar() {
  let calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",

    // ❌ Disable interactions
    selectable: false,

    headerToolbar: {
      left: "prev,next",
      center: "title",
      right: ""
    },

    height: "auto",

    // ✅ Only show events
    events: getCalendarEvents()
  });

  calendar.render();
}

function getCalendarEvents() {
  return bookings
    .filter((b) => b.status === "confirmed")
    .map((b) => ({
      title: b.name,
      start: b.date,
      color: "#28a745",
    }));
}

// =====================
// INIT
// =====================
setupPhoneInput();
display();
initCalendar();