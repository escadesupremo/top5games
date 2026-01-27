import { supabase, SUPABASE_URL } from '../config/supabase';

// HTML escape utility to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

export async function saveList({ username, isTwitter, isInstagram, selectedGames, cachedImages, generatedImage }) {
  // Sanitize username
  const sanitizedUsername = escapeHtml(username);

  // Prepare the data
  const listData = {
    username: sanitizedUsername,
    is_twitter: isTwitter,
    is_instagram: isInstagram,
    game_1_id: selectedGames[0].id,
    game_1_name: selectedGames[0].name,
    game_1_image: cachedImages[selectedGames[0].id] || selectedGames[0].background_image,
    game_1_year: selectedGames[0].released ? new Date(selectedGames[0].released).getFullYear() : null,
    game_2_id: selectedGames[1].id,
    game_2_name: selectedGames[1].name,
    game_2_image: cachedImages[selectedGames[1].id] || selectedGames[1].background_image,
    game_2_year: selectedGames[1].released ? new Date(selectedGames[1].released).getFullYear() : null,
    game_3_id: selectedGames[2].id,
    game_3_name: selectedGames[2].name,
    game_3_image: cachedImages[selectedGames[2].id] || selectedGames[2].background_image,
    game_3_year: selectedGames[2].released ? new Date(selectedGames[2].released).getFullYear() : null,
    game_4_id: selectedGames[3].id,
    game_4_name: selectedGames[3].name,
    game_4_image: cachedImages[selectedGames[3].id] || selectedGames[3].background_image,
    game_4_year: selectedGames[3].released ? new Date(selectedGames[3].released).getFullYear() : null,
    game_5_id: selectedGames[4].id,
    game_5_name: selectedGames[4].name,
    game_5_image: cachedImages[selectedGames[4].id] || selectedGames[4].background_image,
    game_5_year: selectedGames[4].released ? new Date(selectedGames[4].released).getFullYear() : null,
    generated_image_url: generatedImage || null,
    share_count: 0,
  };

  // Insert into Supabase
  const { data, error } = await supabase.from('top5_lists').insert([listData]).select();

  if (error) throw error;

  const newListId = data[0].id;

  // Upload PNG image and HTML share page to storage
  if (generatedImage) {
    try {
      const response = await fetch(generatedImage);
      const imageBlob = await response.blob();

      await supabase.storage.from('top5-images').upload(`${newListId}.png`, imageBlob, {
        contentType: 'image/png',
        upsert: true,
      });

      const publicImageUrl = `${SUPABASE_URL}/storage/v1/object/public/top5-images/${newListId}.png`;

      // Escape game names for safe HTML insertion
      const gamesList = selectedGames
        .map((g, i) => `${i + 1}. ${escapeHtml(g.name)}`)
        .join(' • ');

      const shareHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>@${sanitizedUsername}'s Top 5 Games</title>
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="@${sanitizedUsername}'s Top 5 Games of All Time">
    <meta name="twitter:description" content="${gamesList}">
    <meta name="twitter:image" content="${publicImageUrl}">
    <meta property="og:title" content="@${sanitizedUsername}'s Top 5 Games of All Time">
    <meta property="og:description" content="${gamesList}">
    <meta property="og:image" content="${publicImageUrl}">
    <meta property="og:image:width" content="390">
    <meta property="og:image:height" content="844">
    <meta property="og:type" content="website">
    <meta http-equiv="refresh" content="0;url=https://top5.games?list=${newListId}">
    <style>
        body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
        .container { text-align: center; padding: 2rem; }
        img { max-width: 390px; height: auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <img src="${publicImageUrl}" alt="@${sanitizedUsername}'s Top 5 Games">
        <p>Redirecting to Top 5 Games...</p>
    </div>
</body>
</html>`;

      const htmlBlob = new Blob([shareHtml], { type: 'text/html' });
      await supabase.storage.from('top5-images').upload(`${newListId}.html`, htmlBlob, {
        contentType: 'text/html',
        upsert: true,
      });
    } catch (uploadErr) {
      // Silently handle upload errors - the list is still saved
    }
  }

  return newListId;
}
