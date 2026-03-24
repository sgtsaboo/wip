import { state } from "../modules/state.js";

export const renderNotesWidget = () => {
  const noteText = localStorage.getItem("speeddial_quicknote") || "";
  return `
    <div class="notes-widget">
      <div class="notes-header">
        <i data-lucide="sticky-note" size="14"></i> Quick Notes
      </div>
      <textarea id="notes-input" placeholder="Jot something down...">${noteText}</textarea>
    </div>
  `;
};

export const attachNotesEvents = () => {
  const nInput = document.getElementById("notes-input");
  if (nInput)
    nInput.oninput = (e) =>
      localStorage.setItem("speeddial_quicknote", e.target.value);
};
