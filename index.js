import { createIcons, icons } from "lucide";
import Sortable from "sortablejs";
import { DEFAULT_SETTINGS, INITIAL_PAGES, INITIAL_TILES } from "./constants.js";

// --- Utilities ---
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "0, 0, 0";
};

const getFavicon = (url) =>
  `https://www.google.com/s2/favicons?sz=128&domain=${url}`;

// --- State Management ---
let state = {
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

const saveState = () => {
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

// --- Rendering ---
const appRoot = document.getElementById("app-root");
const modalRoot = document.getElementById("modal-root");

const render = () => {
  const isDark = state.settings.theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.setProperty(
    "--theme-color",
    state.settings.themeColor,
  );
  document.documentElement.style.setProperty(
    "--bg-color",
    state.settings.backgroundColor,
  );
  document.documentElement.style.setProperty(
    "--bg-rgb",
    hexToRgb(state.settings.backgroundColor),
  );
  document.documentElement.style.setProperty(
    "--widget-opacity",
    state.settings.tileOpacity,
  );

  const timeStr = state.currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !state.settings.timeFormat24h,
  });

const date = state.currentTime;

const weekday = date.toLocaleDateString([], { weekday: "long" });
const month = date.toLocaleDateString([], { month: "long" });
const day = date.toLocaleDateString([], { day: "numeric" });

// Join them with new lines
const dateStr = `${weekday},\n ${month}\n${day}`;

  const filteredTiles = state.tiles
    .filter((t) => t.pageId === state.activePageId)
    .sort((a, b) => a.position - b.position);

  appRoot.innerHTML = `
    <div id="main-container" class="h-screen w-screen flex flex-col transition-all duration-500 bg-customBg bg-cover bg-center bg-fixed overflow-hidden" 
         style="background-image: ${state.settings.backgroundImage ? `url(${state.settings.backgroundImage})` : "none"}">
      
      <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-[22%_56%_22%] h-full overflow-hidden">
        
        <!-- Left Sidebar -->
        <aside class="hidden md:flex flex-col items-center pt-16 p-8 overflow-y-auto no-scrollbar z-20">
          <div id="time-display" class="text-4xl font-extrabold tracking-tighter tabular-nums drop-shadow-sm mb-8 ${isDark ? "text-slate-100" : "text-gray-900"}">
             ${timeStr}
          </div>
          <div id="weather-list-left" class="w-full flex flex-col gap-4"></div>
          ${state.settings.showNotes && state.settings.notesPosition === "left" ? renderNotesWidget() : ""}
        </aside>

        <!-- Main Body -->
        <main class="flex flex-col items-center h-full overflow-y-auto no-scrollbar px-6 pt-12 pb-24 z-10">

          <!-- Page Groups (Tabs) -->
          <nav id="group-tabs-nav" class="w-full flex justify-center mb-10">
            <div id="group-tabs-list" class="flex flex-wrap justify-center border-b ${isDark ? "border-slate-800" : "border-gray-200"}">
              ${state.pages
                .map(
                  (page) => `
                <button data-page-id="${page.id}" class="group-tab px-4 py-3 text-sm font-bold transition-all relative ${state.activePageId === page.id ? "text-theme" : isDark ? "text-slate-200 hover:text-slate-500" : "text-gray-400 hover:text-gray-800"}">
                  ${page.name}
                  ${state.activePageId === page.id ? '<div class="absolute bottom-[-1px] left-0 w-full h-0.5 bg-theme"></div>' : ""}
                </button>
              `,
                )
                .join("")}
            </div>
          </nav>

          <!-- Grid: Fluid layout filling center column -->
          <div id="main-grid" class="grid gap-6 mx-auto w-full max-w-7xl" 
               style="grid-template-columns: repeat(${state.settings.cols}, minmax(0, 1fr));">
            ${filteredTiles
              .map(
                (tile) => `
              <div data-id="${tile.id}" class="tile-item group relative">
                <div class="tile-link cursor-pointer w-full flex flex-col items-center justify-center aspect-video rounded-xl shadow-lg transition-all duration-300 overflow-hidden border backdrop-blur-md bg-widget hover:scale-105 active:scale-95 ${isDark ? "border-white/10" : "border-black/5"}">
                  <div class="flex-1 w-full flex items-center justify-center p-[2%] relative">
                    <!-- Move Handle: Top Left -->
                    <div class="drag-handle absolute top-1 left-1 p-1 text-slate-500 opacity-0 group-hover:opacity-100 cursor-grab hover:text-theme transition-opacity z-20"><i data-lucide="grip-vertical" size="8"></i></div>
                    
                    <!-- Proportional sizing: w-[35%] ensures icons grow/shrink with column count -->
                    <img src="${tile.imageUrl || getFavicon(tile.url)}" class="w-[30%] aspect-square object-contain drop-shadow-lg transition-transform group-hover:scale-110" />
                  </div>
                  <div class="w-full border-t text-center truncate font-bold text-[clamp(12px,1vw,12px)] ${isDark ? "bg-white/5 border-white/10 text-slate-200" : "bg-black/5 border-black/5 text-gray-700"}">
                    ${tile.title}
                  </div>
                </div>
                <!-- Edit Button: Top Right -->
                <button data-edit-id="${tile.id}" class="edit-btn absolute -top-1 -right-1 p-1 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all border bg-widget ${isDark ? "text-slate-300" : "text-gray-600"}">
                  <i data-lucide="edit-3" size="8"></i>
                </button>
              </div>
            `,
              )
              .join("")}
            
            <button id="add-tile-btn" class="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed transition-all hover:scale-105 bg-widget p-[10%] ${isDark ? "border-white/10 text-slate-500 hover:border-theme/50 hover:text-theme" : "border-black/10 text-gray-400 hover:border-theme/40 hover:text-theme"}">
              <i data-lucide="plus" size="24%" class="max-w-[32px]"></i>
              <span class="mt-2 text-[clamp(8px,0.8vw,11px)] font-bold uppercase tracking-widest">Add Link</span>
            </button>
          </div>
        </main>

        <!-- Right Sidebar -->
        <aside class="hidden md:flex flex-col items-center pt-16 p-8 overflow-y-auto no-scrollbar z-20">
  <div class="text-4xl font-extrabold tracking-tighter text-center leading-tight mb-8 whitespace-pre-line ${isDark ? "text-slate-100" : "text-gray-900"}">${dateStr}</div>
  
  <div id="weather-list-right" class="w-full flex flex-col gap-4 mb-8"></div>
  <div id="calendar-area" class="w-full"></div>
  ${state.settings.showNotes && state.settings.notesPosition === "right" ? renderNotesWidget() : ""}
</aside>
      </div>

      <button id="settings-trigger" class="fixed bottom-8 right-8 z-50 p-4 rounded-xl shadow-2xl transition-all hover:scale-110 active:scale-90 border bg-widget ${isDark ? "border-white/10 text-slate-100 hover:text-theme" : "border-black/5 text-gray-700 hover:text-theme"}">
        <i data-lucide="settings" size="28"></i>
      </button>
    </div>
  `;

  createIcons({ icons });
  attachAppEvents();
  renderCalendar();
  fetchWeather();
};

