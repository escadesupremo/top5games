/**
 * Convert an image URL to base64 using canvas
 */
export const convertImageToBase64Direct = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;

    // Timeout after 3 seconds
    setTimeout(() => reject(new Error('Image load timeout')), 3000);
  });
};

/**
 * Fetch an image through CORS proxies
 */
export const fetchWithCorsProxy = async (url) => {
  const proxies = [
    (imageUrl) => `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
    (imageUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`,
    (imageUrl) => `https://cors-anywhere.herokuapp.com/${imageUrl}`,
  ];

  for (const proxyFn of proxies) {
    try {
      const proxyUrl = proxyFn(url);
      const response = await fetch(proxyUrl);
      if (response.ok) {
        return await response.blob();
      }
    } catch {
      continue;
    }
  }

  throw new Error('All CORS proxies failed');
};

/**
 * Get base64 image, trying direct load first then CORS proxy
 */
export const getBase64Image = async (url) => {
  // If already base64, return as-is
  if (url?.startsWith('data:')) {
    return url;
  }

  try {
    // Try direct load first
    const base64 = await convertImageToBase64Direct(url);
    return base64;
  } catch {
    // Fall back to CORS proxy
    const blob = await fetchWithCorsProxy(url);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
};
