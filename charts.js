export function drawHourlyChart(data){

const ctx =
document.getElementById("hourlyChart");

new Chart(ctx,{

type:"line",

data:{

labels:data.hourly.time.slice(0,24),

datasets:[{

label:"Temperature",

data:data.hourly.temperature_2m.slice(0,24)

}]

}

});

}