const renderNotesWidget = () => {
  const noteText = localStorage.getItem("speeddial_quicknote") || "";
  return `
    <div class="mt-8 p-4 rounded-xl border backdrop-blur-md shadow-xl bg-widget w-full max-w-[260px] ${state.settings.theme === "dark" ? "border-white/10 text-slate-100" : "border-black/5 text-gray-700"}">
      <div class="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest">
        <i data-lucide="sticky-note" size="14"></i> Quick Notes
      </div>
      <textarea id="notes-input" class="w-full h-32 bg-transparent border-none outline-none resize-none text-xs leading-relaxed placeholder:opacity-60" placeholder="Jot something down...">${noteText}</textarea>
    </div>
  `;
};

const renderCalendar = () => {
  const area = document.getElementById("calendar-area");
  if (!area) return;
  const viewDate = state.calendarViewDate;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const isDark = state.settings.theme === "dark";

  area.innerHTML = `
    <div class="p-5 rounded-xl border backdrop-blur-md shadow-xl bg-widget ${isDark ? "border-white/10 text-slate-100" : "border-black/5 text-gray-700"}">
      <div class="flex items-center justify-between mb-4">
        <button id="cal-prev" class="p-1 hover:bg-current/10 rounded-full transition-colors"><i data-lucide="chevron-left" size="16"></i></button>
        <div class="text-center text-[11px] font-bold uppercase tracking-widest">
          ${viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </div>
        <button id="cal-next" class="p-1 hover:bg-current/10 rounded-full transition-colors"><i data-lucide="chevron-right" size="16"></i></button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-[10px] text-center">
        ${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<div class="font-bold ">${d}</div>`).join("")}
        ${Array(firstDay)
          .fill(0)
          .map(() => "<div></div>")
          .join("")}
        ${Array.from({ length: daysInMonth }, (_, i) => i + 1)
          .map((d) => {
            const isToday =
              d === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            return `
            <button data-day="${d}" class="cal-day aspect-square flex items-center justify-center rounded-lg hover:bg-theme hover:text-white transition-all ${isToday ? "bg-theme text-white font-bold" : ""}">
              ${d}
            </button>
          `;
          })
          .join("")}
      </div>
      <button id="cal-today" class="w-full mt-4 text-[9px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">Today</button>
    </div>
  `;
  createIcons({ icons });

  document.getElementById("cal-prev").onclick = (e) => {
    e.stopPropagation();
    state.calendarViewDate.setMonth(state.calendarViewDate.getMonth() - 1);
    renderCalendar();
  };
  document.getElementById("cal-next").onclick = (e) => {
    e.stopPropagation();
    state.calendarViewDate.setMonth(state.calendarViewDate.getMonth() + 1);
    renderCalendar();
  };
  document.getElementById("cal-today").onclick = (e) => {
    e.stopPropagation();
    state.calendarViewDate = new Date();
    renderCalendar();
  };
  document.querySelectorAll(".cal-day").forEach((btn) => {
    btn.onclick = () => {
      const day = btn.dataset.day;
      const m = (month + 1).toString().padStart(2, "0");
      const d = day.padStart(2, "0");
      window.open(
        `https://calendar.google.com/calendar/u/0/r/day/${year}/${m}/${d}`,
        "_blank",
      );
    };
  });
};

