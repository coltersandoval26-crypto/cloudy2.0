export async function searchCity(query) {
  if (query.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=10&language=en&format=json`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Search failed with ${res.status}`);
  }

  const data = await res.json();

  return data.results || [];
}

export async function reverseGeocode(lat, lon) {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Reverse geocode failed with ${res.status}`);
  }

  const data = await res.json();
  return data.results?.[0] || null;
}
