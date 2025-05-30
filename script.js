const weatherForm = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const weatherInfo = document.getElementById('weatherInfo');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const errorMessage = document.getElementById('errorMessage');

weatherForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = cityInput.value.trim();
  if (!city) return;

  try {
    // 1. Geocode city name to get lat/lon from Nominatim API
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
    );
    const geoData = await geoResponse.json();

    if (geoData.length === 0) {
      throw new Error('Location not found');
    }

    const latitude = geoData[0].lat;
    const longitude = geoData[0].lon;

    // 2. Fetch weather from Open-Meteo using lat/lon
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
    );
    const weatherData = await weatherResponse.json();

    if (!weatherData.current_weather) {
      throw new Error('Weather data not available');
    }

    // 3. Display weather info
    cityName.textContent = city;
    temperature.textContent = `🌡️ ${weatherData.current_weather.temperature} °C`;
    description.textContent = `Wind Speed: ${weatherData.current_weather.windspeed} km/h`;

    weatherInfo.classList.remove('hidden');
    errorMessage.classList.add('hidden');
  } catch (error) {
    errorMessage.textContent = `Error: ${error.message}`;
    errorMessage.classList.remove('hidden');
    weatherInfo.classList.add('hidden');
  }

  cityInput.value = '';
});