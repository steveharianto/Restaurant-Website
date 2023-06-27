/* eslint-disable indent */
/* eslint-disable quotes */
/* eslint-disable no-console */
import "regenerator-runtime"; /* for async await transpile */
import "../styles/main.css";
// src/scripts/index.js

// Get the necessary elements
const mainIndex = document.getElementById("mainIndex");
const mainFavourite = document.getElementById("mainFavourite");
const favoriteLink = document.getElementById("favorite-link");
const mainDetail = document.getElementById("mainDetail");

// Hide mainFavourite initially
mainFavourite.style.display = "none";

// Handle click event on the Favorite link
favoriteLink.addEventListener("click", (e) => {
    e.preventDefault();
    mainIndex.style.display = "none";
    mainDetail.style.display = "none";
    mainFavourite.style.display = "block";
});

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById("offlineInstallButton").hidden = false;
});

document.getElementById("offlineInstallButton").addEventListener("click", (e) => {
    document.getElementById("offlineInstallButton").hidden = true;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
            console.log("User accepted the A2HS prompt");
        } else {
            console.log("User dismissed the A2HS prompt");
        }
        deferredPrompt = null;
    });
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
            console.log("Service Worker registered");
        })
        .catch((error) => {
            console.error("Error registering Service Worker:", error);
        });
}

// Initialize DB
export const openDB = () =>
    // eslint-disable-next-line implicit-arrow-linebreak
    new Promise((resolve, reject) => {
        const request = indexedDB.open("FavoritesDB", 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore("restaurants", { keyPath: "id" });
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });

// Fetch Restaurant List
document.addEventListener("DOMContentLoaded", () => {
    const restaurantGrid = document.getElementById("all-restaurant-cards");

    const fetchRestaurants = async () => {
        try {
            const response = await fetch("https://restaurant-api.dicoding.dev/list");
            const data = await response.json();
            return data.restaurants;
        } catch (error) {
            console.error("Error fetching restaurant data:", error);
            return null;
        }
    };
    const renderRestaurants = (restaurants) => {
        restaurants.forEach((restaurant) => {
            const imageUrl = `https://restaurant-api.dicoding.dev/images/medium/${restaurant.pictureId}`;
            const card = document.createElement("div");
            card.classList.add("restaurant-card");
            card.setAttribute("tabindex", "0");
            card.innerHTML = `
        <div class="image-container" style="position: relative;">
          <img src="${imageUrl}" alt="${restaurant.name}">
          <span class="city-badge">${restaurant.city}</span>
        </div>
        <div class="content">
          <p class="rating">Rating: ${restaurant.rating}</p>
          <h3 class="name">${restaurant.name}</h3>
          <p class="description">${restaurant.description}</p>
        </div>
      `;

            card.addEventListener("click", () => {
                window.location.href = `?id=${restaurant.id}`;
            });

            restaurantGrid.appendChild(card);
        });
    };

    fetchRestaurants()
        .then(renderRestaurants)
        .catch((error) => console.error("Error rendering restaurant cards:", error));
});

// Skip to Content
const skipToContent = document.getElementById("skip-to-content");
const exploreRestaurants = document.getElementById("explore-restaurants");

document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && event.target === document.body) {
        // Show the skip to content button
        skipToContent.classList.remove("hidden");
    }
});

skipToContent.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        // Skip to content
        exploreRestaurants.scrollIntoView();
    }
    // Hide the skip to content button
    skipToContent.classList.add("hidden");
});

skipToContent.addEventListener("blur", () => {
    // Hide the skip to content button when it loses focus
    skipToContent.classList.add("hidden");
});

// Hamburger

document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");
    const navLinksItems = navLinks.querySelectorAll("li a");

    function toggleNavLinks() {
        navLinks.classList.toggle("open");
    }

    hamburger.addEventListener("click", toggleNavLinks);
    hamburger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleNavLinks();
        }
    });

    navLinksItems.forEach((navLink) => {
        navLink.addEventListener("click", () => {
            toggleNavLinks();
        });

        navLink.addEventListener("keyup", (e) => {
            if (e.key === "Enter") {
                toggleNavLinks();
            }
        });
    });
});

export default openDB;

const favoriteRestaurantGrid = document.getElementById("favorite-restaurant-grid");

const fetchRestaurantDetails = async (id) => {
    try {
        const cacheKey = `/api/restaurants/${id}`;
        if ("caches" in window) {
            const cacheResponse = await caches.match(cacheKey);
            if (cacheResponse) {
                const cachedData = await cacheResponse.json();
                return cachedData.restaurant;
            }
        }

        const response = await fetch(`https://restaurant-api.dicoding.dev/detail/${id}`);
        const data = await response.json();

        if ("caches" in window) {
            const cache = await caches.open("restaurant-apps-cache");
            const cacheResponse = new Response(JSON.stringify(data));
            cache.put(cacheKey, cacheResponse);

            // Cache the image
            const imageUrl = `https://restaurant-api.dicoding.dev/images/medium/${data.restaurant.pictureId}`;
            const imageCacheKey = new Request(imageUrl);
            const imageResponse = await fetch(imageUrl);
            cache.put(imageCacheKey, imageResponse);
        }

        return data.restaurant;
    } catch (error) {
        console.error("Error fetching restaurant details:", error);
        return null;
    }
};

