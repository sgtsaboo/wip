import { state } from "../modules/state.js";
import { createIcons, icons } from "lucide";

export const renderCalendar = () => {
  const area = document.getElementById("calendar-area");
  if (!area) return;
  const viewDate = state.calendarViewDate;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  area.innerHTML = `
    <div class="calendar-widget">
      <div class="calendar-header">
        <button id="cal-prev"><i data-lucide="chevron-left" size="16"></i></button>
        <div>${viewDate.toLocaleString("default", { month: "long", year: "numeric" })}</div>
        <button id="cal-next"><i data-lucide="chevron-right" size="16"></i></button>
      </div>
      <div class="calendar-grid">
        ${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<div>${d}</div>`).join("")}
        ${Array(firstDay).fill(0).map(() => "<div></div>").join("")}
        ${Array.from({ length: daysInMonth }, (_, i) => i + 1)
          .map((d) => {
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return `<button data-day="${d}" class="cal-day ${isToday ? "today" : ""}">${d}</button>`;
          }).join("")}
      </div>
      <button id="cal-today">Today</button>
    </div>
  `;
  createIcons({ icons });
  attachCalendarEvents();
};

const attachCalendarEvents = () => {
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
      const viewDate = state.calendarViewDate;
      const month = viewDate.getMonth();
      const year = viewDate.getFullYear();
      const m = (month + 1).toString().padStart(2, "0");
      const d = day.padStart(2, "0");
      window.open(
        `https://calendar.google.com/calendar/u/0/r/day/${year}/${m}/${d}`,
        "_blank",
      );
    };
  });
};
