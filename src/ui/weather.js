import { state } from "../modules/state.js";
import { createIcons, icons } from "lucide";

export const fetchWeather = async () => {
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

    return `
      <div data-lat="${r.lat}" data-lng="${r.lng}" class="weather-widget-card">
        <div class="weather-card-header">
          <div class="weather-card-info">
            <div class="weather-card-location">${r.location}</div>
            <div class="weather-card-temp">${temp}${unitSymbol}</div>
          </div>
          <i data-lucide="${r.data.is_day ? "sun" : "moon"}" class="weather-card-icon"></i>
        </div>
        ${
          state.settings.weatherStyle === "detailed"
            ? `
          <div class="weather-card-details">
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
  attachWeatherEvents();
};

const attachWeatherEvents = () => {
  document.querySelectorAll(".weather-widget-card").forEach((card) => {
    card.onclick = () =>
      window.open(
        `https://www.wunderground.com/weather/${card.dataset.lat},${card.dataset.lng}`,
        "_blank",
      );
  });
};
