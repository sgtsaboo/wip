import { state, saveState } from "../modules/state.js";
import { modalRoot, render } from "./render.js";
import { findEngineKeyByUrl, hexToRgb } from "../utils.js";
import { createIcons, icons } from "lucide";

export const openEditModal = (tileId) => {
  const tile = tileId
    ? state.tiles.find((t) => t.id === tileId)
    : { title: "", url: "", imageUrl: "", pageId: state.activePageId };

  modalRoot.innerHTML = `
    <div class="modal-overlay animate-fade-in">
      <div class="modal-content animate-zoom-in">
        <div class="modal-header">
          <h2>${tileId ? "Edit Link" : "Add New Link"}</h2>
          <button id="modal-close" class="modal-close">X</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">URL</label>
            <input id="form-url" type="text" value="${tile.url}" placeholder="https://..." class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Title</label>
            <input id="form-title" type="text" value="${tile.title}" placeholder="My Site" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Custom Image URL (Optional)</label>
            <input id="form-image" type="text" value="${tile.imageUrl || ""}" placeholder="https://..." class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Group</label>
            <select id="form-group" class="form-select">
              ${state.pages.map((p) => `<option value="${p.id}" ${p.id === tile.pageId ? "selected" : ""}>${p.name}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="modal-footer">
          ${tileId ? `<button id="form-delete" class="btn btn-danger">Delete</button>` : ""}
          <div style="flex: 1;"></div>
          <button id="form-cancel" class="btn btn-secondary">Cancel</button>
          <button id="form-save" class="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("modal-close").onclick = document.getElementById("form-cancel").onclick = () => (modalRoot.innerHTML = "");
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
    const title = document.getElementById("form-title").value || (url ? new URL(url).hostname : "New Site");
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

export const openSettings = () => {
  modalRoot.innerHTML = `
    <div class="modal-overlay animate-fade-in">
      <div class="modal-content animate-zoom-in" style="max-width: 64rem; max-height: 70vh; overflow-y: auto;">
        <div class="modal-header">
          <h2><i data-lucide="settings" style="display: inline; margin-right: 0.5rem;"></i>Settings</h2>
          <button id="s-close" class="modal-close">X</button>
        </div>
        <div class="modal-body" style="gap: 2rem;">
          <!-- Theme Toggle -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <button id="s-theme" style="padding: 1rem; border: 1px solid; border-radius: 0.75rem; text-align: left;">
              <div style="font-size: 0.625rem; text-transform: uppercase; opacity: 0.5;">Theme</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem;">
                <span style="font-size: 0.875rem;">${state.settings.theme === "dark" ? "Dark" : "Light"}</span>
              </div>
            </button>
            <button id="s-weather-toggle" style="padding: 1rem; border: 1px solid; border-radius: 0.75rem; text-align: left;">
              <div style="font-size: 0.625rem; text-transform: uppercase; opacity: 0.5;">Weather</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem;">
                <span style="font-size: 0.875rem;">${state.settings.showWeather ? "On" : "Off"}</span>
              </div>
            </button>
            <button id="s-tab" style="padding: 1rem; border: 1px solid; border-radius: 0.75rem; text-align: left;">
              <div style="font-size: 0.625rem; text-transform: uppercase; opacity: 0.5;">Links</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem;">
                <span style="font-size: 0.875rem;">New Tab</span>
              </div>
            </button>
            <button id="s-notes-pos" style="padding: 1rem; border: 1px solid; border-radius: 0.75rem; text-align: left;">
              <div style="font-size: 0.625rem; text-transform: uppercase; opacity: 0.5;">Notes</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.5rem;">
                <span style="font-size: 0.875rem; text-transform: uppercase;">${state.settings.notesPosition}</span>
              </div>
            </button>
          </div>

          <!-- Color Pickers -->
          <div>
            <label style="font-size: 0.625rem; text-transform: uppercase; opacity: 0.5; display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="palette" size="14"></i> Accent Color
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem; border: 1px solid; border-radius: 0.75rem; margin-top: 0.75rem;">
              ${["#f97316", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]
                .map((c) => `<button class="color-pick" style="width: 2rem; height: 2rem; border: 2px solid transparent; border-radius: 0.5rem; cursor: pointer; background: ${c};" data-color="${c}"></button>`)
                .join("")}
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-left: auto; padding-left: 0.75rem; border-left: 1px solid;">
                <div style="display: flex; flex-direction: column;">
                  <span style="font-size: 0.5rem; opacity: 0.4; text-transform: uppercase;">Custom</span>
                  <span id="accent-hex-display" style="font-size: 0.625rem; font-family: monospace; opacity: 0.8; text-transform: uppercase;">${state.settings.themeColor}</span>
                </div>
                <input type="color" id="s-custom-accent" value="${state.settings.themeColor}" style="width: 2rem; height: 2rem; cursor: pointer; border: none; border-radius: 0.5rem;" />
              </div>
            </div>
          </div>

          <!-- Columns -->
          <div style="padding: 1rem; border: 1px solid; border-radius: 0.75rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.875rem;">Columns</span>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <input id="s-cols" type="number" min="1" max="12" value="${state.settings.cols}" style="width: 4rem; padding: 0.5rem; text-align: center; border: 1px solid; border-radius: 0.5rem;" />
                <span style="font-size: 0.625rem; opacity: 0.4; text-transform: uppercase;">(Max 12)</span>
              </div>
            </div>
          </div>

          <!-- Groups -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
              <label style="font-size: 0.625rem; text-transform: uppercase; opacity: 0.5; display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="layers" size="14"></i> Page Groups
              </label>
              <button id="s-sort-az" style="font-size: 0.625rem; color: var(--theme-color); text-transform: uppercase; letter-spacing: 0.15em; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;">
                <i data-lucide="sort-asc" size="12"></i> Sort A-Z
              </button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${state.pages.map((p) => `
                <div style="display: flex; gap: 0.5rem; align-items: center; padding: 0.25rem; border-radius: 0.75rem;">
                  <div class="drag-handle-groups" style="padding: 0.5rem; opacity: 0.3; cursor: grab;"><i data-lucide="grip-vertical" size="14"></i></div>
                  <input class="group-edit form-input" style="flex: 1;" value="${p.name}" data-group-id="${p.id}" />
                  <button class="group-del" style="padding: 0.5rem; color: #ef4444; opacity: 0.5; background: none; border: none; cursor: pointer;" data-group-id="${p.id}"><i data-lucide="trash-2" size="16"></i></button>
                </div>
              `).join("")}
              <button id="s-add-group" style="width: 100%; padding: 0.75rem; border: 2px dashed; border-radius: 0.75rem; background: none; opacity: 0.5; cursor: pointer; font-size: 0.875rem; text-transform: uppercase;">+ New Group</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="s-reset" style="color: #ef4444; opacity: 0.5;">Reset All</button>
          <div style="flex: 1;"></div>
          <button id="s-apply" class="btn btn-primary">Apply & Save</button>
        </div>
      </div>
    </div>
  `;

  const settingsEngineSelect = document.getElementById("s-engine-select");
  if (settingsEngineSelect) {
    settingsEngineSelect.innerHTML = "";
    Object.keys(window.SEARCH_CONFIG.engines).forEach((key) => {
      const engine = window.SEARCH_CONFIG.engines[key];
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = engine.name;
      settingsEngineSelect.appendChild(opt);
    });

    const saved = state.settings && state.settings.defaultSearchEngine;
    const savedIsKey = saved && window.SEARCH_CONFIG.engines && window.SEARCH_CONFIG.engines[saved];
    const savedIsUrl = saved && findEngineKeyByUrl(saved);
    const selectedKey = savedIsKey ? saved : savedIsUrl ? findEngineKeyByUrl(saved) : window.SEARCH_CONFIG.defaultEngine;
    settingsEngineSelect.value = selectedKey;

    settingsEngineSelect.onchange = (e) => {
      state.settings.defaultSearchEngine = e.target.value;
      saveState();
      const mainEngineSelect = document.getElementById("engine-select");
      if (mainEngineSelect) mainEngineSelect.value = e.target.value;
    };
  }

  createIcons({ icons });
  attachSettingsEvents();
};

const attachSettingsEvents = () => {
  document.getElementById("s-close").onclick = () => (modalRoot.innerHTML = "");

  document.getElementById("s-theme").onclick = () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    state.settings.backgroundColor = state.settings.theme === "dark" ? "#020617" : "#f3f4f6";
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
    state.settings.notesPosition = state.settings.notesPosition === "left" ? "right" : "left";
    openSettings();
  };

  document.querySelectorAll(".color-pick").forEach((b) => {
    b.onclick = () => {
      state.settings.themeColor = b.dataset.color;
      openSettings();
    };
  });

  const accentPicker = document.getElementById("s-custom-accent");
  const accentHex = document.getElementById("accent-hex-display");
  if (accentPicker) {
    accentPicker.oninput = (e) => {
      const val = e.target.value;
      state.settings.themeColor = val;
      if (accentHex) accentHex.innerText = val;
      document.documentElement.style.setProperty("--theme-color", val);
    };
  }

  const addGroupBtn = document.getElementById("s-add-group");
  if (addGroupBtn) {
    addGroupBtn.onclick = () => {
      state.pages.push({ id: "p" + Date.now(), name: "New Group" });
      openSettings();
    };
  }

  const sortAzBtn = document.getElementById("s-sort-az");
  if (sortAzBtn) {
    sortAzBtn.onclick = () => {
      state.pages.sort((a, b) => a.name.localeCompare(b.name));
      openSettings();
    };
  }

  document.querySelectorAll(".group-del").forEach((b) => {
    b.onclick = () => {
      if (state.pages.length > 1) {
        state.pages = state.pages.filter((p) => p.id !== b.dataset.groupId);
        if (state.activePageId === b.dataset.groupId) state.activePageId = state.pages[0].id;
        openSettings();
      }
    };
  });

  const applyBtn = document.getElementById("s-apply");
  if (applyBtn) {
    applyBtn.onclick = () => {
      const colsInput = document.getElementById("s-cols");
      if (colsInput) {
        state.settings.cols = Math.min(12, Math.max(1, parseInt(colsInput.value) || 4));
      }

      document.querySelectorAll(".group-edit").forEach((inp) => {
        const g = state.pages.find((p) => p.id === inp.dataset.groupId);
        if (g) g.name = inp.value;
      });

      if (saveState()) {
        modalRoot.innerHTML = "";
        render();
      }
    };
  }

  const resetBtn = document.getElementById("s-reset");
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm("Reset EVERYTHING to defaults?")) {
        localStorage.clear();
        window.location.reload();
      }
    };
  }
};
