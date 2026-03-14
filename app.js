import { fetchWeather } from "./weather.js";
import { searchCity } from "./search.js";
import { drawHourlyChart } from "./charts.js";
import { createRadar } from "./radar.js";
import { saveRecent, getRecent } from "./storage.js";

const input = document.getElementById("search");
const suggestions = document.getElementById("suggestions");
const cityEl = document.getElementById("city");
const conditionEl = document.getElementById("condition");
const tempEl = document.getElementById("temp");
const detailsEl = document.getElementById("details");
const metricsEl = document.getElementById("metrics");
const dailyEl = document.getElementById("daily");
const recentEl = document.getElementById("recent");

let latestResults = [];

const weatherCodes = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  95: "Thunderstorm",
};

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
  const rainChance = data.daily.precipitation_probability_max || [];

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
      <p>Rain: ${Math.round(rainChance[index] ?? 0)}%</p>
    `;

    dailyEl.appendChild(card);
  });
};

const renderMetrics = (data) => {
  const current = data.current || {};
  const daily = data.daily || {};
  const sunrise = daily.sunrise?.[0];
  const sunset = daily.sunset?.[0];

  const metrics = [
    ["Feels like", `${Math.round(current.apparent_temperature ?? 0)}°C`],
    ["Humidity", `${Math.round(current.relative_humidity_2m ?? 0)}%`],
    ["Pressure", `${Math.round(current.surface_pressure ?? 0)} hPa`],
    ["Wind Dir", `${Math.round(current.wind_direction_10m ?? 0)}°`],
    ["Sunrise", sunrise ? new Date(sunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"],
    ["Sunset", sunset ? new Date(sunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-"],
  ];

  metricsEl.innerHTML = metrics
    .map(
      ([label, value]) =>
        `<article class="metric-card"><div class="label">${label}</div><div class="value">${value}</div></article>`
    )
    .join("");
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
  latestResults = await searchCity(query);
  renderSuggestions(latestResults);
});

input.addEventListener("input", runSearch);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && latestResults[0]) {
    const city = latestResults[0];
    loadLocation(city.latitude, city.longitude, city.name);
    input.value = city.name;
    suggestions.innerHTML = "";
  }
});

document.addEventListener("click", (event) => {
  if (!suggestions.contains(event.target) && event.target !== input) {
    suggestions.innerHTML = "";
  }
});

async function loadLocation(lat, lon, name) {
  try {
    cityEl.textContent = name;
    conditionEl.textContent = "";
    tempEl.textContent = "Loading...";
    detailsEl.textContent = "";

    const data = await fetchWeather(lat, lon);
    const current = data.current || {};

    tempEl.textContent = `${Math.round(current.temperature_2m ?? data.current_weather.temperature)}°`;
    conditionEl.textContent = weatherCodes[current.weather_code] || "Current conditions";
    detailsEl.textContent = `Wind ${Math.round(
      current.wind_speed_10m ?? data.current_weather.windspeed
    )} km/h · Updated ${new Date(
      current.time ?? data.current_weather.time
    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    drawHourlyChart(data);
    renderDaily(data);
    renderMetrics(data);
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
