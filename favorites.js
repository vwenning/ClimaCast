document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("favoritesContainer");
  const favorites = JSON.parse(localStorage.getItem("favoriteCities")) || [];

  if (favorites.length === 0) {
    container.innerHTML = "<p class='text-gray-600'>No favorite cities yet.</p>";
    return;
  }

  favorites.forEach(({ city }) => {
    const card = document.createElement("div");
    card.className = "bg-white p-4 shadow rounded";
    card.innerHTML = `
      <h2 class="text-xl font-semibold mb-2">${city}</h2>
      <button class="remove-btn text-sm text-red-500 hover:underline" data-city="${city}">Remove</button>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll(".remove-btn").forEach(button => {
    button.addEventListener("click", () => {
      const cityName = button.getAttribute("data-city");
      removeFavorite(cityName);
    });
  });
});

function removeFavorite(cityName) {
  let favorites = JSON.parse(localStorage.getItem("favoriteCities")) || [];
  favorites = favorites.filter(fav => fav.city !== cityName);
  localStorage.setItem("favoriteCities", JSON.stringify(favorites));
  location.reload();
}