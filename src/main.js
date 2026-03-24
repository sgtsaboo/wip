import { state } from "./modules/state.js";
import { render } from "./ui/render.js";
import { renderCalendar } from "./ui/calendar.js";
import { SEARCH_CONFIG } from "../constants.js";

// Expose SEARCH_CONFIG globally for other modules
window.SEARCH_CONFIG = SEARCH_CONFIG;

// --- Lifecycle ---
setInterval(() => {
  state.currentTime = new Date();
  const timeEl = document.getElementById("time-display");
  if (timeEl) {
    timeEl.textContent = state.currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !state.settings.timeFormat24h,
    });
  } else {
    // fallback (e.g. modal open or not yet rendered)
    render();
  }
  renderCalendar();
}, 1000);

// Initial render
render();
