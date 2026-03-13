export async function searchCity(query){

if(query.length < 2) return [];

const url =
`https://geocoding-api.open-meteo.com/v1/search?name=${query}`;

const res = await fetch(url);

const data = await res.json();

return data.results || [];

}
