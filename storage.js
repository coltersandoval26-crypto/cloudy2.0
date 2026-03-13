export function saveRecent(city){

let list =
JSON.parse(localStorage.getItem("recent") || "[]");

if(!list.includes(city)){

list.unshift(city);

list = list.slice(0,5);

localStorage.setItem("recent",
JSON.stringify(list));

}

}
