// const weatherForm = document.getElementById('weatherForm');
// const cityInput = document.getElementById('cityInput');
// const weatherInfo = document.getElementById('weatherInfo');
// const cityName = document.getElementById('cityName');
// const temperature = document.getElementById('temperature');
// const description = document.getElementById('description');
// const errorMessage = document.getElementById('errorMessage');

// weatherForm.addEventListener('submit', async (e) => {
//   e.preventDefault();

//   const city = cityInput.value.trim();
//   if (!city) return;

//   try {
//     // 1. Geocode city name to get lat/lon from Nominatim API
//     const geoResponse = await fetch(
//       `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
//     );
//     const geoData = await geoResponse.json();

//     if (geoData.length === 0) {
//       throw new Error('Location not found');
//     }

//     const latitude = geoData[0].lat;
//     const longitude = geoData[0].lon;

//     // 2. Fetch weather from Open-Meteo using lat/lon
//     const weatherResponse = await fetch(
//       `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
//     );
//     const weatherData = await weatherResponse.json();

//     if (!weatherData.current_weather) {
//       throw new Error('Weather data not available');
//     }

//     // 3. Display weather info
//     cityName.textContent = city;
//     temperature.textContent = `🌡️ ${weatherData.current_weather.temperature} °C`;
//     description.textContent = `Wind Speed: ${weatherData.current_weather.windspeed} km/h`;

//     weatherInfo.classList.remove('hidden');
//     errorMessage.classList.add('hidden');
//   } catch (error) {
//     errorMessage.textContent = `Error: ${error.message}`;
//     errorMessage.classList.remove('hidden');
//     weatherInfo.classList.add('hidden');
//   }

//   cityInput.value = '';
// });

// script.js

const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city');
const locationName = document.getElementById('location-name');
const temperature = document.getElementById('temperature');
const condition = document.getElementById('condition');
const weatherIcon = document.getElementById('weather-icon');
const toggleUnitsBtn = document.getElementById('toggle-units');
const saveFavoriteBtn = document.getElementById('save-favorite');

const forecastContainer = document.querySelector('.forecast-cards');

let currentTempC = null;  // Store current temp in Celsius for toggling
let currentCity = null;
let currentLat = null;
let currentLon = null;
let useFahrenheit = true;

// Utility: Celsius to Fahrenheit
function cToF(celsius) {
  return (celsius * 9 / 5) + 32;
}

// Map Open-Meteo weather codes to descriptions
function weatherCodeToDescription(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return map[code] || 'Unknown weather';
}

// Map weather codes to icon image filenames
function weatherCodeToIcon(code) {
  if ([0, 1].includes(code)) return 'images/clear.png';
  if ([2, 3].includes(code)) return 'images/cloudy.png';
  if ([45, 48].includes(code)) return 'images/fog.png';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'images/rain.png';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'images/snow.png';
  if ([95, 96, 99].includes(code)) return 'images/thunderstorm.png';
  return 'images/weather-icon-lg.png'; // fallback icon
}

// Update the current temperature display with unit conversion
function updateTemperature() {
  if (currentTempC === null) return;
  if (useFahrenheit) {
    temperature.textContent = `${cToF(currentTempC).toFixed(1)} °F`;
  } else {
    temperature.textContent = `${currentTempC.toFixed(1)} °C`;
  }
}

// Display 5-day forecast cards dynamically
function displayForecast(dailyData) {
  forecastContainer.innerHTML = ''; // Clear existing forecast cards

  for (let i = 0; i < 5; i++) {
    const date = new Date(dailyData.time[i]);
    const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
    const maxTempC = dailyData.temperature_2m_max[i];
    const minTempC = dailyData.temperature_2m_min[i];
    const weatherCode = dailyData.weathercode[i];

    const card = document.createElement('div');
    card.className = 'forecast-card';

    card.innerHTML = `
      <h3>${dayName}</h3>
      <img src="${weatherCodeToIcon(weatherCode)}" alt="${weatherCodeToDescription(weatherCode)}" />
      <p>High: ${useFahrenheit ? cToF(maxTempC).toFixed(1) + '°F' : maxTempC.toFixed(1) + '°C'}</p>
      <p>Low: ${useFahrenheit ? cToF(minTempC).toFixed(1) + '°F' : minTempC.toFixed(1) + '°C'}</p>
    `;

    forecastContainer.appendChild(card);
  }
}

// Load favorites from localStorage
function loadFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

// Save favorites to localStorage
function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Save current city as favorite
saveFavoriteBtn.addEventListener('click', () => {
  if (!currentCity || !currentLat || !currentLon) {
    alert('No city to save!');
    return;
  }

  let favorites = loadFavorites();

  if (!favorites.some(fav => fav.city === currentCity)) {
    favorites.push({ city: currentCity, lat: currentLat, lon: currentLon });
    saveFavorites(favorites);
    alert(`Saved ${currentCity} to favorites!`);
  } else {
    alert(`${currentCity} is already in favorites.`);
  }
});

// Toggle between Fahrenheit and Celsius
toggleUnitsBtn.addEventListener('click', () => {
  useFahrenheit = !useFahrenheit;
  toggleUnitsBtn.textContent = useFahrenheit ? 'Switch to °C' : 'Switch to °F';
  updateTemperature();
  // Also update forecast temps
  if (window.latestDailyData) {
    displayForecast(window.latestDailyData);
  }
});

// Main form submit handler
weatherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    // Geocode city, restrict to US
    const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&q=${encodeURIComponent(city)}`);
    const geoData = await geoResponse.json();

    if (geoData.length === 0) throw new Error('City not found');

    currentLat = geoData[0].lat;
    currentLon = geoData[0].lon;
    currentCity = geoData[0].display_name;

    // Fetch weather data
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    );
    const weatherData = await weatherResponse.json();

    if (!weatherData.current_weather) throw new Error('Weather data not available');

    currentTempC = weatherData.current_weather.temperature;
    window.latestDailyData = weatherData.daily; // store for toggle use

    // Update current weather UI
    locationName.textContent = currentCity;
    updateTemperature();
    condition.textContent = weatherCodeToDescription(weatherData.current_weather.weathercode);
    weatherIcon.src = weatherCodeToIcon(weatherData.current_weather.weathercode);
    weatherIcon.alt = weatherCodeToDescription(weatherData.current_weather.weathercode);

    // Update 5-day forecast
    displayForecast(weatherData.daily);

  } catch (err) {
    alert(err.message);
  }

  cityInput.value = '';
});

// On page load: get user location and load weather automatically
async function loadWeatherForCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    currentLat = position.coords.latitude;
    currentLon = position.coords.longitude;

    try {
      // Reverse geocode to get city name
      const revGeoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLon}`
      );
      const revGeoData = await revGeoResponse.json();
      currentCity = revGeoData.display_name || 'Current Location';

      // Fetch weather for current location
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      if (!weatherData.current_weather) throw new Error('Weather data not available');

      currentTempC = weatherData.current_weather.temperature;
      window.latestDailyData = weatherData.daily;

      locationName.textContent = currentCity;
      updateTemperature();
      condition.textContent = weatherCodeToDescription(weatherData.current_weather.weathercode);
      weatherIcon.src = weatherCodeToIcon(weatherData.current_weather.weathercode);
      weatherIcon.alt = weatherCodeToDescription(weatherData.current_weather.weathercode);

      displayForecast(weatherData.daily);

    } catch (err) {
      alert(err.message);
    }
  }, () => {
    alert('Unable to retrieve your location.');
  });
}

loadWeatherForCurrentLocation();