// Function to display favorite restaurants
const displayFavoriteRestaurants = (restaurants) => {
    favoriteRestaurantGrid.innerHTML = ""; // Clear the existing content

    restaurants.forEach(async (restaurant) => {
        const x = await fetchRestaurantDetails(restaurant.id);
        const card = document.createElement("div");
        card.classList.add("restaurant-card");
        card.setAttribute("tabindex", "0");
        const imageUrl = `https://restaurant-api.dicoding.dev/images/medium/${x.pictureId}`;
        card.innerHTML = `
      <div class="image-container" style="position: relative;">
        <img src="${imageUrl}" alt="${x.name}">
        <span class="city-badge">${x.city}</span>
      </div>
      <div class="content">
        <p class="rating">Rating: ${x.rating}</p>
        <h3 class="name">${x.name}</h3>
        <p class="description">${x.description}</p>
      </div>
    `;
        card.addEventListener("click", () => {
            window.location.href = `?id=${restaurant.id}`;
        });
        favoriteRestaurantGrid.appendChild(card);
    });
};

// Function to fetch favorite restaurants from the database
const fetchFavoriteRestaurants = async () => {
    try {
        const db = await openDB();
        const transaction = db.transaction("restaurants", "readonly");
        const objectStore = transaction.objectStore("restaurants");
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const favoriteRestaurants = event.target.result;
            displayFavoriteRestaurants(favoriteRestaurants);

            // Cache the favorite restaurants
            if ("caches" in window) {
                caches.open("restaurant-apps-cache").then((cache) => {
                    const response = new Response(JSON.stringify(favoriteRestaurants));
                    const cacheKey = new Request("/api/favorite-restaurants");
                    cache.put(cacheKey, response);
                });
            }
        };

        request.onerror = (event) => {
            console.error("Error fetching favorite restaurants:", event.target.error);
        };
    } catch (error) {
        console.error("Error opening database:", error);
    }
};

// Call the function to fetch and display favorite restaurants
fetchFavoriteRestaurants();

document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && event.target === document.body) {
        // Show the skip to content button
        skipToContent.classList.remove("hidden");
    }
});

skipToContent.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        // Skip to content
        exploreRestaurants.scrollIntoView();
    }
    // Hide the skip to content button
    skipToContent.classList.add("hidden");
});

skipToContent.addEventListener("blur", () => {
    // Hide the skip to content button when it loses focus
    skipToContent.classList.add("hidden");
});

// Detail Part
/* eslint-disable no-console */

// Save the restaurant ID to IndexedDB
export async function saveRestaurantId(id) {
    const db = await openDB();
    const transaction = db.transaction("restaurants", "readwrite");
    const objectStore = transaction.objectStore("restaurants");

    const getRequest = objectStore.get(id);

    getRequest.onsuccess = (event) => {
        const existingData = event.target.result;

        if (existingData) {
            // Restaurant ID already exists, remove it
            objectStore.delete(id);
        } else {
            // Restaurant ID doesn't exist, add it
            const data = { id };
            objectStore.put(data);
        }
    };

    getRequest.onerror = (event) => {
        console.error("Error checking restaurant ID in IndexedDB:", event.target.error);
    };

    transaction.onerror = (event) => {
        console.error("Error saving/removing restaurant ID to/from IndexedDB:", event.target.error);
    };
}

function fetchRestaurantDetailss() {
    const id = new URLSearchParams(window.location.search).get("id");
    fetch(`https://restaurant-api.dicoding.dev/detail/${id}`)
        .then((response) => response.json())
        // eslint-disable-next-line no-use-before-define
        .then((data) => displayRestaurantDetails(data.restaurant));
}

window.onload = function loadHandler() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) {
        const mainIndex = document.getElementById("mainIndex");
        const mainFavourite = document.getElementById("mainFavourite");
        const mainDetail = document.getElementById("mainDetail");
        mainFavourite.style.display = "none";
        mainIndex.style.display = "none";
        mainDetail.style.display = "block";
        fetchRestaurantDetailss();
    }
};

function displayRestaurantDetails(restaurant) {
    const section = document.getElementById("restaurant-details");
    const id = new URLSearchParams(window.location.search).get("id");

    const html = `
    <div class="containerRestaurant">
      <h2>${restaurant.name}</h2>
      <div class="restaurant-image">
        <img src="https://restaurant-api.dicoding.dev/images/large/${restaurant.pictureId}" alt="${restaurant.name}" />
      </div>
      <div class="restaurant-info">
        <p>${restaurant.description}</p>
        <p><strong>City:</strong> ${restaurant.city}</p>
        <p><strong>Address:</strong> ${restaurant.address}</p>
        <p><strong>Rating:</strong> ${restaurant.rating}</p>
        <h3>Categories:</h3>
        <ul class="categories-list">
          ${restaurant.categories.map((category) => `<li>${category.name}</li>`).join("")}
        </ul>
        <h3>Menus:</h3>
        <div class="menu">
          <div class="menu-category">
            <h4>Foods:</h4>
            <ul class="menu-items">
              ${restaurant.menus.foods.map((food) => `<li>${food.name}</li>`).join("")}
            </ul>
          </div>
          <div class="menu-category">
            <h4>Drinks:</h4>
            <ul class="menu-items">
              ${restaurant.menus.drinks.map((drink) => `<li>${drink.name}</li>`).join("")}
            </ul>
          </div>
        </div>
        <h3>Customer Reviews:</h3>
        <ul class="reviews-list">
          ${restaurant.customerReviews.map((review) => `<li><strong>${review.name}</strong> (${review.date}): ${review.review}</li>`).join("")}
        </ul>
      </div>
      <button id="favoriteButton" class="favorite-button" style="min-width: 44px; min-height: 44px;">Add to Favorites</button>
    </div>
  `;

    section.innerHTML = html;

    // Get the favorite button element
    const favoriteButton = document.getElementById("favoriteButton");

    // Add click event listener to the favorite button
    favoriteButton.addEventListener("click", () => {
        saveRestaurantId(id);
    });
}
