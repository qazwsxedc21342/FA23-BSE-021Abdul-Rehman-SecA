// ─── Media Normalization Service ────────────────────────────
// Validates and normalizes external media URLs.
// No local file storage — URLs only.

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
const ALLOWED_DOMAINS = [
  'raw.githubusercontent.com',
  'github.com',
  'imgur.com',
  'cloudinary.com',
  'res.cloudinary.com',
  'images.unsplash.com',
  'picsum.photos',
  'via.placeholder.com',
];

/**
 * Detect source type from URL
 */
export const detectSourceType = (url) => {
  if (YOUTUBE_REGEX.test(url)) return 'youtube';
  try {
    const { hostname, pathname } = new URL(url);
    const ext = pathname.substring(pathname.lastIndexOf('.')).toLowerCase();
    if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) return 'image';
    // Cloudinary URLs may not have extensions
    if (hostname.includes('cloudinary.com')) return 'cloudinary';
    return 'other';
  } catch {
    return 'other';
  }
};

/**
 * Extract YouTube video ID
 */
export const extractYouTubeId = (url) => {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
};

/**
 * Generate YouTube thumbnail URL from video URL
 */
export const getYouTubeThumbnail = (url) => {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

/**
 * Validate image URL — checks protocol and optionally domain whitelist
 */
export const validateImageUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // In production you can enforce ALLOWED_DOMAINS
    // const hostOk = ALLOWED_DOMAINS.some(d => parsed.hostname.endsWith(d));
    // if (!hostOk) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Main normalizer — returns { source_type, original_url, thumbnail_url, validation_status }
 */
export const normalizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { source_type: 'other', original_url: url, thumbnail_url: null, validation_status: 'invalid' };
  }

  const source_type = detectSourceType(url);

  if (source_type === 'youtube') {
    const thumbnail_url = getYouTubeThumbnail(url);
    return {
      source_type: 'youtube',
      original_url: url,
      thumbnail_url,
      validation_status: thumbnail_url ? 'valid' : 'invalid',
    };
  }

  if (source_type === 'image' || source_type === 'cloudinary') {
    const isValid = validateImageUrl(url);
    return {
      source_type,
      original_url: url,
      thumbnail_url: isValid ? url : null,
      validation_status: isValid ? 'valid' : 'invalid',
    };
  }

  // Attempt validation for unknown types
  const isValid = validateImageUrl(url);
  return {
    source_type: 'other',
    original_url: url,
    thumbnail_url: isValid ? url : null,
    validation_status: isValid ? 'valid' : 'invalid',
  };
};

/**
 * Normalize an array of media URLs and return records ready for ad_media table
 */
export const normalizeMediaArray = (urls = [], adId) => {
  return urls.map(url => ({ ad_id: adId, ...normalizeMediaUrl(url) }));
};
