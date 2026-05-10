const BLYNK_TOKEN = "EDraUDvtSJBZxqZD8znQnwuBH7XfNJkF";
const API_URL = `https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}&V0&V1&V2`;
const THRESHOLD = 2500; // Sesuai dengan kode Arduino

// State
let currentTemp = 0;
let currentHum = 0;
let currentSoil = 0;

// DOM Elements
const elPump = document.getElementById('val-pump');
const elPumpDesc = document.getElementById('pump-desc');
const iconPump = document.getElementById('icon-pump');
const statusBadge = document.getElementById('connection-status');
const statusText = statusBadge.querySelector('.status-text');
const lastUpdate = document.getElementById('last-update');

// Chart Options Factory
const createGaugeOptions = (color, valueFormatter) => {
    return {
        series: [0],
        chart: {
            type: 'radialBar',
            height: '100%',
            sparkline: { enabled: true }
        },
        plotOptions: {
            radialBar: {
                startAngle: -90,
                endAngle: 90,
                track: {
                    background: "rgba(255, 255, 255, 0.05)",
                    strokeWidth: '97%',
                    margin: 5,
                    dropShadow: {
                        enabled: true,
                        top: 0,
                        left: 0,
                        color: '#000',
                        opacity: 0.1,
                        blur: 2
                    }
                },
                dataLabels: {
                    name: { show: false },
                    value: {
                        offsetY: -5,
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        color: '#f8fafc',
                        formatter: valueFormatter
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: [color],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        stroke: { lineCap: 'round' },
        colors: [color]
    };
};

// Initialize Charts
const tempChart = new ApexCharts(
    document.querySelector("#chart-temp"), 
    createGaugeOptions('#f97316', () => `${currentTemp.toFixed(1)} °C`)
);
const humChart = new ApexCharts(
    document.querySelector("#chart-hum"), 
    createGaugeOptions('#3b82f6', () => `${currentHum.toFixed(1)} %`)
);
const soilChart = new ApexCharts(
    document.querySelector("#chart-soil"), 
    createGaugeOptions('#d97706', () => `${Math.round(currentSoil)}`)
);

tempChart.render();
humChart.render();
soilChart.render();

// Update UI Function
function updateUI(data) {
    if(!data) return;

    // Update State
    currentSoil = parseFloat(data.V0) || 0;
    currentTemp = parseFloat(data.V1) || 0;
    currentHum = parseFloat(data.V2) || 0;

    // Calculate Percentages for Gauges
    // Asumsi max range: Suhu 50°C, Kelembaban 100%, Tanah 4095
    const tempPct = Math.min(Math.max((currentTemp / 50) * 100, 0), 100);
    const humPct = Math.min(Math.max(currentHum, 0), 100);
    const soilPct = Math.min(Math.max((currentSoil / 4095) * 100, 0), 100);

    // Update Charts Series
    tempChart.updateSeries([tempPct]);
    humChart.updateSeries([humPct]);
    soilChart.updateSeries([soilPct]);

    // Pump Logic
    if (currentSoil > THRESHOLD) {
        elPump.textContent = 'ON';
        elPump.className = 'pump-status on';
        elPumpDesc.textContent = 'Tanah kering. Pompa menyala.';
        iconPump.className = 'icon-wrapper green';
    } else {
        elPump.textContent = 'OFF';
        elPump.className = 'pump-status off';
        elPumpDesc.textContent = 'Kelembaban cukup. Pompa mati.';
        iconPump.className = 'icon-wrapper red';
    }

    // Update Timestamp
    const now = new Date();
    lastUpdate.textContent = now.toLocaleTimeString('id-ID');
}

// Fetch Data Function
async function fetchData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Update connection status
        statusBadge.className = 'status-badge connected';
        statusText.textContent = 'Terhubung';
        
        updateUI(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        
        // Update connection status
        statusBadge.className = 'status-badge error';
        statusText.textContent = 'Koneksi Terputus';
    }
}

// Initial fetch and interval (every 2 seconds)
fetchData();
setInterval(fetchData, 2000);
