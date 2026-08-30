export function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

export function confirmDialog(message) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "confirm-modal";

    const box = document.createElement("div");
    box.className = "confirm-box";

    const text = document.createElement("p");
    text.innerText = message; // innerText, not innerHTML: safe from injection

    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const yesBtn = document.createElement("button");
    yesBtn.innerText = "Yes";
    yesBtn.className = "delete-btn";

    const noBtn = document.createElement("button");
    noBtn.innerText = "Cancel";
    noBtn.className = "secondary";

    yesBtn.onclick = () => {
      modal.remove();
      resolve(true);
    };
    noBtn.onclick = () => {
      modal.remove();
      resolve(false);
    };

    actions.append(yesBtn, noBtn);
    box.append(text, actions);
    modal.append(box);
    document.body.appendChild(modal);
  });
}