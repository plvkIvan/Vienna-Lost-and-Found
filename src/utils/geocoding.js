const cache = new Map();

const USER_AGENT = 'ViennaLostFoundApp/1.0';

function cacheKey(lat, lon) {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

export async function reverseGeocode(latitude, longitude) {
  const key = cacheKey(latitude, longitude);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2&lat=${latitude}&lon=${longitude}` +
    `&zoom=18&addressdetails=1&accept-language=de`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      cache.set(key, null);
      return null;
    }

    const data = await response.json();
    const label = formatAddressLabel(data);
    cache.set(key, label);
    return label;
  } catch (err) {
    return null;
  }
}

function formatAddressLabel(data) {
  if (!data || data.error) return null;
  const a = data.address || {};

  const road = a.road || a.pedestrian || a.footway || a.path || a.street;
  const houseNumber = a.house_number;
  if (road && houseNumber) {
    return `${road} ${houseNumber}`;
  }
  if (road) {
    return road;
  }

  if (data.name) {
    return data.name;
  }

  const district =
    a.suburb || a.neighbourhood || a.city_district || a.borough;
  if (district) {
    return district;
  }

  if (a.city || a.town || a.village) {
    return a.city || a.town || a.village;
  }

  if (data.display_name) {
    return data.display_name.split(',').slice(0, 2).join(',').trim();
  }

  return null;
}
