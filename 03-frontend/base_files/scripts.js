document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');

  if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
          event.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          await loginUser(email, password);
      });
  }

  checkAuthentication();
  const placeId = getPlaceIdFromURL();
  if (placeId) {
      fetchPlaceDetails(checkAuthentication(), placeId);
  }
});

async function loginUser(email, password) {
  try {
      const response = await fetch('http://localhost:5500/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
      });

      if (response.ok) {
          const data = await response.json();
          document.cookie = `token=${data.access_token}; path=/`;
          window.location.href = 'index.html';
      } else {
          const errorData = await response.json();
          displayError(errorData.message || 'Login failed');
      }
  } catch (error) {
      displayError('An error occurred. Please try again.');
  }
}

function displayError(message) {
  const errorMessage = document.getElementById('error-message');
  if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function checkAuthentication() {
  const token = getCookie('token');
  const loginLink = document.getElementById('login-link');
  const addReviewSection = document.getElementById('add-review');

  if (!token) {
      loginLink.style.display = 'block';
      if (addReviewSection) addReviewSection.style.display = 'none';
  } else {
      loginLink.style.display = 'none';
      if (addReviewSection) addReviewSection.style.display = 'block';
  }
  return token;
}

async function fetchPlaces(token) {
  try {
      const response = await fetch('http://localhost:5500/places', {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });

      if (response.ok) {
          const data = await response.json();
          displayPlaces(data.places);
          populateCountryFilter(data.places);
      } else {
          console.error('Failed to fetch places:', response.statusText);
      }
  } catch (error) {
      console.error('An error occurred while fetching places:', error);
  }
}

function displayPlaces(places) {
  const placesList = document.getElementById('places-list');
  placesList.innerHTML = '';

  places.forEach(place => {
      const placeDiv = document.createElement('div');
      placeDiv.className = 'place-item';
      placeDiv.innerHTML = `
          <h2>${place.name}</h2>
          <p>${place.description}</p>
          <p><strong>Location:</strong> ${place.location}</p>
          <p><strong>Country:</strong> ${place.country}</p>
      `;
      placesList.appendChild(placeDiv);
  });
}

function populateCountryFilter(places) {
  const countryFilter = document.getElementById('country-filter');
  const countries = [...new Set(places.map(place => place.country))];

  countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countryFilter.appendChild(option);
  });

  countryFilter.addEventListener('change', (event) => {
      filterPlaces(event.target.value);
  });
}

function filterPlaces(selectedCountry) {
  const places = document.querySelectorAll('.place-item');

  places.forEach(place => {
      const country = place.querySelector('p:nth-of-type(4)').textContent.replace('Country: ', '');

      place.style.display = (selectedCountry === '' || country === selectedCountry) ? 'block' : 'none';
  });
}

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function fetchPlaceDetails(token, placeId) {
  try {
      const response = await fetch(`http://localhost:5500/places/${placeId}`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });

      if (response.ok) {
          const place = await response.json();
          displayPlaceDetails(place);
      } else {
          console.error('Failed to fetch place details:', response.statusText);
      }
  } catch (error) {
      console.error('An error occurred while fetching place details:', error);
  }
}

function displayPlaceDetails(place) {
  const placeDetailsSection = document.getElementById('place-details');
  placeDetailsSection.innerHTML = `
      <h2>${place.name}</h2>
      <p><strong>Description:</strong> ${place.description}</p>
      <p><strong>Location:</strong> ${place.location}</p>
      <div><strong>Images:</strong></div>
      <div id="place-images">
          ${place.images.map(img => `<img src="${img}" alt="${place.name}" class="place-image-large">`).join('')}
      </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const placeId = getPlaceIdFromURL();
  const token = checkAuthentication();

  if (placeId && token) {
      fetchPlaceDetails(token, placeId);

      const reviewForm = document.getElementById('review-form');
      if (reviewForm) {
          reviewForm.addEventListener('submit', async (event) => {
              event.preventDefault();
              const comment = document.getElementById('comment').value;
              const rating = document.getElementById('rating').value;

              try {
                  const response = await submitReview(token, placeId, comment, rating);
                  handleResponse(response);
              } catch (error) {
                  console.error('Error submitting review:', error);
                  showError('An error occurred while submitting the review.');
              }
          });
      }
  }
});

async function submitReview(token, placeId, comment, rating) {
  const response = await fetch(`http://localhost:5500/places/${placeId}/reviews`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment, rating })
  });

  return response;
}

function handleResponse(response) {
  if (response.ok) {
      document.getElementById('success-message').textContent = 'Review submitted successfully!';
      document.getElementById('success-message').style.display = 'block';
      document.getElementById('error-message').style.display = 'none';
      document.getElementById('review-form').reset();
  } else {
      document.getElementById('error-message').textContent = 'Failed to submit review.';
      document.getElementById('error-message').style.display = 'block';
      document.getElementById('success-message').style.display = 'none';
  }
}

function showError(message) {
  const errorMessageElement = document.getElementById('review-error-message');
  errorMessageElement.textContent = message;
  errorMessageElement.style.display = 'block';
}
