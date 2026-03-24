import { state, saveState } from "./state.js";
import { findEngineKeyByUrl } from "../utils.js";

let _globalSearchKeyAttached = false;

export const initSearch = () => {
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const engineSelect = document.getElementById("engine-select");
  if (!searchForm || !searchInput || !engineSelect) return;

  // Build dropdown options from SEARCH_CONFIG (use keys as values)
  engineSelect.innerHTML = "";
  Object.keys(window.SEARCH_CONFIG.engines).forEach((key) => {
    const engine = window.SEARCH_CONFIG.engines[key];
    const option = document.createElement("option");
    option.value = key; // use engine key (e.g. "google")
    option.textContent = engine.name;
    engineSelect.appendChild(option);
  });

  // Determine currently saved engine (support both key and legacy URL)
  const saved = state.settings && state.settings.defaultSearchEngine;
  const savedIsKey =
    saved && window.SEARCH_CONFIG.engines && window.SEARCH_CONFIG.engines[saved];
  const savedIsUrl = saved && findEngineKeyByUrl(saved);
  const selectedKey = savedIsKey
    ? saved
    : savedIsUrl
      ? findEngineKeyByUrl(saved)
      : window.SEARCH_CONFIG.defaultEngine;
  engineSelect.value = selectedKey;

  // Persist default when changed - save engine key into state.settings and persist
  // (attach to this DOM element instance)
  engineSelect.addEventListener("change", () => {
    state.settings.defaultSearchEngine = engineSelect.value; // store key
    saveState();
  });

  // Execute search on submit: build URL from selected engine key
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    const key = engineSelect.value;
    const engine =
      window.SEARCH_CONFIG.engines[key] ||
      window.SEARCH_CONFIG.engines[window.SEARCH_CONFIG.defaultEngine];
    const url =
      (engine && engine.url) ||
      window.SEARCH_CONFIG.engines[window.SEARCH_CONFIG.defaultEngine].url;
    window.open(url + encodeURIComponent(query), "_blank");
    searchInput.value = "";
  });

  // Attach global '/' key to focus the search input exactly once
  if (!_globalSearchKeyAttached) {
    window.addEventListener("keydown", (e) => {
      if (
        e.key === "/" &&
        document.activeElement !== document.getElementById("search-input")
      ) {
        // Prevent typing "/" into some other input
        e.preventDefault();
        const si = document.getElementById("search-input");
        if (si) si.focus();
      }
    });
    _globalSearchKeyAttached = true;
  }
};
