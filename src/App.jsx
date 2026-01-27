import { useState } from 'react';
import { useGameSearch } from './hooks/useGameSearch';
import { useBackgrounds } from './hooks/useBackgrounds';
import { useLeaderboard } from './hooks/useLeaderboard';
import { generateTop5Image } from './utils/canvasRenderer';
import { saveList } from './services/listService';

function App() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedGames,
    cachedImages,
    selectGame,
    removeGame,
    moveUp,
    moveDown,
  } = useGameSearch();

  const { backgrounds, selectedBackground, setSelectedBackground, backgroundsLoading, currentTheme } =
    useBackgrounds();

  const {
    leaderboard,
    listCount,
    leaderboardExpanded,
    setLeaderboardExpanded,
    loadLeaderboard,
    loadRecentLists,
    loadListCount,
  } = useLeaderboard();

  const [username, setUsername] = useState('');
  const [showUsernameInImage] = useState(true);
  const [isTwitter, setIsTwitter] = useState(false);
  const [isInstagram, setIsInstagram] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (selectedGames.length !== 5) {
      setErrorMessage('Please complete your top 5!');
      return;
    }

    if (!username) {
      setErrorMessage('Please enter a username!');
      return;
    }

    if (!currentTheme) {
      setErrorMessage('Please select a theme!');
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await generateTop5Image(
        selectedGames,
        currentTheme,
        username,
        showUsernameInImage,
        cachedImages
      );
      setGeneratedImage(imageUrl);

      setIsSaving(true);
      try {
        await saveList({
          username,
          isTwitter,
          isInstagram,
          selectedGames,
          cachedImages,
          generatedImage: imageUrl,
        });
        setSaveSuccess(true);

        loadLeaderboard();
        loadRecentLists();
        loadListCount();
      } catch {
        // Still show the image even if save fails
      }
    } catch (error) {
      setErrorMessage('Failed to generate image: ' + error.message);
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = username ? `top5-games-${username}.png` : 'top5-games.png';
    link.href = generatedImage;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">5</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Top 5 Games</h1>
              <p className="text-xs text-slate-500">Discover Favourites</p>
            </div>
          </div>
          {listCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <span>🎮</span>
              <span><span className="font-semibold text-slate-700">{listCount.toLocaleString()}</span> lists created</span>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-3xl">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* YouTube Embed */}
              <div className="flex-shrink-0">
                <div className="rounded-xl overflow-hidden shadow-lg" style={{ width: '200px', height: '356px' }}>
                  <iframe
                    src="https://www.youtube.com/embed/vsU_69fRe1A"
                    title="Cody Rhodes Top 5 Games"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Story Content */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  What are your Top 5 games of all time?
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Inspired by <a href="https://www.instagram.com/americannightmarecody" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 font-semibold">@americannightmarecody</a> sharing his all-time favorite games,
                  we built a place where gamers can do the same. Create your own Top 5 list, generate a shareable image,
                  and spark conversations on social media.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm">
                  <div className="flex items-center gap-1.5 bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full">
                    <span>🎮</span> Share your top 5
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                    <span>🖼️</span> Generate images
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                    <span>🔍</span> Discover favorites
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <p className="text-red-700 text-sm flex-1">{errorMessage}</p>
              <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Theme & Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Theme Selection */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <label className="block text-slate-700 text-xs font-semibold tracking-wider uppercase mb-3">
                  Theme
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {backgroundsLoading ? (
                    <div className="text-slate-400 text-xs">Loading...</div>
                  ) : Object.entries(backgrounds).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedBackground(key)}
                      className={`relative flex-shrink-0 w-12 h-12 rounded-lg border-2 transition-all overflow-hidden ${
                        selectedBackground === key
                          ? 'border-violet-500 ring-2 ring-violet-200 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title={theme.name}
                    >
                      {theme.type === 'image' ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${theme.backgroundImage})` }} />
                      ) : (
                        <div className="w-full h-full" style={{ background: theme.gradient }} />
                      )}
                      {selectedBackground === key && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username & Social */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <label className="block text-slate-700 text-xs font-semibold tracking-wider uppercase mb-3">
                  Your Info
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, ''))}
                      placeholder="username"
                      maxLength={20}
                      className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setIsTwitter(!isTwitter)}
                    className={`p-2.5 rounded-lg border-2 transition-all ${
                      isTwitter ? 'bg-black text-white border-black' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                    title="X / Twitter"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsInstagram(!isInstagram)}
                    className={`p-2.5 rounded-lg border-2 transition-all ${
                      isInstagram ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white border-pink-500' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                    title="Instagram"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  {!username ? (
                    <span className="text-amber-600">⚠ Username required to generate your image</span>
                  ) : (isTwitter || isInstagram) ? (
                    <span className="text-emerald-600">
                      ✓ We'll link your profile to {isTwitter && <a href={`https://x.com/${username}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">x.com/{username}</a>}{isTwitter && isInstagram && ' & '}{isInstagram && <a href={`https://instagram.com/${username}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">instagram.com/{username}</a>}
                    </span>
                  ) : (
                    <span className="text-slate-500">Toggle X or Instagram to get traffic back to your socials!</span>
                  )}
                </p>
              </div>
            </div>

            {/* Game Search */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <label className="block text-slate-700 text-xs font-semibold tracking-wider uppercase mb-3">
                Search Games
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    Searching...
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.map(game => (
                      <button
                        key={game.id}
                        onClick={() => selectGame(game)}
                        disabled={selectedGames.find(g => g.id === game.id) || selectedGames.length >= 5}
                        className="w-full text-left px-4 py-3 hover:bg-violet-50 border-b border-slate-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {game.background_image ? (
                            <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 font-medium">{game.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-900 font-medium truncate">{game.name}</div>
                          <div className="text-slate-500 text-sm">
                            {game.released ? new Date(game.released).getFullYear() : 'Classic'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-3">
                <span className="font-semibold text-violet-600">{selectedGames.length}</span>/5 games selected
              </p>
            </div>

            {/* Selected Games */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <label className="block text-slate-700 text-xs font-semibold tracking-wider uppercase mb-4">
                Your Rankings
              </label>

              {selectedGames.length === 0 ? (
                <p className="text-slate-400 py-8 text-center">No games selected yet</p>
              ) : (
                <div className="space-y-3">
                  {selectedGames.map((game, index) => (
                    <div key={game.id} className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white rounded-xl p-3 border border-slate-100 hover:shadow-md transition-all">
                      <span className="text-2xl font-light text-violet-400 w-8 text-center">
                        {index + 1}
                      </span>
                      <div className="w-0.5 h-10 bg-gradient-to-b from-violet-200 to-transparent rounded-full" />
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {cachedImages[game.id] === 'loading' ? (
                          <span className="text-slate-400 text-xs animate-pulse">...</span>
                        ) : cachedImages[game.id] ? (
                          <img src={cachedImages[game.id]} alt={game.name} className="w-full h-full object-cover" />
                        ) : game.background_image ? (
                          <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 font-medium">{game.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-800 font-medium truncate">{game.name}</div>
                        <div className="text-slate-500 text-sm flex items-center gap-2">
                          {game.released ? new Date(game.released).getFullYear() : 'Classic'}
                          {cachedImages[game.id] === 'loading' && <span className="text-amber-500">Loading...</span>}
                          {cachedImages[game.id] && cachedImages[game.id] !== 'loading' && <span className="text-emerald-500">✓ Ready</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveUp(index)} disabled={index === 0} className="p-2 text-slate-400 hover:text-violet-600 disabled:opacity-30 transition-colors">↑</button>
                        <button onClick={() => moveDown(index)} disabled={index === selectedGames.length - 1} className="p-2 text-slate-400 hover:text-violet-600 disabled:opacity-30 transition-colors">↓</button>
                        <button onClick={() => removeGame(game.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={selectedGames.length !== 5 || isGenerating || isSaving || !username}
                className="py-4 px-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl uppercase text-sm tracking-wide"
              >
                {isGenerating ? 'Generating...' : isSaving ? 'Saving...' : saveSuccess ? '✓ Submitted!' : 'Submit My Picks'}
              </button>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-slate-700 text-xs font-semibold tracking-wider uppercase mb-4 flex items-center gap-2">
                <span className="text-lg">🏆</span> Most Popular Games
              </h3>
              {leaderboard.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {(leaderboardExpanded ? leaderboard : leaderboard.slice(0, 5)).map((game, index) => (
                    <div key={game.name} className="flex items-center gap-3">
                      <span className={`text-lg font-bold w-6 text-center ${index < 3 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {index + 1}
                      </span>
                      <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                        {game.image && !game.image.startsWith('data:') ? (
                          <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">{game.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-700 font-medium truncate text-sm">{game.name}</div>
                      </div>
                      <div className="text-sm text-slate-400 font-medium">{game.count}</div>
                    </div>
                  ))}
                </div>
              )}
              {leaderboard.length > 5 && (
                <button
                  onClick={() => setLeaderboardExpanded(!leaderboardExpanded)}
                  className="w-full mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  {leaderboardExpanded ? 'Show less ↑' : `Show all ${leaderboard.length} ↓`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-slate-400">
          Made with ❤️ for gamers
        </footer>
      </div>

      {/* Generated Image Modal */}
      {generatedImage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setGeneratedImage(null)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">Your Top 5 Games</h3>
              <button onClick={() => setGeneratedImage(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            <div className="flex justify-center mb-5">
              <div className="iphone-frame">
                <div className="iphone-screen">
                  <img src={generatedImage} alt="Top 5 Games" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={downloadImage} className="py-2.5 px-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all text-sm">
                📥 Download
              </button>
              <button onClick={() => setGeneratedImage(null)} className="py-2.5 px-5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-all text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
