import { state, saveState } from "./modules/state.js";
import { render } from "./ui/render.js";
import { openEditModal, openSettings } from "./ui/modals.js";
import Sortable from "sortablejs";

export const attachAppEvents = () => {
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
