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
let latestDailyData = null;

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
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };
  return map[code] || 'Unknown weather';
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

function displayForecast(dailyData) {
  forecastContainer.innerHTML = ''; 
  for (let i = 0; i < 5; i++) {
    const date = new Date(dailyData.time[i]);
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    const maxTemp = useFahrenheit ? cToF(dailyData.temperature_2m_max[i]) : dailyData.temperature_2m_max[i];
    const minTemp = useFahrenheit ? cToF(dailyData.temperature_2m_min[i]) : dailyData.temperature_2m_min[i];
    const weatherCode = dailyData.weathercode[i];

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <h3>${dayName}</h3>
      <img src="${weatherCodeToIcon(weatherCode)}" alt="${weatherCodeToDescription(weatherCode)}" />
      <p>High: ${maxTemp.toFixed(1)}°${useFahrenheit ? 'F' : 'C'}</p>
      <p>Low: ${minTemp.toFixed(1)}°${useFahrenheit ? 'F' : 'C'}</p>
    `;
    forecastContainer.appendChild(card);
  }
}

function updateUI(weatherData, cityName) {
  currentTempC = weatherData.current_weather.temperature;
  latestDailyData = weatherData.daily; 
  currentCity = cityName; 

  locationName.textContent = currentCity;
  condition.textContent = weatherCodeToDescription(weatherData.current_weather.weathercode);
  weatherIcon.src = weatherCodeToIcon(weatherData.current_weather.weathercode);
  weatherIcon.alt = weatherCodeToDescription(weatherData.current_weather.weathercode);

  updateTemperature();
  displayForecast(latestDailyData);
}

function loadFavorites() {
  return JSON.parse(localStorage.getItem('favoriteCities') || '[]');
}

function saveFavorites(favs) {
  localStorage.setItem('favoriteCities', JSON.stringify(favs));
}

weatherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=${encodeURIComponent(city)}`);
    const geoData = await geoResponse.json();
    if (!geoData.length) throw new Error('City not found. Please try again.');

    currentLat = geoData[0].lat;
    currentLon = geoData[0].lon;

    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
    const weatherData = await weatherResponse.json();
    if (!weatherData.current_weather) throw new Error('Weather data not available for this location.');

    updateUI(weatherData, geoData[0].display_name);

  } catch (err) {
    alert(err.message);
  }

  cityInput.value = ''; 
});

toggleUnitsBtn.addEventListener('click', () => {
  useFahrenheit = !useFahrenheit;
  toggleUnitsBtn.textContent = useFahrenheit ? 'Switch to °C' : 'Switch to °F';
  updateTemperature(); 
  if (latestDailyData) {
    displayForecast(latestDailyData); 
  }
});

saveFavoriteBtn.addEventListener('click', () => {
  if (!currentCity || !currentLat || !currentLon) {
    return alert('No city selected to save!');
  }
  const favorites = loadFavorites();

  if (!favorites.some(fav => fav.city === currentCity)) {
    favorites.push({ city: currentCity, lat: currentLat, lon: currentLon });
    saveFavorites(favorites);
    alert(`Saved ${currentCity} to favorites!`);
  } else {
    alert(`${currentCity} is already in your favorites.`);
  }
});

toggleBtn.addEventListener('click', () => {
  toggleBtn.classList.toggle('open');
  nav.classList.toggle('show');
});

async function loadWeatherForCurrentLocation() {
  if (!navigator.geolocation) {
      return alert('Geolocation is not supported by your browser. Please search for a city.');
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    currentLat = position.coords.latitude;
    currentLon = position.coords.longitude;

    try {
      const revGeoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLon}`);
      const revGeoData = await revGeoResponse.json();
      const cityName = revGeoData.display_name || 'Current Location';

      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`);
      const weatherData = await weatherResponse.json();
      if (!weatherData.current_weather) throw new Error('Weather data not available.');

      updateUI(weatherData, cityName);

    } catch (err) {
      alert(err.message);
    }
  }, () => {
    alert('Unable to retrieve your location. You may need to grant permission. Please search for a city manually.');
  });
}

const urlParams = new URLSearchParams(window.location.search);
const cityFromURL = urlParams.get('city');

if (cityFromURL) {
  cityInput.value = cityFromURL;
  weatherForm.dispatchEvent(new Event('submit'));
} else {
  loadWeatherForCurrentLocation();
}