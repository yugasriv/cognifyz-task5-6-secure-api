// Task 7.2: Integrate an external API (third-party service)
// Uses Open-Meteo — a free, no-API-key-required weather API — for both
// geocoding (city name -> lat/long) and the actual weather forecast.

const cache = require('./cache');
const AppError = require('../utils/AppError');

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

async function getWeatherForCity(city) {
  const cacheKey = `weather:${city.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // Step 1: geocode the city name to coordinates
  const geoRes = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1`);
  if (!geoRes.ok) throw new AppError('Geocoding service unavailable', 502);
  const geoData = await geoRes.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new AppError(`City "${city}" not found`, 404);
  }
  const { latitude, longitude, name, country } = geoData.results[0];

  // Step 2: fetch current weather for those coordinates
  const weatherRes = await fetch(
    `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true`
  );
  if (!weatherRes.ok) throw new AppError('Weather service unavailable', 502);
  const weatherData = await weatherRes.json();

  const result = {
    city: name,
    country,
    latitude,
    longitude,
    current: weatherData.current_weather,
    fromCache: false,
  };

  cache.set(cacheKey, result, 5 * 60 * 1000); // cache for 5 minutes
  return result;
}

module.exports = { getWeatherForCity };
