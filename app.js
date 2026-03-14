import { fetchWeather } from "./weather.js";
import { searchCity, reverseGeocode } from "./search.js";
import { drawHourlyChart } from "./charts.js";
import { createRadar } from "./radar.js";
import { saveRecent, getRecent } from "./storage.js";

const input = document.getElementById("search");
const locateBtn = document.getElementById("locate");
const suggestions = document.getElementById("suggestions");
const statusEl = document.getElementById("status");
const cityEl = document.getElementById("city");
const conditionEl = document.getElementById("condition");
const weatherIconEl = document.getElementById("weatherIcon");
const tempEl = document.getElementById("temp");
const detailsEl = document.getElementById("details");
const metricsEl = document.getElementById("metrics");
const hourlyCardsEl = document.getElementById("hourlyCards");
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
let highlightedSuggestion = -1;
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
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe hailstorm",
};

const weatherIcons = {
  0: "icons/weather-code-0.svg",
  1: "icons/weather-code-1.svg",
  2: "icons/weather-code-2.svg",
  3: "icons/weather-code-3.svg",
  45: "icons/weather-code-45.svg",
  48: "icons/weather-code-48.svg",
  51: "icons/weather-code-51.svg",
  53: "icons/weather-code-53.svg",
  55: "icons/weather-code-55.svg",
  56: "icons/weather-code-56.svg",
  57: "icons/weather-code-57.svg",
  61: "icons/weather-code-61.svg",
  63: "icons/weather-code-63.svg",
  65: "icons/weather-code-65.svg",
  66: "icons/weather-code-66.svg",
  67: "icons/weather-code-67.svg",
  71: "icons/weather-code-71.svg",
  73: "icons/weather-code-73.svg",
  75: "icons/weather-code-75.svg",
  77: "icons/weather-code-77.svg",
  80: "icons/weather-code-80.svg",
  81: "icons/weather-code-81.svg",
  82: "icons/weather-code-82.svg",
  95: "icons/weather-code-95.svg",
  96: "icons/weather-code-96.svg",
  99: "icons/weather-code-99.svg",
};

const debounce = (fn, delay = 220) => {
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
  const numeric = Number(value ?? 0);
  const v = preferences.temp === "f" ? cToF(numeric) : numeric;
  return `${Math.round(v)}°${preferences.temp === "f" ? "F" : "C"}`;
};

const formatSpeed = (value) => {
  const numeric = Number(value ?? 0);
  const v = preferences.speed === "mi" ? kmhToMph(numeric) : numeric;
  return `${Math.round(v)} ${preferences.speed === "mi" ? "mph" : "km/h"}`;
};

const formatRain = (mm) => {
  const numeric = Number(mm ?? 0);
  const v = preferences.rain === "in" ? mmToIn(numeric) : mmToCm(numeric);
  return `${v.toFixed(2)} ${preferences.rain === "in" ? "in" : "cm"}`;
};

const setStatus = (message = "") => {
  statusEl.textContent = message;
};

const getLocationName = (item) => [item.name, item.admin1, item.country].filter(Boolean).join(", ");

const selectSuggestion = (index) => {
  if (!latestResults[index]) return;
  const city = latestResults[index];
  const locationName = getLocationName(city);
  loadLocation(city.latitude, city.longitude, locationName);
  input.value = locationName;
  suggestions.innerHTML = "";
  highlightedSuggestion = -1;
};

const highlightSuggestion = () => {
  const items = suggestions.querySelectorAll(".suggestion");
  items.forEach((item, index) => {
    item.classList.toggle("is-active", index === highlightedSuggestion);
  });
};

const renderSuggestions = (results) => {
  suggestions.innerHTML = "";
  highlightedSuggestion = -1;

  results.slice(0, 8).forEach((result, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion";

    const locationName = getLocationName(result);
    const precision = `${Number(result.latitude).toFixed(4)}, ${Number(result.longitude).toFixed(4)}`;

    button.innerHTML = `<strong>${locationName}</strong><br /><small>Precision: ${precision}</small>`;

    button.addEventListener("click", () => {
      selectSuggestion(index);
    });

    suggestions.appendChild(button);
  });
};

const renderHourlyCards = (data) => {
  const times = data.hourly.time || [];
  const temps = data.hourly.temperature_2m || [];
  const pops = data.hourly.precipitation_probability || [];
  const precip = data.hourly.precipitation || [];
  const codes = data.hourly.weather_code || [];

  hourlyCardsEl.innerHTML = "";

  times.slice(0, 8).forEach((time, index) => {
    const card = document.createElement("article");
    card.className = "hourly-card";

    const label = new Date(time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    card.innerHTML = `
      <div class="time">${label}</div>
      <div class="icon"><img class="hourly-icon-img" src="${weatherIcons[codes[index]] || "icons/weather-default.svg"}" alt="hourly weather icon" /></div>
      <div class="temp">${formatTemp(temps[index] ?? 0)}</div>
      <div class="time">Rain ${Math.round(pops[index] ?? 0)}%</div>
      <div class="time">Depth ${formatRain(precip[index] ?? 0)}</div>
    `;

    hourlyCardsEl.appendChild(card);
  });
};

const renderDaily = (data) => {
  const dates = data.daily.time || [];
  const highs = data.daily.temperature_2m_max || [];
  const lows = data.daily.temperature_2m_min || [];
  const rainChance = data.daily.precipitation_probability_max || [];
  const precipitation = data.daily.precipitation_sum || [];
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
        <span class="day-icon"><img class="day-icon-img" src="${weatherIcons[codes[index]] || "icons/weather-default.svg"}" alt="daily weather icon" /></span>
      </div>
      <p>High: ${formatTemp(highs[index])}</p>
      <p>Low: ${formatTemp(lows[index])}</p>
      <p>Rain chance: ${Math.round(rainChance[index] ?? 0)}%</p>
      <p>Rain depth: ${formatRain(precipitation[index] ?? 0)}</p>
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
    ["Feels like", formatTemp(current.apparent_temperature)],
    ["Humidity", `${Math.round(current.relative_humidity_2m ?? 0)}%`],
    ["Pressure", `${Math.round(current.surface_pressure ?? 0)} hPa`],
    ["Wind", formatSpeed(current.wind_speed_10m)],
    ["UV Index", `${Number(current.uv_index ?? 0).toFixed(1)}`],
    ["Cloud Cover", `${Math.round(current.cloud_cover ?? 0)}%`],
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
      try {
        const matches = await searchCity(cityName);
        if (matches[0]) {
          loadLocation(matches[0].latitude, matches[0].longitude, getLocationName(matches[0]));
        }
      } catch {
        setStatus("Could not load recent location right now.");
      }
    });
    recentEl.appendChild(chip);
  });
};

