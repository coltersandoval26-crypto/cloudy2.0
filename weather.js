export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation&current_weather=true&hourly=temperature_2m,precipitation_probability,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,precipitation_sum&timezone=auto`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Weather request failed with ${res.status}`);
  }

  return res.json();
}
