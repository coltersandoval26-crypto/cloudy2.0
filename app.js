import {fetchWeather} from "./weather.js"
import {searchCity} from "./search.js"
import {drawHourlyChart} from "./charts.js"
import {createRadar} from "./radar.js"
import {saveRecent} from "./storage.js"

const input =
document.getElementById("search")

const sug =
document.getElementById("suggestions")

input.addEventListener("input",async ()=>{

const results =
await searchCity(input.value)

sug.innerHTML=""

results.slice(0,6).forEach(r=>{

const div=document.createElement("div")

div.className="suggestion"

div.textContent=
r.name+", "+r.country

div.onclick=()=>{

loadLocation(
r.latitude,
r.longitude,
r.name
)

}

sug.appendChild(div)

})

})

async function loadLocation(lat,lon,name){

const data =
await fetchWeather(lat,lon)

document.getElementById("city").textContent=name

document.getElementById("temp").textContent=
data.current_weather.temperature+"°"

drawHourlyChart(data)

createRadar(lat,lon)

saveRecent(name)

}