const fetchWeather = async () => {
  if (!state.settings.showWeather) return;

  const results = await Promise.all(
    state.settings.weatherConfigs.map(async (config) => {
      try {
        const unit =
          state.settings.weatherUnit === "imperial"
            ? "&temperature_unit=fahrenheit&wind_speed_unit=mph"
            : "";
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lng}&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,is_day${unit}`,
        );
        const data = await res.json();
        return { ...config, data: data.current };
      } catch {
        return { ...config, data: null };
      }
    }),
  );

  const renderWeatherHtml = (r) => {
    if (!r.data)
      return `<div class="p-4 rounded-xl border bg-widget text-[10px]">Error: ${r.location}</div>`;
    const temp = Math.round(r.data.temperature_2m);
    const unitSymbol = state.settings.weatherUnit === "imperial" ? "°F" : "°C";
    const isDark = state.settings.theme === "dark";

    return `
      <div data-lat="${r.lat}" data-lng="${r.lng}" class="weather-widget-card p-4 rounded-xl border backdrop-blur-md shadow-lg bg-widget flex flex-col cursor-pointer hover:ring-2 hover:ring-theme/30 transition-all ${isDark ? "border-white/10 text-slate-100" : "border-black/5 text-gray-700"}">
        <div class="flex items-center justify-between mb-2">
          <div class="overflow-hidden">
            <div class="text-[14px] font-bold uppercase tracking-widest truncate">${r.location}</div>
            <div class="text-2xl font-black">${temp}${unitSymbol}</div>
          </div>
          <i data-lucide="${r.data.is_day ? "sun" : "moon"}" class="text-theme"></i>
        </div>
        ${
          state.settings.weatherStyle === "detailed"
            ? `
          <div class="flex items-center justify-between text-[9px] border-t pt-2 mt-1 border-current/10">
            <span>Wind: ${Math.round(r.data.wind_speed_10m)}${state.settings.weatherUnit === "imperial" ? "mph" : "km/h"}</span>
            <span>Humid: ${r.data.relative_humidity_2m}%</span>
          </div>
        `
            : ""
        }
      </div>
    `;
  };

  const leftList = document.getElementById("weather-list-left");
  if (leftList) leftList.innerHTML = results.map(renderWeatherHtml).join("");

  createIcons({ icons });
  document.querySelectorAll(".weather-widget-card").forEach((card) => {
    card.onclick = () =>
      window.open(
        `https://www.wunderground.com/weather/${card.dataset.lat},${card.dataset.lng}`,
        "_blank",
      );
  });
};

// --- Interactions ---
const attachAppEvents = () => {
  document.querySelectorAll(".group-tab").forEach((tab) => {
    tab.onclick = () => {
      state.activePageId = tab.dataset.pageId;
      saveState();
      render();
    };
  });

  const tabList = document.getElementById("group-tabs-list");
  if (tabList) {
    Sortable.create(tabList, {
      animation: 200,
      ghostClass: "opacity-20",
      onEnd: (evt) => {
        const [moved] = state.pages.splice(evt.oldIndex, 1);
        state.pages.splice(evt.newIndex, 0, moved);
        saveState();
      },
    });
  }

  const nInput = document.getElementById("notes-input");
  if (nInput)
    nInput.oninput = (e) =>
      localStorage.setItem("speeddial_quicknote", e.target.value);

  document.querySelectorAll(".tile-link").forEach((link, idx) => {
    link.onclick = () => {
      const pageTiles = state.tiles
        .filter((t) => t.pageId === state.activePageId)
        .sort((a, b) => a.position - b.position);
      const tile = pageTiles[idx];
      const url = tile.url;
      if (state.settings.openInNewTab) window.open(url, "_blank");
      else window.location.href = url;
    };
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openEditModal(btn.dataset.editId);
    };
  });

  const addBtn = document.getElementById("add-tile-btn");
  if (addBtn) addBtn.onclick = () => openEditModal(null);

  const sBtn = document.getElementById("settings-trigger");
  if (sBtn) sBtn.onclick = openSettings;

  const grid = document.getElementById("main-grid");
  if (grid) {
    Sortable.create(grid, {
      handle: ".drag-handle",
      animation: 200,
      ghostClass: "sortable-ghost",
      onEnd: (evt) => {
        const pageTiles = state.tiles
          .filter((t) => t.pageId === state.activePageId)
          .sort((a, b) => a.position - b.position);
        const [moved] = pageTiles.splice(evt.oldIndex, 1);
        pageTiles.splice(evt.newIndex, 0, moved);
        pageTiles.forEach((t, i) => (t.position = i));
        state.tiles = [
          ...state.tiles.filter((t) => t.pageId !== state.activePageId),
          ...pageTiles,
        ];
        saveState();
      },
    });
  }
};

