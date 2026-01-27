import { SUPABASE_URL } from '../config/supabase';

export function ShareButtons({ generatedImage, savedListId, selectedGames, username }) {
  const downloadImage = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    const filename = username ? `top5-games-${username}.png` : 'top5-games.png';
    link.download = filename;
    link.href = generatedImage;
    link.click();
  };

  const copyToClipboard = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert('Image copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy image. Please try downloading instead.');
    }
  };

  const shareToX = () => {
    if (!generatedImage) {
      alert('Please generate an image first!');
      return;
    }

    const shareUrl = savedListId
      ? `${SUPABASE_URL}/storage/v1/object/public/top5-images/${savedListId}.html`
      : 'https://top5.games';

    const games = selectedGames.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
    const tweetText = `My Top 5 Games of All Time 🎮\n\n${games}\n\nCreate yours:`;
    const hashtags = 'Top5Games,gaming';

    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${hashtags}`;
    window.open(xUrl, '_blank', 'width=550,height=420');
  };

  const copyShareLink = () => {
    if (!savedListId) {
      alert('Please save your list first to get a shareable link!');
      return;
    }

    const shareUrl = `${SUPABASE_URL}/storage/v1/object/public/top5-images/${savedListId}.html`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  if (!generatedImage) return null;

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={downloadImage}
        className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
      >
        <span>📥</span> Download
      </button>

      <button
        onClick={copyToClipboard}
        className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <span>📋</span> Copy
      </button>

      <button
        onClick={shareToX}
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
      >
        <span>𝕏</span> Share
      </button>

      {savedListId && (
        <button
          onClick={copyShareLink}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <span>🔗</span> Copy Link
        </button>
      )}
    </div>
  );
}
