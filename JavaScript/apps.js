/* ========================================================================= */
/* SHARED JAVASCRIPT (Navigation & Modals) */
/* ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Navigation Toggle
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });
  }

  // Initialize scripts based on the page
  if (document.querySelector(".api-search-section")) {
    initializeApiPage();
  }
});

/**
 * Global function to open a modal
 * @param {Event} event - The click event
 * @param {string} modalId - The ID of the modal to open
 */
function openModal(event, modalId) {
  event.preventDefault(); // Stop link from navigating
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
  }
}

/**
 * Global function to close a modal
 * @param {string} modalId - The ID of the modal to close
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

// Close modal when user clicks anywhere outside of it
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

/* ========================================================================= */
/* API PAGE SPECIFIC JAVASCRIPT (Nager.Date API Integration) */
/* ========================================================================= */

// Nager.Date API Endpoints
const API_BASE_URL = "https://date.nager.at/api/v3/";
const COUNTRIES_URL = `${API_BASE_URL}AvailableCountries`;

/**
 * Initializes the API search page: fetches countries and sets up the search listener.
 */
async function initializeApiPage() {
  const countrySelect = document.getElementById("country-select");
  const searchBtn = document.getElementById("search-btn");

  if (countrySelect && searchBtn) {
    // 1. Fetch and populate countries
    await fetchAndPopulateCountries(countrySelect);

    // 2. Set up event listener for the search button
    searchBtn.addEventListener("click", fetchHolidays);

    // 3. Set default year to current year
    document.getElementById("year-input").value = new Date().getFullYear();
  }
}

/**
 * Fetches the list of available countries from the Nager.Date API and populates the dropdown.
 * @param {HTMLSelectElement} selectElement - The <select> element to populate.
 */
async function fetchAndPopulateCountries(selectElement) {
  try {
    const response = await fetch(COUNTRIES_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const countries = await response.json();

    // Sort countries alphabetically by name
    countries.sort((a, b) => a.name.localeCompare(b.name));

    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.countryCode; // Use CountryCode (e.g., US, FR)
      option.textContent = country.name;
      selectElement.appendChild(option);
    });
    console.log(`Successfully loaded ${countries.length} countries.`);
  } catch (error) {
    console.error("Error fetching countries:", error);
    const option = document.createElement("option");
    option.textContent = "Error loading countries.";
    option.disabled = true;
    selectElement.appendChild(option);
  }
}

/**
 * Fetches public holidays for the selected country and year.
 */
async function fetchHolidays() {
  const countryCode = document.getElementById("country-select").value;
  const year = document.getElementById("year-input").value;
  const resultsContainer = document.getElementById("holiday-results");
  const loadingSpinner = document.getElementById("loading-spinner");

  resultsContainer.innerHTML = ""; // Clear previous results

  if (!countryCode || !year) {
    resultsContainer.innerHTML = `<p class="placeholder-text" style="color:red;">Please select a country and enter a valid year.</p>`;
    return;
  }

  // Show loading spinner
  loadingSpinner.style.display = "block";

  const HOLIDAYS_URL = `${API_BASE_URL}PublicHolidays/${year}/${countryCode}`;

  try {
    const response = await fetch(HOLIDAYS_URL);
    if (!response.ok) {
      // Nager.Date returns 404 for unsupported countries/years
      if (response.status === 404) {
        resultsContainer.innerHTML = `<p class="placeholder-text" style="color:red;">No holiday data available for ${countryCode} in ${year}.</p>`;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } else {
      const holidays = await response.json();
      displayHolidays(holidays, resultsContainer);
    }
  } catch (error) {
    console.error("Error fetching holidays:", error);
    resultsContainer.innerHTML = `<p class="placeholder-text" style="color:red;">An error occurred while fetching data. Check the console for details.</p>`;
  } finally {
    // Hide loading spinner
    loadingSpinner.style.display = "none";
  }
}

/**
 * Renders the fetched holidays into the results container in a grid format.
 * @param {Array<Object>} holidays - The array of holiday objects.
 * @param {HTMLElement} container - The element to append the results to.
 */
function displayHolidays(holidays, container) {
  if (holidays.length === 0) {
    container.innerHTML = `<p class="placeholder-text">No public holidays found for the selected country and year.</p>`;
    return;
  }

  holidays.forEach((holiday) => {
    const card = document.createElement("div");
    card.className = "holiday-card";

    // Format the date to a more readable string
    const date = new Date(holiday.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    card.innerHTML = `
            <h4>${holiday.name}</h4>
            <span class="holiday-date">${date}</span>
            <p>Type: **${holiday.type}**</p>
            <p>Global: ${holiday.global ? "Yes" : "No"}</p>
        `;
    container.appendChild(card);
  });
}
