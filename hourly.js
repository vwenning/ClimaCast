const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city');
const locationName = document.getElementById('location-name');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const weatherIcon = document.getElementById('weather-icon');
const toggleUnitsBtn = document.getElementById('toggle-units');
const saveFavoriteBtn = document.getElementById('save-favorite');
const forecastContainer = document.querySelector('.forecast-cards');
const toggleBtn = document.querySelector('.menu-toggle');
const nav = document.querySelector('.forecast-nav');

let currentTempC = null;
let currentCity = null;
let currentLat = null;
let currentLon = null;
let useFahrenheit = true;
let hourlyData = null;

function cToF(celsius) {
  return (celsius * 9 / 5) + 32;
}

function weatherCodeToDescription(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle',
    53: 'Moderate drizzle', 55: 'Dense drizzle', 56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle', 61: 'Slight rain', 63: 'Moderate rain',
    65: 'Heavy rain', 66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
    77: 'Snow grains', 80: 'Slight rain showers', 81: 'Moderate rain showers',
    82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ slight hail', 99: 'Thunderstorm w/ heavy hail'
  };
  return map[code] || 'Unknown';
}

function weatherCodeToIcon(code) {
  if ([0, 1].includes(code)) return 'images/clear.png';
  if ([2, 3].includes(code)) return 'images/cloudy.png';
  if ([45, 48].includes(code)) return 'images/fog.png';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'images/rain.png';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'images/snow.png';
  if ([95, 96, 99].includes(code)) return 'images/thunderstorm.png';
  return 'images/clear.png';
}

function updateTemperature() {
  if (currentTempC === null) return;
  temperature.textContent = useFahrenheit
    ? `${cToF(currentTempC).toFixed(1)} °F`
    : `${currentTempC.toFixed(1)} °C`;
}

function displayHourlyForecast(data) {
  forecastContainer.innerHTML = '';
  const { time, temperature_2m, weathercode } = data;

  const hoursToShow = 24;
  for (let i = 0; i < hoursToShow; i++) {
    const hour = new Date(time[i]);
    const hourLabel = hour.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    const temp = useFahrenheit ? cToF(temperature_2m[i]) : temperature_2m[i];
    const code = weathercode[i];

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <h3>${hourLabel}</h3>
      <img src="${weatherCodeToIcon(code)}" alt="${weatherCodeToDescription(code)}" />
      <p>${temp.toFixed(1)}°${useFahrenheit ? 'F' : 'C'}</p>
      <p>${weatherCodeToDescription(code)}</p>
    `;
    forecastContainer.appendChild(card);
  }
}

function updateUI(weatherData, cityName) {
  currentTempC = weatherData.current_weather.temperature;
  hourlyData = weatherData.hourly;
  currentCity = cityName;

  locationName.textContent = currentCity;
  condition.textContent = weatherCodeToDescription(weatherData.current_weather.weathercode);
  weatherIcon.src = weatherCodeToIcon(weatherData.current_weather.weathercode);
  weatherIcon.alt = weatherCodeToDescription(weatherData.current_weather.weathercode);

  updateTemperature();
  displayHourlyForecast(hourlyData);
}

weatherForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=${encodeURIComponent(city)}`);
    const geoData = await geoResponse.json();
    if (!geoData.length) throw new Error('City not found.');

    currentLat = geoData[0].lat;
    currentLon = geoData[0].lon;

    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`);
    const weatherData = await weatherResponse.json();
    if (!weatherData.current_weather) throw new Error('Weather data unavailable.');

    updateUI(weatherData, geoData[0].display_name);

  } catch (err) {
    alert(err.message);
  }

  cityInput.value = '';
});

toggleUnitsBtn?.addEventListener('click', () => {
  useFahrenheit = !useFahrenheit;
  toggleUnitsBtn.textContent = useFahrenheit ? 'Switch to °C' : 'Switch to °F';
  updateTemperature();
  if (hourlyData) displayHourlyForecast(hourlyData);
});

saveFavoriteBtn?.addEventListener('click', () => {
  if (!currentCity || !currentLat || !currentLon) return alert('No city selected!');
  const favs = JSON.parse(localStorage.getItem('favoriteCities') || '[]');
  if (!favs.some(f => f.city === currentCity)) {
    favs.push({ city: currentCity, lat: currentLat, lon: currentLon });
    localStorage.setItem('favoriteCities', JSON.stringify(favs));
    alert(`Saved ${currentCity} to favorites!`);
  } else {
    alert(`${currentCity} is already in favorites.`);
  }
});

toggleBtn.addEventListener('click', () => {
  toggleBtn.classList.toggle('open');
  nav.classList.toggle('show');
});

function loadWeatherForCurrentLocation() {
  if (!navigator.geolocation) return alert('Geolocation not supported.');

  navigator.geolocation.getCurrentPosition(async (pos) => {
    currentLat = pos.coords.latitude;
    currentLon = pos.coords.longitude;

    try {
      const revGeoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLon}`);
      const revGeoData = await revGeoRes.json();
      const cityName = revGeoData.display_name || 'Your Location';

      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`);
      const weatherData = await weatherRes.json();
      if (!weatherData.current_weather) throw new Error('Weather data unavailable.');

      updateUI(weatherData, cityName);

    } catch (err) {
      alert(err.message);
    }
  }, () => {
    alert('Permission denied. Please search manually.');
  });
}

const urlParams = new URLSearchParams(window.location.search);
const cityFromURL = urlParams.get('city');

if (cityFromURL) {
  cityInput.value = cityFromURL;
  weatherForm.dispatchEvent(new Event('submit'));
} else if (weatherForm) {
  loadWeatherForCurrentLocation();
}