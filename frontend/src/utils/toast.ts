export const toast = {
  success: (message: string) => {
    showToast(message, "success");
  },
  error: (message: string) => {
    showToast(message, "error");
  },
};

function showToast(message: string, type: "success" | "error") {
  // Check if container exists, if not create it
  let container = document.getElementById("custom-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "custom-toast-container";
    container.style.position = "fixed";
    container.style.top = "24px";
    container.style.right = "24px";
    container.style.zIndex = "99999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
  }

  // Create toast card
  const toastEl = document.createElement("div");
  toastEl.style.pointerEvents = "auto";
  toastEl.style.minWidth = "300px";
  toastEl.style.maxWidth = "400px";
  toastEl.style.padding = "12px 16px";
  toastEl.style.borderRadius = "14px";
  toastEl.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)";
  toastEl.style.display = "flex";
  toastEl.style.alignItems = "center";
  toastEl.style.gap = "10px";
  toastEl.style.fontFamily = "system-ui, -apple-system, sans-serif";
  toastEl.style.fontSize = "13.5px";
  toastEl.style.fontWeight = "550";
  toastEl.style.transition = "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
  toastEl.style.opacity = "0";
  toastEl.style.transform = "translateY(-12px) scale(0.95)";

  // Styling based on type
  if (type === "success") {
    toastEl.style.backgroundColor = "#10b981"; // Emerald 500
    toastEl.style.color = "#ffffff";
  } else {
    toastEl.style.backgroundColor = "#ef4444"; // Red 500
    toastEl.style.color = "#ffffff";
  }

  // Icon
  const icon = document.createElement("span");
  icon.style.display = "inline-flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.flexShrink = "0";
  icon.innerHTML = type === "success" 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
  toastEl.appendChild(icon);

  // Message text
  const text = document.createElement("span");
  text.innerText = message;
  text.style.lineHeight = "1.4";
  toastEl.appendChild(text);

  container.appendChild(toastEl);

  // Trigger animation entry
  requestAnimationFrame(() => {
    toastEl.style.opacity = "1";
    toastEl.style.transform = "translateY(0) scale(1)";
  });

  // Automatically remove after 3.5 seconds
  setTimeout(() => {
    toastEl.style.opacity = "0";
    toastEl.style.transform = "translateY(-8px) scale(0.95)";
    setTimeout(() => {
      toastEl.remove();
      if (container && container.childElementCount === 0) {
        container.remove();
      }
    }, 300);
  }, 3500);
}
