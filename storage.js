const RECENT_KEY = "recent";
const FAVORITES_KEY = "favorites";

export function getRecent() {
  return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
}

export function saveRecent(city) {
  let list = getRecent();

  if (!list.includes(city)) {
    list.unshift(city);
    list = list.slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }
}

export function getFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
}

export function saveFavorite(location) {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.name === location.name);
  if (exists) return;

  favorites.unshift(location);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 8)));
}

export function removeFavorite(name) {
  const favorites = getFavorites().filter((item) => item.name !== name);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}
