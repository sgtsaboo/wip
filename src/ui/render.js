import { state } from "../modules/state.js";
import { hexToRgb, getFavicon } from "../utils.js";
import { renderNotesWidget, attachNotesEvents } from "./notes.js";
import { renderCalendar } from "./calendar.js";
import { fetchWeather } from "./weather.js";
import { initSearch } from "../modules/search.js";
import { createIcons, icons } from "lucide";
import { attachAppEvents } from "../events.js";

export const appRoot = document.getElementById("app-root");
export const modalRoot = document.getElementById("modal-root");

export const render = () => {
  document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
  document.documentElement.style.setProperty("--theme-color", state.settings.themeColor);
  document.documentElement.style.setProperty("--bg-color", state.settings.backgroundColor);
  document.documentElement.style.setProperty("--bg-rgb", hexToRgb(state.settings.backgroundColor));
  document.documentElement.style.setProperty("--widget-opacity", state.settings.tileOpacity);

  const timeStr = state.currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !state.settings.timeFormat24h,
  });

  const date = state.currentTime;
  const month = date.toLocaleDateString([], { month: "long" });
  const day = date.toLocaleDateString([], { day: "numeric" });
  const dateStr = `${month} ${day}`;
  const filteredTiles = state.tiles
    .filter((t) => t.pageId === state.activePageId)
    .sort((a, b) => a.position - b.position);

  appRoot.innerHTML = `
    <div id="main-container" style="background-image: ${state.settings.backgroundImage ? `url(${state.settings.backgroundImage})` : "none"}">
      <div class="main-grid-wrapper">
        <aside class="no-scrollbar">
          <div id="time-display"></div>
          <div id="weather-list-left"></div>
          ${state.settings.showNotes && state.settings.notesPosition === "left" ? renderNotesWidget() : ""}
        </aside>

        <main class="no-scrollbar">
          <div class="search-container">
            <form id="search-form">
              <select id="engine-select"></select>
              <input type="text" id="search-input" placeholder="Search the web..." autocomplete="off" />
              <button type="submit"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
            </form>
          </div>
          
          <nav id="group-tabs-nav">
            <div id="group-tabs-list">
              ${state.pages.map((page) => `<button data-page-id="${page.id}" class="group-tab ${state.activePageId === page.id ? "active" : ""}">${page.name}</button>`).join("")}
            </div>
          </nav>

          <div id="main-grid" style="grid-template-columns: repeat(${state.settings.cols}, minmax(0, 1fr));">
            ${filteredTiles.map((tile) => `
              <div data-id="${tile.id}" class="tile-item">
                <div class="tile-link">
                  <div class="tile-icon-wrapper">
                    <div class="drag-handle"><i data-lucide="grip-vertical" size="8"></i></div>
                    <img src="${tile.imageUrl || getFavicon(tile.url)}" class="tile-icon" />
                  </div>
                  <div class="tile-title">${tile.title}</div>
                </div>
                <button data-edit-id="${tile.id}" class="edit-btn"><i data-lucide="edit-3" size="8"></i></button>
              </div>
            `).join("")}
            
            <button id="add-tile-btn">
              <i data-lucide="plus"></i>
              <span>Add Link</span>
            </button>
          </div>
        </main>

        <aside class="no-scrollbar">
          <div class="date-display">${dateStr}</div>
          <div id="calendar-area"></div>
          ${state.settings.showNotes && state.settings.notesPosition === "right" ? renderNotesWidget() : ""}
        </aside>
      </div>

      <button id="settings-trigger"><i data-lucide="settings" size="28"></i></button>
    </div>
  `;

  createIcons({ icons });
  attachAppEvents();
  attachNotesEvents();
  initSearch();
  renderCalendar();
  fetchWeather();

  const timeEl = document.getElementById("time-display");
  if (timeEl) {
    timeEl.textContent = timeStr;
  }
};
