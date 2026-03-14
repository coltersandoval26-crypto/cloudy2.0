import { fetchWeather } from "./weather.js";
import { searchCity } from "./search.js";
import { drawHourlyChart } from "./charts.js";
import { createRadar } from "./radar.js";
import { saveRecent, getRecent } from "./storage.js";

const input = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const cityEl = document.getElementById("city");
const tempEl = document.getElementById("temp");
const detailsEl = document.getElementById("details");
const dailyEl = document.getElementById("daily");
const recentEl = document.getElementById("recent");

const debounce = (fn, delay = 250) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const renderSuggestions = (results) => {
  suggestions.innerHTML = "";

  results.slice(0, 6).forEach((result) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion";
    button.textContent = `${result.name}, ${result.country}`;

    button.addEventListener("click", () => {
      loadLocation(result.latitude, result.longitude, result.name);
      input.value = result.name;
      suggestions.innerHTML = "";
    });

    suggestions.appendChild(button);
  });
};

const renderDaily = (data) => {
  const dates = data.daily.time || [];
  const highs = data.daily.temperature_2m_max || [];
  const lows = data.daily.temperature_2m_min || [];

  dailyEl.innerHTML = "";

  dates.slice(0, 7).forEach((date, index) => {
    const card = document.createElement("article");
    card.className = "day-card";

    const label = new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    card.innerHTML = `
      <h4>${label}</h4>
      <p>High: ${Math.round(highs[index])}°</p>
      <p>Low: ${Math.round(lows[index])}°</p>
    `;

    dailyEl.appendChild(card);
  });
};

const renderRecent = async () => {
  const recent = getRecent();
  recentEl.innerHTML = "";

  recent.forEach((cityName) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "recent-chip";
    chip.textContent = cityName;
    chip.addEventListener("click", async () => {
      const matches = await searchCity(cityName);
      if (matches[0]) {
        loadLocation(matches[0].latitude, matches[0].longitude, matches[0].name);
      }
    });
    recentEl.appendChild(chip);
  });
};

const runSearch = debounce(async () => {
  const query = input.value.trim();
  const results = await searchCity(query);
  renderSuggestions(results);
});

input.addEventListener("input", runSearch);

document.addEventListener("click", (event) => {
  if (!suggestions.contains(event.target) && event.target !== input) {
    suggestions.innerHTML = "";
  }
});

async function loadLocation(lat, lon, name) {
  try {
    cityEl.textContent = name;
    tempEl.textContent = "Loading...";
    detailsEl.textContent = "";

    const data = await fetchWeather(lat, lon);

    tempEl.textContent = `${Math.round(data.current_weather.temperature)}°`;
    detailsEl.textContent = `Wind ${Math.round(data.current_weather.windspeed)} km/h · Updated ${new Date(
      data.current_weather.time
    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    drawHourlyChart(data);
    renderDaily(data);
    createRadar(lat, lon);

    saveRecent(name);
    renderRecent();
  } catch (error) {
    tempEl.textContent = "Couldn't load weather";
    detailsEl.textContent = "Please try another location.";
  }
}

renderRecent();
loadLocation(40.7128, -74.006, "New York");
