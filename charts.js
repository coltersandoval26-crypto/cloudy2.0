let hourlyChart;

export function drawHourlyChart(data) {
  const ctx = document.getElementById("hourlyChart");

  if (hourlyChart) {
    hourlyChart.destroy();
  }

  hourlyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.hourly.time.slice(0, 24).map((time) =>
        new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      ),
      datasets: [
        {
          label: "Temperature (°C)",
          data: data.hourly.temperature_2m.slice(0, 24),
          borderColor: "#4cc9f0",
          backgroundColor: "rgba(76, 201, 240, 0.2)",
          fill: true,
          tension: 0.3,
          yAxisID: "y",
        },
        {
          label: "Rain Chance (%)",
          data: data.hourly.precipitation_probability.slice(0, 24),
          borderColor: "#a78bfa",
          backgroundColor: "rgba(167, 139, 250, 0.15)",
          borderDash: [4, 4],
          tension: 0.25,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "#e2e8f0",
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#94a3b8",
            maxRotation: 0,
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
          },
        },
        y: {
          ticks: {
            color: "#94a3b8",
          },
          grid: {
            color: "rgba(148, 163, 184, 0.15)",
          },
        },
        y1: {
          position: "right",
          min: 0,
          max: 100,
          ticks: {
            color: "#94a3b8",
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  });
}
