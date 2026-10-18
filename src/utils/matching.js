import { CATEGORIES, STATUS, TYPE } from '../data/mockData';

const MAX_MATCH_DISTANCE_KM = 2;

function normalize(value = '') {
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s]/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3);
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function keywordScore(source, candidate) {
  const sourceWords = new Set(
    normalize(`${source.title} ${source.description} ${source.location}`)
  );
  const candidateWords = normalize(
    `${candidate.title} ${candidate.description} ${candidate.location}`
  );

  if (sourceWords.size === 0 || candidateWords.length === 0) return 0;

  const matches = candidateWords.filter((word) => sourceWords.has(word)).length;
  return Math.min(matches / Math.max(candidateWords.length, 1), 1);
}

export function scoreItemMatch(source, candidate) {
  if (!source || !candidate) return null;
  if (source.id && source.id === candidate.id) return null;
  if (source.type === candidate.type) return null;
  if (candidate.status === STATUS.RETURNED) return null;

  const distance = getDistanceKm(
    Number(source.latitude),
    Number(source.longitude),
    Number(candidate.latitude),
    Number(candidate.longitude)
  );

  if (!Number.isFinite(distance) || distance > MAX_MATCH_DISTANCE_KM) {
    return null;
  }

  let score = 0;

  if (source.category && source.category === candidate.category) {
    score += 55;
  }

  const distanceScore = Math.max(0, 25 - distance * 10);
  score += distanceScore;

  score += keywordScore(source, candidate) * 20;

  if (score < 45) return null;

  return {
    item: candidate,
    score: Math.round(score),
    distanceKm: Number(distance.toFixed(2)),
  };
}

export function findPotentialMatches(source, allItems, limit = 3) {
  return allItems
    .map((candidate) => scoreItemMatch(source, candidate))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function getCategoryLabel(categoryId) {
  const category = CATEGORIES.find((cat) => cat.id === categoryId);
  return category?.label || 'Other';
}

export { MAX_MATCH_DISTANCE_KM, TYPE };