const runSearch = debounce(async () => {
  const query = input.value.trim();
  if (!query) {
    suggestions.innerHTML = "";
    latestResults = [];
    setStatus("");
    return;
  }

  try {
    latestResults = await searchCity(query);
    renderSuggestions(latestResults);
    setStatus(latestResults.length ? "" : "No locations found.");
  } catch {
    setStatus("Location search is unavailable right now. Please try again.");
  }
});

const rerenderCurrent = () => {
  if (!currentContext) return;
  const { data } = currentContext;
  const current = data.current || {};
  const temperature = current.temperature_2m ?? data.current_weather?.temperature;
  const windSpeed = current.wind_speed_10m ?? data.current_weather?.windspeed;

  tempEl.textContent = formatTemp(temperature);
  detailsEl.textContent = `${data.timezone_abbreviation || data.timezone || "Local"} · Wind ${formatSpeed(
    windSpeed
  )} · Updated ${new Date(current.time ?? data.current_weather?.time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  drawHourlyChart(data, preferences);
  renderHourlyCards(data);
  renderDaily(data);
  renderMetrics(data);
};

async function loadLocation(lat, lon, name) {
  try {
    cityEl.textContent = name;
    conditionEl.textContent = "";
    weatherIconEl.innerHTML = `<img class="current-icon-img" src="icons/weather-default.svg" alt="current weather icon" />`;
    tempEl.textContent = "Loading...";
    detailsEl.textContent = "";
    setStatus("Updating forecast...");

    const data = await fetchWeather(lat, lon);
    const current = data.current || {};

    currentContext = { lat, lon, name, data };

    tempEl.textContent = formatTemp(current.temperature_2m ?? data.current_weather.temperature);
    conditionEl.textContent = weatherCodes[current.weather_code] || "Current conditions";
    weatherIconEl.innerHTML = `<img class="current-icon-img" src="${weatherIcons[current.weather_code] || "icons/weather-default.svg"}" alt="${weatherCodes[current.weather_code] || "current weather"}" />`;
    detailsEl.textContent = `${data.timezone_abbreviation || data.timezone || "Local"} · Wind ${formatSpeed(
      current.wind_speed_10m ?? data.current_weather.windspeed
    )} · Updated ${new Date(current.time ?? data.current_weather.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    drawHourlyChart(data, preferences);
    renderHourlyCards(data);
    renderDaily(data);
    renderMetrics(data);
    createRadar(lat, lon);

    saveRecent(name);
    renderRecent();
    setStatus("");
  } catch {
    tempEl.textContent = "Couldn't load weather";
    detailsEl.textContent = "Please try another location.";
    setStatus("Weather service unavailable. Please retry shortly.");
  }
}

input.addEventListener("input", runSearch);
input.addEventListener("keydown", (event) => {
  if (!latestResults.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    highlightedSuggestion = (highlightedSuggestion + 1) % latestResults.length;
    highlightSuggestion();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    highlightedSuggestion = highlightedSuggestion <= 0 ? latestResults.length - 1 : highlightedSuggestion - 1;
    highlightSuggestion();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    selectSuggestion(highlightedSuggestion >= 0 ? highlightedSuggestion : 0);
    return;
  }

  if (event.key === "Escape") {
    suggestions.innerHTML = "";
    highlightedSuggestion = -1;
  }
});

document.addEventListener("click", (event) => {
  if (!suggestions.contains(event.target) && event.target !== input) {
    suggestions.innerHTML = "";
  }
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported in this browser.");
    return;
  }

  locateBtn.disabled = true;
  locateBtn.textContent = "Locating...";
  setStatus("Requesting high-accuracy location...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      try {
        const reverse = await reverseGeocode(latitude, longitude);
        const locationLabel = reverse
          ? `${getLocationName(reverse)} (~${Math.round(accuracy)}m)`
          : `My Precise Location (~${Math.round(accuracy)}m)`;
        await loadLocation(latitude, longitude, locationLabel);
      } catch {
        await loadLocation(latitude, longitude, `My Precise Location (~${Math.round(accuracy)}m)`);
      }
      locateBtn.disabled = false;
      locateBtn.textContent = "📍 Use precise location";
    },
    () => {
      setStatus("Unable to access location. Check browser permissions and try again.");
      locateBtn.disabled = false;
      locateBtn.textContent = "📍 Use precise location";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