// --- Modals ---
const openEditModal = (tileId) => {
  const tile = tileId
    ? state.tiles.find((t) => t.id === tileId)
    : { title: "", url: "", imageUrl: "", pageId: state.activePageId };
  const isDark = state.settings.theme === "dark";

  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div class="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-zoom-in ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-gray-100 text-gray-900"}">
        <div class="p-6 border-b ${isDark ? "border-slate-800" : "border-gray-100"} flex justify-between items-center">
          <h2 class="text-xl font-bold">${tileId ? "Edit Link" : "Add New Link"}</h2>
          <button id="modal-close" class="opacity-50 hover:opacity-100 transition-opacity">X</button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50 block mb-1">URL</label>
            <input id="form-url" type="text" value="${tile.url}" placeholder="https://..." class="w-full px-4 py-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-theme" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50 block mb-1">Title</label>
            <input id="form-title" type="text" value="${tile.title}" placeholder="My Site" class="w-full px-4 py-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-theme" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50 block mb-1">Custom Image URL (Optional)</label>
            <input id="form-image" type="text" value="${tile.imageUrl || ""}" placeholder="https://..." class="w-full px-4 py-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-theme" />
          </div>
          <div>
            <label class="text-[10px] font-bold uppercase opacity-50 block mb-1">Group</label>
            <select id="form-group" class="w-full px-4 py-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-theme">
              ${state.pages.map((p) => `<option value="${p.id}" ${p.id === tile.pageId ? "selected" : ""}>${p.name}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="p-6 bg-current/5 flex gap-3">
          ${tileId ? `<button id="form-delete" class="px-5 py-3 text-red-500 hover:bg-red-500/10 rounded-lg font-bold">Delete</button>` : ""}
          <div class="flex-1"></div>
          <button id="form-cancel" class="px-6 py-3 border rounded-lg font-bold">Cancel</button>
          <button id="form-save" class="px-6 py-3 bg-theme text-white rounded-lg font-bold">Save</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("modal-close").onclick = document.getElementById(
    "form-cancel",
  ).onclick = () => (modalRoot.innerHTML = "");
  if (tileId)
    document.getElementById("form-delete").onclick = () => {
      state.tiles = state.tiles.filter((t) => t.id !== tileId);
      saveState();
      modalRoot.innerHTML = "";
      render();
    };
  document.getElementById("form-save").onclick = () => {
    let url = document.getElementById("form-url").value;
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
    const title =
      document.getElementById("form-title").value ||
      (url ? new URL(url).hostname : "New Site");
    const imageUrl = document.getElementById("form-image").value;
    const pageId = document.getElementById("form-group").value;
    if (!url) return;
    if (tileId) {
      const idx = state.tiles.findIndex((t) => t.id === tileId);
      state.tiles[idx] = { ...state.tiles[idx], url, title, imageUrl, pageId };
    } else {
      state.tiles.push({
        id: "t" + Date.now(),
        url,
        title,
        imageUrl,
        pageId,
        position: state.tiles.length,
      });
    }
    saveState();
    modalRoot.innerHTML = "";
    render();
  };
};

const openSettings = () => {
  const isDark = state.settings.theme === "dark";
  modalRoot.innerHTML = `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div class="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border animate-zoom-in ${isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-gray-100 text-gray-900"}">
        <div class="p-6 border-b ${isDark ? "border-slate-800" : "border-gray-100"} flex justify-between items-center">
          <h2 class="text-xl font-bold flex items-center gap-2"><i data-lucide="settings"></i>Settings</h2>
          <button id="s-close" class="opacity-50 hover:opacity-100 transition-opacity">X</button>
        </div>
        <div class="p-6 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
          <!-- Quick Toggles -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button id="s-theme" class="p-4 rounded-xl border flex flex-col gap-2 transition-all dark:border-slate-800 dark:bg-slate-800/50 hover:border-theme/40">
              <span class="text-[10px] font-bold uppercase opacity-50">Theme</span>
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-bold">${isDark ? "Dark" : "Light"}</span>
                <div class="w-8 h-4 rounded-full relative transition-colors ${isDark ? "bg-theme" : "bg-gray-300"}">
                  <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDark ? "right-0.5" : "left-0.5"}"></div>
                </div>
              </div>
            </button>
            </button>
             <button id="s-weather-toggle" class="p-4 rounded-xl border flex flex-col gap-2 transition-all dark:border-slate-800 dark:bg-slate-800/50 hover:border-theme/40">
              <span class="text-[10px] font-bold uppercase opacity-50">Weather</span>
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-bold">${state.settings.showWeather ? "On" : "Off"}</span>
                <div class="w-8 h-4 rounded-full relative transition-colors ${state.settings.showWeather ? "bg-theme" : "bg-gray-300"}">
                  <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${state.settings.showWeather ? "right-0.5" : "left-0.5"}"></div>
                </div>
              </div>
            </button>
            <button id="s-tab" class="p-4 rounded-xl border flex flex-col gap-2 transition-all dark:border-slate-800 dark:bg-slate-800/50 hover:border-theme/40">
              <span class="text-[10px] font-bold uppercase opacity-50">Links</span>
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-bold">New Tab</span>
                <div class="w-8 h-4 rounded-full relative transition-colors ${state.settings.openInNewTab ? "bg-theme" : "bg-gray-300"}">
                  <div class="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${state.settings.openInNewTab ? "right-0.5" : "left-0.5"}"></div>
                </div>
              </div>

            <button id="s-notes-pos" class="p-4 rounded-xl border flex flex-col gap-2 transition-all dark:border-slate-800 dark:bg-slate-800/50 hover:border-theme/40">
              <span class="text-[10px] font-bold uppercase opacity-50">Notes</span>
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-bold uppercase">${state.settings.notesPosition}</span>
                <i data-lucide="layout-template" size="14"></i>
              </div>
            </button>
          </div>

          <!-- Color Pickers -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <label class="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2">
                <i data-lucide="palette" size="14"></i> Accent Color
              </label>
              <div class="flex flex-wrap gap-2 items-center p-3 rounded-xl border dark:border-slate-800 bg-current/5">
                ${[
                  "#f97316",
                  "#3b82f6",
                  "#10b981",
                  "#ef4444",
                  "#8b5cf6",
                  "#ec4899",
                  "#06b6d4",
                ]
                  .map(
                    (c) => `
                  <button class="color-pick w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${state.settings.themeColor === c ? "border-theme scale-110 shadow-lg" : "border-transparent"}" style="background:${c}" data-color="${c}"></button>
                `,
                  )
                  .join("")}
                <div class="flex items-center gap-3 ml-auto pl-3 border-l border-current/10">
                  <div class="flex flex-col">
                    <span class="text-[8px] opacity-40 uppercase font-bold">Custom</span>
                    <span id="accent-hex-display" class="text-[10px] font-mono opacity-80 uppercase">${state.settings.themeColor}</span>
                  </div>
                  <input type="color" id="s-custom-accent" value="${state.settings.themeColor}" class="w-8 h-8 border-none bg-transparent cursor-pointer rounded-lg overflow-hidden" />
                </div>
              </div>
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2">
                <i data-lucide="image" size="14"></i> Background Color
              </label>
              <div class="flex flex-wrap gap-2 items-center p-3 rounded-xl border dark:border-slate-800 bg-current/5">
                ${[
                  "#020617",
                  "#1e293b",
                  "#000000",
                  "#f3f4f6",
                  "#ffffff",
                  "#111827",
                ]
                  .map(
                    (c) => `
                  <button class="bg-pick w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${state.settings.backgroundColor === c ? "border-theme scale-110 shadow-lg" : "border-transparent"}" style="background:${c}" data-bg="${c}"></button>
                `,
                  )
                  .join("")}
                <div class="flex items-center gap-3 ml-auto pl-3 border-l border-current/10">
                  <div class="flex flex-col">
                    <span class="text-[8px] opacity-40 uppercase font-bold">Custom</span>
                    <span id="bg-hex-display" class="text-[10px] font-mono opacity-80 uppercase">${state.settings.backgroundColor}</span>
                  </div>
                  <input type="color" id="s-custom-bg" value="${state.settings.backgroundColor}" class="w-8 h-8 border-none bg-transparent cursor-pointer rounded-lg overflow-hidden" />
                </div>
              </div>
            </div>
          </div>

          <!-- Background Image Section -->
          <div class="space-y-3">
            <label class="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2">
              <i data-lucide="image" size="14"></i> Background Photo
            </label>
            <div class="flex flex-col gap-3 p-4 rounded-xl border dark:border-slate-800 bg-current/5">
              <div class="flex flex-col gap-2">
                <span class="text-[10px] opacity-60 font-bold">IMAGE URL</span>
                <input id="s-bg-url" type="text" value="${state.settings.backgroundImage || ""}" placeholder="https://source.unsplash.com/random" class="w-full px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-1 focus:ring-theme" />
              </div>
              <div class="flex items-center gap-3 mt-2">
                <button id="s-bg-upload-btn" class="flex-1 py-2 px-4 flex items-center justify-center gap-2 bg-theme/10 text-theme rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-theme/20 transition-all">
                  <i data-lucide="upload" size="14"></i> Upload Local File
                </button>
                <button id="s-bg-clear" class="py-2 px-4 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">
                  <i data-lucide="x-circle" size="14"></i> Clear
                </button>
              </div>
              <input type="file" id="s-bg-file" class="hidden" accept="image/*" />
              <div id="bg-preview-box" class="mt-2 w-full aspect-video rounded-lg bg-cover bg-center border border-current/10" style="background-image: ${state.settings.backgroundImage ? `url(${state.settings.backgroundImage})` : "none"}"></div>
            </div>
          </div>

          <!-- Weather Cities -->
          <div class="space-y-4">
            <label class="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2"><i data-lucide="map-pin" size="14"></i> Weather Cities (Up to 5)</label>
            <div class="space-y-2">
              ${state.settings.weatherConfigs
                .map(
                  (c) => `
                <div class="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-current/5">
                  <span class="text-xs font-bold">${c.location}</span>
                  <button class="city-del p-1 text-red-500 opacity-50 hover:opacity-100" data-city-id="${c.id}"><i data-lucide="trash-2" size="14"></i></button>
                </div>
              `,
                )
                .join("")}
              ${
                state.settings.weatherConfigs.length < 5
                  ? `
                <div class="relative">
                  <div class="flex items-center gap-2 p-2 rounded-xl border dark:border-slate-800 bg-black/5">
                    <input id="city-search" type="text" placeholder="Add city..." class="flex-1 bg-transparent px-3 py-1 outline-none text-xs" />
                    <i data-lucide="search" size="14" class="opacity-50"></i>
                  </div>
                  <div id="city-results" class="absolute top-full left-0 w-full mt-2 border rounded-xl shadow-2xl z-[80] hidden dark:bg-slate-900 bg-white"></div>
                </div>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Layout Section -->
          <div class="space-y-4">
            <label class="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2"><i data-lucide="layout" size="14"></i> Grid Layout</label>
            <div class="p-4 rounded-xl border dark:border-slate-800 bg-current/5">
               <div class="flex items-center justify-between">
                 <span class="text-xs font-bold">Columns</span>
                 <div class="flex items-center gap-4">
                   <input id="s-cols" type="number" min="1" max="12" value="${state.settings.cols}" class="w-16 px-3 py-2 text-xs border rounded-lg dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-1 focus:ring-theme text-center" />
                   <span class="text-[10px] opacity-40 uppercase font-bold">(Max 12)</span>
                 </div>
               </div>
            </div>
          </div>

          <!-- Groups -->
          <div class="space-y-4">
             <div class="flex items-center justify-between">
               <label class="text-[10px] font-bold uppercase opacity-50 flex items-center gap-2"><i data-lucide="layers" size="14"></i> Page Groups</label>
               <button id="s-sort-az" class="text-[10px] font-bold text-theme uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"><i data-lucide="sort-asc" size="12"></i> Sort A-Z</button>
             </div>
             <div class="space-y-2">
               ${state.pages
                 .map(
                   (p) => `
                 <div class="flex gap-2 items-center p-1 rounded-xl group/item">
                   <div class="drag-handle-groups p-2 opacity-30 cursor-grab group-hover/item:opacity-100"><i data-lucide="grip-vertical" size="14"></i></div>
                   <input class="group-edit flex-1 px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 text-xs outline-none focus:ring-1 focus:ring-theme" value="${p.name}" data-group-id="${p.id}" />
                   <button class="group-del p-2 text-red-500 opacity-50 hover:opacity-100" data-group-id="${p.id}"><i data-lucide="trash-2" size="16"></i></button>
                 </div>
               `,
                 )
                 .join("")}
               <button id="s-add-group" class="w-full py-3 border border-dashed rounded-xl opacity-50 hover:opacity-100 hover:border-theme/50 transition-all text-xs font-bold">+ New Group</button>
             </div>
          </div>

          <!-- Import/Export -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl border dark:border-slate-800 bg-current/5 space-y-3">
              <span class="text-[10px] font-bold uppercase opacity-50">Data Management</span>
              <div class="flex gap-2">
                <button id="s-export" class="flex-1 py-2 bg-theme/10 text-theme rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-theme/20 transition-all">Export Native</button>
                <button id="s-import" class="flex-1 py-2 bg-theme/10 text-theme rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-theme/20 transition-all">Import Native</button>
              </div>
            </div>
            <div class="p-4 rounded-xl border dark:border-slate-800 bg-current/5 space-y-3">
              <span class="text-[10px] font-bold uppercase opacity-50">Migrations</span>
              <button id="s-import-sd2" class="w-full py-2 bg-theme/10 text-theme rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-theme/20 transition-all">Import Speed Dial 2 JSON</button>
            </div>
          </div>

          <input type="file" id="import-file" class="hidden" accept=".json" />
        </div>
        <div class="p-6 bg-black/5 flex gap-3">
          <button id="s-reset" class="px-5 py-3 text-red-500 font-bold text-xs uppercase opacity-50 hover:opacity-100">Reset All</button>
          <div class="flex-1"></div>
          <button id="s-apply" class="px-12 py-3 bg-theme text-white rounded-xl font-bold shadow-lg shadow-theme/30 transition-all hover:scale-105 active:scale-95">Apply & Save</button>
        </div>
      </div>
    </div>
  `;

  createIcons({ icons });
  attachSettingsEvents();
};

