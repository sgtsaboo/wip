// --- Utilities ---

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "0, 0, 0";
};

export const getFavicon = (url) =>
  `https://www.google.com/s2/favicons?sz=128&domain=${url}`;

// Map URL -> engine key (for backwards compatibility)
export const findEngineKeyByUrl = (val) => {
  if (!val) return null;
  const keys = Object.keys(window.SEARCH_CONFIG.engines || {});
  for (const k of keys) {
    if (window.SEARCH_CONFIG.engines[k].url === val) return k;
  }
  return null;
};
