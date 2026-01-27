// Canvas renderer for generating Top 5 Games images

/**
 * Generate a Top 5 Games image using Canvas
 */
export const generateTop5Image = async (selectedGames, theme, username, showUsernameInImage, cachedImages) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 1080;
  canvas.height = 1920;

  // Safety check
  if (!theme) {
    throw new Error('Please select a valid background theme');
  }

  // Apply background (gradient or image)
  if (theme.type === 'image') {
    // For image backgrounds, draw solid color as fallback then try to load image
    ctx.fillStyle = '#8B6F47';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (theme.backgroundImage) {
      try {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
          bgImg.src = theme.backgroundImage;
          setTimeout(reject, 3000);
        });

        // Scale image to cover canvas
        const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
        const scaledWidth = bgImg.width * scale;
        const scaledHeight = bgImg.height * scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;

        ctx.drawImage(bgImg, offsetX, offsetY, scaledWidth, scaledHeight);
      } catch {
        // Background image failed to load, fallback color is already applied
      }
    }

    // Apply overlay for readability
    if (theme.overlay) {
      ctx.fillStyle = theme.overlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  } else {
    // Apply gradient background
    let backgroundApplied = false;
    if (theme.gradient) {
      const gradientMatch = theme.gradient.match(/linear-gradient\(([^)]+)\)/);
      if (gradientMatch) {
        const parts = gradientMatch[1].split(',').map((p) => p.trim());
        const direction = parts[0];
        const colors = parts.slice(1);

        let gradient;
        if (direction.includes('bottom')) {
          gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        } else if (direction.includes('135deg')) {
          gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        } else {
          gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        }

        colors.forEach((color, index) => {
          const stop = index / (colors.length - 1);
          gradient.addColorStop(stop, color.trim());
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        backgroundApplied = true;
      }
    }

    // Fallback solid background if gradient failed
    if (!backgroundApplied) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Enable better text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Title
  ctx.fillStyle = theme.textColor;
  ctx.font = '700 56px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MY TOP 5', canvas.width / 2, 90);

  // Subtitle
  ctx.font = '500 32px Inter, sans-serif';
  ctx.fillStyle = theme.secondaryColor;
  ctx.fillText('GAMES OF ALL TIME', canvas.width / 2, 138);

  const startY = 200;
  const itemHeight = 310;
  const imageSize = 240;
  const spacing = 15;

  for (let i = 0; i < selectedGames.length; i++) {
    const game = selectedGames[i];
    const y = startY + i * itemHeight;

    // Card background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(50, y, canvas.width - 100, itemHeight - spacing);

    // Image container
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(70, y + 35, imageSize, imageSize);

    const imageUrl = cachedImages[game.id] || game.background_image;

    if (imageUrl && imageUrl !== 'loading') {
      try {
        const img = new Image();
        if (!imageUrl.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
          setTimeout(() => reject(new Error('Image load timeout')), 5000);
        });

        ctx.save();
        const scale = Math.max(imageSize / img.width, imageSize / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (imageSize - scaledWidth) / 2;
        const offsetY = (imageSize - scaledHeight) / 2;

        ctx.beginPath();
        ctx.rect(70, y + 35, imageSize, imageSize);
        ctx.clip();
        ctx.drawImage(img, 70 + offsetX, y + 35 + offsetY, scaledWidth, scaledHeight);
        ctx.restore();
      } catch {
        // Draw fallback - first letter
        ctx.fillStyle = theme.accentColor;
        ctx.font = '80px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(game.name.charAt(0), 70 + imageSize / 2, y + 35 + imageSize / 2 + 25);
      }
    } else {
      // No image - show first letter
      ctx.fillStyle = theme.accentColor;
      ctx.font = '80px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(game.name.charAt(0), 70 + imageSize / 2, y + 35 + imageSize / 2 + 25);
    }

    // Rank number
    ctx.fillStyle = theme.textColor;
    ctx.font = '100 60px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}`, 340, y + 75);

    // Game name with word wrap
    ctx.font = '500 28px Inter, sans-serif';
    ctx.fillStyle = theme.textColor;

    const maxWidth = canvas.width - 370;
    const words = game.name.split(' ');
    let line = '';
    let lineY = y + 130;
    const lineHeight = 36;
    let lineCount = 0;
    const maxLines = 3;

    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        if (lineCount < maxLines - 1) {
          ctx.fillText(line.trim(), 340, lineY);
          line = word + ' ';
          lineY += lineHeight;
          lineCount++;
        } else {
          const ellipsis = line.trim() + '...';
          ctx.fillText(ellipsis, 340, lineY);
          line = '';
          break;
        }
      } else {
        line = testLine;
      }
    }
    if (line && lineCount < maxLines) {
      ctx.fillText(line.trim(), 340, lineY);
      lineY += lineHeight;
    }

    // Year
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillStyle = theme.secondaryColor;
    ctx.fillText(game.released ? new Date(game.released).getFullYear().toString() : 'Classic', 340, lineY + 12);
  }

  // Username/social handle
  if (showUsernameInImage && username) {
    ctx.font = '400 26px Inter, sans-serif';
    ctx.fillStyle = theme.accentColor;
    ctx.textAlign = 'center';
    const displayName = `@${username}`;
    ctx.fillText(displayName, canvas.width / 2, canvas.height - 100);
  }

  // Footer advert
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';
  ctx.fillText('CREATE YOURS AT', canvas.width / 2, canvas.height - 42);

  ctx.font = '700 26px Inter, sans-serif';
  ctx.fillStyle = theme.accentColor;
  ctx.fillText('TOP5.GAMES', canvas.width / 2, canvas.height - 14);

  return canvas.toDataURL('image/png');
};
