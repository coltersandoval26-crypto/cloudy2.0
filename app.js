import { fetchWeather } from "./weather.js";
import { searchCity } from "./search.js";
import { drawHourlyChart } from "./charts.js";
import { createRadar } from "./radar.js";
import { saveRecent, getRecent } from "./storage.js";

const input = document.getElementById("search");
const locateBtn = document.getElementById("locate");
const suggestions = document.getElementById("suggestions");
const cityEl = document.getElementById("city");
const conditionEl = document.getElementById("condition");
const weatherIconEl = document.getElementById("weatherIcon");
const tempEl = document.getElementById("temp");
const detailsEl = document.getElementById("details");
const metricsEl = document.getElementById("metrics");
const dailyEl = document.getElementById("daily");
const recentEl = document.getElementById("recent");
const tempUnitEl = document.getElementById("unit-temp");
const speedUnitEl = document.getElementById("unit-speed");
const rainUnitEl = document.getElementById("unit-rain");

const preferences = {
  temp: localStorage.getItem("pref-temp") || "c",
  speed: localStorage.getItem("pref-speed") || "km",
  rain: localStorage.getItem("pref-rain") || "cm",
};

let latestResults = [];
let currentContext = null;

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

const weatherIcons = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "⛈️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  80: "🌧️",
  95: "⛈️",
};

const debounce = (fn, delay = 250) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const cToF = (c) => c * 1.8 + 32;
const kmhToMph = (kmh) => kmh * 0.621371;
const mmToCm = (mm) => mm / 10;
const mmToIn = (mm) => mm / 25.4;

const formatTemp = (value) => {
  const v = preferences.temp === "f" ? cToF(value) : value;
  return `${Math.round(v)}°${preferences.temp === "f" ? "F" : "C"}`;
};

const formatSpeed = (value) => {
  const v = preferences.speed === "mi" ? kmhToMph(value) : value;
  return `${Math.round(v)} ${preferences.speed === "mi" ? "mph" : "km/h"}`;
};

const formatRain = (mm) => {
  const v = preferences.rain === "in" ? mmToIn(mm) : mmToCm(mm);
  return `${v.toFixed(2)} ${preferences.rain === "in" ? "in" : "cm"}`;
};

const renderSuggestions = (results) => {
  suggestions.innerHTML = "";

  results.slice(0, 8).forEach((result) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion";

    const locationName = [result.name, result.admin1, result.country].filter(Boolean).join(", ");
    const precision = `(${Number(result.latitude).toFixed(3)}, ${Number(result.longitude).toFixed(3)})`;

    button.innerHTML = `<strong>${locationName}</strong><br /><small>${precision}</small>`;

    button.addEventListener("click", () => {
      loadLocation(result.latitude, result.longitude, locationName);
      input.value = locationName;
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
  const codes = data.daily.weather_code || [];

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
      <div class="day-head">
        <h4>${label}</h4>
        <span class="day-icon">${weatherIcons[codes[index]] || "🌡️"}</span>
      </div>
      <p>High: ${formatTemp(highs[index] ?? 0)}</p>
      <p>Low: ${formatTemp(lows[index] ?? 0)}</p>
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
  const rainToday = daily.precipitation_sum?.[0] ?? 0;

  const metrics = [
    ["Feels like", formatTemp(current.apparent_temperature ?? 0)],
    ["Humidity", `${Math.round(current.relative_humidity_2m ?? 0)}%`],
    ["Pressure", `${Math.round(current.surface_pressure ?? 0)} hPa`],
    ["Wind", formatSpeed(current.wind_speed_10m ?? 0)],
    ["Rain today", formatRain(rainToday)],
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
        const locationName = [matches[0].name, matches[0].admin1, matches[0].country]
          .filter(Boolean)
          .join(", ");
        loadLocation(matches[0].latitude, matches[0].longitude, locationName);
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

const rerenderCurrent = () => {
  if (!currentContext) return;
  drawHourlyChart(currentContext.data, preferences);
  renderDaily(currentContext.data);
  renderMetrics(currentContext.data);

  const current = currentContext.data.current || {};
  const temperature = current.temperature_2m ?? currentContext.data.current_weather?.temperature ?? 0;
  const windSpeed = current.wind_speed_10m ?? currentContext.data.current_weather?.windspeed ?? 0;

  tempEl.textContent = formatTemp(temperature);
  detailsEl.textContent = `Wind ${formatSpeed(windSpeed)} · Updated ${new Date(
    current.time ?? currentContext.data.current_weather?.time
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

async function loadLocation(lat, lon, name) {
  try {
    cityEl.textContent = name;
    conditionEl.textContent = "";
    weatherIconEl.textContent = "⏳";
    tempEl.textContent = "Loading...";
    detailsEl.textContent = "";

    const data = await fetchWeather(lat, lon);
    const current = data.current || {};

    currentContext = { lat, lon, name, data };

    tempEl.textContent = formatTemp(current.temperature_2m ?? data.current_weather.temperature);
    conditionEl.textContent = weatherCodes[current.weather_code] || "Current conditions";
    weatherIconEl.textContent = weatherIcons[current.weather_code] || "🌡️";
    detailsEl.textContent = `Wind ${formatSpeed(
      current.wind_speed_10m ?? data.current_weather.windspeed
    )} · Updated ${new Date(
      current.time ?? data.current_weather.time
    ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    drawHourlyChart(data, preferences);
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

input.addEventListener("input", runSearch);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && latestResults[0]) {
    const city = latestResults[0];
    const locationName = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
    loadLocation(city.latitude, city.longitude, locationName);
    input.value = locationName;
    suggestions.innerHTML = "";
  }
});

document.addEventListener("click", (event) => {
  if (!suggestions.contains(event.target) && event.target !== input) {
    suggestions.innerHTML = "";
  }
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    detailsEl.textContent = "Geolocation is not supported in this browser.";
    return;
  }

  locateBtn.disabled = true;
  locateBtn.textContent = "Locating...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      await loadLocation(latitude, longitude, `My Location (${Math.round(accuracy)}m)`);
      locateBtn.disabled = false;
      locateBtn.textContent = "📍 Use my location";
    },
    () => {
      detailsEl.textContent = "Unable to access your location. Check permissions and try again.";
      locateBtn.disabled = false;
      locateBtn.textContent = "📍 Use my location";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

[tempUnitEl, speedUnitEl, rainUnitEl].forEach((el) => {
  el.addEventListener("change", () => {
    preferences.temp = tempUnitEl.value;
    preferences.speed = speedUnitEl.value;
    preferences.rain = rainUnitEl.value;
    localStorage.setItem("pref-temp", preferences.temp);
    localStorage.setItem("pref-speed", preferences.speed);
    localStorage.setItem("pref-rain", preferences.rain);
    rerenderCurrent();
  });
});

tempUnitEl.value = preferences.temp;
speedUnitEl.value = preferences.speed;
rainUnitEl.value = preferences.rain;

renderRecent();
loadLocation(40.7128, -74.006, "New York, New York, United States");