const attachSettingsEvents = () => {
  const close = () => {
    modalRoot.innerHTML = "";
  };
  document.getElementById("s-close").onclick = close;

  document.getElementById("s-theme").onclick = () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    state.settings.backgroundColor =
      state.settings.theme === "dark" ? "#020617" : "#f3f4f6";
    openSettings();
  };
  document.getElementById("s-tab").onclick = () => {
    state.settings.openInNewTab = !state.settings.openInNewTab;
    openSettings();
  };
  document.getElementById("s-weather-toggle").onclick = () => {
    state.settings.showWeather = !state.settings.showWeather;
    openSettings();
  };
  document.getElementById("s-notes-pos").onclick = () => {
    state.settings.notesPosition =
      state.settings.notesPosition === "left" ? "right" : "left";
    openSettings();
  };

  document.querySelectorAll(".color-pick").forEach(
    (b) =>
      (b.onclick = () => {
        state.settings.themeColor = b.dataset.color;
        openSettings();
      }),
  );
  document.querySelectorAll(".bg-pick").forEach(
    (b) =>
      (b.onclick = () => {
        state.settings.backgroundColor = b.dataset.bg;
        openSettings();
      }),
  );

  const accentPicker = document.getElementById("s-custom-accent");
  const accentHex = document.getElementById("accent-hex-display");
  accentPicker.oninput = (e) => {
    const val = e.target.value;
    state.settings.themeColor = val;
    accentHex.innerText = val;
    document.documentElement.style.setProperty("--theme-color", val);
  };

  const bgPicker = document.getElementById("s-custom-bg");
  const bgHex = document.getElementById("bg-hex-display");
  bgPicker.oninput = (e) => {
    const val = e.target.value;
    state.settings.backgroundColor = val;
    bgHex.innerText = val;
    document.documentElement.style.setProperty("--bg-color", val);
    document.documentElement.style.setProperty("--bg-rgb", hexToRgb(val));
  };

  // Background Image Handling
  const bgUrlInput = document.getElementById("s-bg-url");
  if (bgUrlInput) {
    bgUrlInput.oninput = (e) => {
      state.settings.backgroundImage = e.target.value;
      const previewBox = document.getElementById("bg-preview-box");
      if (previewBox)
        previewBox.style.backgroundImage = state.settings.backgroundImage
          ? `url(${state.settings.backgroundImage})`
          : "none";
      const container = document.getElementById("main-container");
      if (container)
        container.style.backgroundImage = state.settings.backgroundImage
          ? `url(${state.settings.backgroundImage})`
          : "none";
    };
  }

  const bgUploadBtn = document.getElementById("s-bg-upload-btn");
  const bgFileInput = document.getElementById("s-bg-file");
  if (bgUploadBtn && bgFileInput) {
    bgUploadBtn.onclick = () => bgFileInput.click();
    bgFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Basic check: alert if over 4.5MB as it will definitely fail localStorage limits
      if (file.size > 4500000) {
        alert(
          "This file is too large to save locally. Please use an image under 2MB or host the file online and use its URL.",
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        state.settings.backgroundImage = event.target.result;
        const previewBox = document.getElementById("bg-preview-box");
        if (previewBox)
          previewBox.style.backgroundImage = `url(${state.settings.backgroundImage})`;
        const container = document.getElementById("main-container");
        if (container)
          container.style.backgroundImage = `url(${state.settings.backgroundImage})`;
      };
      reader.readAsDataURL(file);
    };
  }

  const bgClearBtn = document.getElementById("s-bg-clear");
  if (bgClearBtn) {
    bgClearBtn.onclick = () => {
      state.settings.backgroundImage = "";
      const previewBox = document.getElementById("bg-preview-box");
      if (previewBox) previewBox.style.backgroundImage = "none";
      const container = document.getElementById("main-container");
      if (container) container.style.backgroundImage = "none";
    };
  }

  const cityInput = document.getElementById("city-search");
  const cityResults = document.getElementById("city-results");
  let searchTimer;
  if (cityInput) {
    cityInput.oninput = (e) => {
      clearTimeout(searchTimer);
      const q = e.target.value;
      if (q.length < 2) {
        cityResults.classList.add("hidden");
        return;
      }
      searchTimer = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`,
          );
          const data = await res.json();
          if (data.results) {
            cityResults.innerHTML = data.results
              .map(
                (loc) => `
              <button class="city-opt w-full text-left px-4 py-3 text-[10px] border-b last:border-0 hover:bg-theme/10 dark:hover:bg-theme/20" 
                      data-name="${loc.name}, ${loc.admin1 || loc.country}" data-lat="${loc.latitude}" data-lng="${loc.longitude}">
                ${loc.name}, ${loc.admin1 || loc.country}
              </button>
            `,
              )
              .join("");
            cityResults.classList.remove("hidden");
            document.querySelectorAll(".city-opt").forEach((opt) => {
              opt.onclick = () => {
                state.settings.weatherConfigs.push({
                  id: Date.now(),
                  location: opt.dataset.name,
                  lat: parseFloat(opt.dataset.lat),
                  lng: parseFloat(opt.dataset.lng),
                });
                openSettings();
              };
            });
          }
        } catch {}
      }, 500);
    };
  }

  document.querySelectorAll(".city-del").forEach(
    (b) =>
      (b.onclick = () => {
        state.settings.weatherConfigs = state.settings.weatherConfigs.filter(
          (c) => c.id != b.dataset.cityId,
        );
        openSettings();
      }),
  );

  document.getElementById("s-add-group").onclick = () => {
    state.pages.push({ id: "p" + Date.now(), name: "New Group" });
    openSettings();
  };
  document.getElementById("s-sort-az").onclick = () => {
    state.pages.sort((a, b) => a.name.localeCompare(b.name));
    openSettings();
  };
  document.querySelectorAll(".group-del").forEach(
    (b) =>
      (b.onclick = () => {
        if (state.pages.length > 1) {
          state.pages = state.pages.filter((p) => p.id !== b.dataset.groupId);
          if (state.activePageId === b.dataset.groupId)
            state.activePageId = state.pages[0].id;
          openSettings();
        }
      }),
  );

  document.getElementById("s-export").onclick = () => {
    const data = JSON.stringify({
      settings: state.settings,
      tiles: state.tiles,
      pages: state.pages,
    });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speeddial-native-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileInput = document.getElementById("import-file");
  document.getElementById("s-import").onclick = () => {
    fileInput.dataset.mode = "native";
    fileInput.click();
  };
  document.getElementById("s-import-sd2").onclick = () => {
    fileInput.dataset.mode = "sd2";
    fileInput.click();
  };

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (fileInput.dataset.mode === "sd2") {
          const sd2Pages = (json.groups || []).map((g) => ({
            id: String(g.id),
            name: g.title,
          }));
          const sd2Tiles = (json.dials || []).map((d) => ({
            id: String(d.id || Math.random()),
            title: d.title,
            url: d.url,
            imageUrl: d.thumbnail || "",
            position: d.position,
            pageId: String(d.idgroup),
          }));
          state.pages = sd2Pages.length ? sd2Pages : state.pages;
          state.tiles = sd2Tiles.length ? sd2Tiles : state.tiles;
          state.activePageId = state.pages[0].id;
        } else {
          state.settings = json.settings || state.settings;
          state.tiles = json.tiles || state.tiles;
          state.pages = json.pages || state.pages;
          state.activePageId = state.pages[0].id;
        }
        if (saveState()) {
          close();
          render();
        }
      } catch (err) {
        alert("Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  document.getElementById("s-reset").onclick = () => {
    if (confirm("Reset EVERYTHING to defaults?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  document.getElementById("s-apply").onclick = () => {
    const colsInput = document.getElementById("s-cols");
    if (colsInput) {
      state.settings.cols = Math.min(
        12,
        Math.max(1, parseInt(colsInput.value) || 4),
      );
    }

    document.querySelectorAll(".group-edit").forEach((inp) => {
      const g = state.pages.find((p) => p.id === inp.dataset.groupId);
      if (g) g.name = inp.value;
    });
    // Final check for successful save before closing modal
    if (saveState()) {
      close();
      render();
    }
  };
};

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
render();