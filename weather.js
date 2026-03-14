export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation,uv_index,cloud_cover&current_weather=true&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum&timezone=auto`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Weather request failed with ${res.status}`);
  }

  return res.json();
}

export async function fetchAirQuality(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone&timezone=auto`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Air quality request failed with ${res.status}`);
  }

  return res.json();
}
