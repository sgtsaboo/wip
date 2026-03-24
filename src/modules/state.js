import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_TILES } from "../../constants.js";

// --- State Management ---
export let state = {
  settings: JSON.parse(localStorage.getItem("speeddial_settings")) || {
    ...DEFAULT_SETTINGS,
  },
  tiles: JSON.parse(localStorage.getItem("speeddial_tiles")) || [
    ...INITIAL_TILES,
  ],
  pages: JSON.parse(localStorage.getItem("speeddial_pages")) || [
    ...INITIAL_PAGES,
  ],
  activePageId:
    localStorage.getItem("speeddial_active_page") || INITIAL_PAGES[0].id,
  weatherData: {},
  currentTime: new Date(),
  calendarViewDate: new Date(),
};

export const saveState = () => {
  try {
    localStorage.setItem("speeddial_settings", JSON.stringify(state.settings));
    localStorage.setItem("speeddial_tiles", JSON.stringify(state.tiles));
    localStorage.setItem("speeddial_pages", JSON.stringify(state.pages));
    localStorage.setItem("speeddial_active_page", state.activePageId);
    return true;
  } catch (e) {
    console.error("Storage error:", e);
    if (e.name === "QuotaExceededError") {
      alert(
        "Local storage is full! This is usually caused by a very large background image file. Please use a smaller image (under 2MB) or host it online and use the URL instead.",
      );
    } else {
      alert(
        "An error occurred while saving. Please check the console for details.",
      );
    }
    return false;
  }
};
