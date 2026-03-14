const RECENT_KEY = "recent";

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
