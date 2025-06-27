document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("favoritesContainer");
  let favorites = JSON.parse(localStorage.getItem("favoriteCities")) || [];

  if (favorites.length === 0) {
    container.innerHTML = "<p class='text-gray-600'>No favorite cities yet.</p>";
    return;
  }

  container.innerHTML = '';

  for (const { city, lat, lon } of favorites) {
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const weatherData = await weatherRes.json();
    const temp = weatherData.current_weather.temperature;

    const card = document.createElement("div");
    card.className = "bg-white p-4 shadow rounded mb-4";
    card.innerHTML = `
      <h2 class="text-xl font-semibold mb-2">${city}</h2>
      <p>Current Temp: ${temp}°C</p>
      <button class="remove-btn text-sm text-red-500 hover:underline" data-city="${city}">Remove</button>
    `;

    card.querySelector(".remove-btn").addEventListener("click", () => {
      removeFavorite(city);
    });

    container.appendChild(card);
  }
});

function removeFavorite(cityName) {
  let favorites = JSON.parse(localStorage.getItem("favoriteCities")) || [];
  favorites = favorites.filter(fav => fav.city !== cityName);
  localStorage.setItem("favoriteCities", JSON.stringify(favorites));
  location.reload();
}