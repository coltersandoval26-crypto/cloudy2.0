export async function fetchWeather(lat, lon){

const url =
`https://api.open-meteo.com/v1/forecast?
latitude=${lat}
&longitude=${lon}
&current_weather=true
&hourly=temperature_2m,precipitation_probability
&daily=temperature_2m_max,temperature_2m_min
&timezone=auto`;

const res = await fetch(url);

return await res.json();

}
