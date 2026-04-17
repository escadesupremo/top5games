import { useState, useEffect } from 'react';
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
  const [isReddit, setIsReddit] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // live clock in top bar
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

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
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f3f5]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pb-20">

        {/* ========== TOP BAR ========== */}
        <div className="sticky top-0 z-50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 py-4 border-b border-[#22222a] bg-gradient-to-b from-[#0a0a0c] from-60% to-[rgba(10,10,12,0.85)] backdrop-blur">
          <div className="flex items-center gap-5">
            <div className="flex items-baseline gap-2 font-display text-[22px]">
              <span className="text-[#ff3355] -translate-y-[1px] inline-block">▲</span>
              <span>TOP5<span className="text-[#ff3355]">.</span>GAMES</span>
            </div>
            <div className="hidden sm:block w-px h-[22px] bg-[#2e2e38]" />
            <div className="font-mono-editor smallcaps text-[#a0a0aa] hidden md:block">
              GREATEST_GAMES / ALL-TIME / COMMUNITY-RANKED
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono-editor text-[11px]">
            {listCount > 0 && (
              <div className="px-2.5 py-1 border border-[#2e2e38] rounded-full bg-[#111115] inline-flex items-center">
                <span className="pulse-dot mr-1.5" /> {listCount.toLocaleString()} LISTS CREATED
              </div>
            )}
            <div className="text-[#a0a0aa] hidden sm:block">{clock} UTC</div>
          </div>
        </div>

        {/* ========== HERO ========== */}
        <div className="relative my-8 lg:my-10 border border-[#2e2e38] bg-gradient-to-b from-[#111115] to-[#0a0a0c] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(600px 300px at 85% 20%, rgba(255,51,85,0.12), transparent 70%)' }}
          />
          <div className="hero-rank-ghost select-none">5</div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-10 p-6 md:p-10 lg:p-12">
            {/* LEFT */}
            <div className="flex flex-col gap-3.5">
              <div className="font-mono-editor smallcaps text-[#a0a0aa] flex items-center">
                <span className="pulse-dot mr-2" /> NOW LIVE · BUILD YOUR TOP 5 · CAST YOUR PICKS
              </div>
              <h1 className="font-display text-[clamp(40px,6.5vw,80px)] leading-[0.95] m-0">
                What are your Top 5 games of all time?
              </h1>
              <div className="text-lg text-[#f3f3f5] max-w-[46ch] leading-[1.35]">
                Inspired by{' '}
                <a
                  href="https://www.instagram.com/americannightmarecody"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ff3355] hover:underline font-semibold"
                >
                  @americannightmarecody
                </a>{' '}
                sharing his all-time favorites, we built a place for every gamer to do the same.
              </div>
              <div className="italic text-[#a0a0aa] max-w-[44ch] border-l-2 border-[#ff3355] pl-3">
                "Pick five. Rank them. Defend them. The list is the argument."
              </div>
              <div className="font-mono-editor smallcaps flex gap-2.5 flex-wrap text-[#a0a0aa]">
                <span>PICK 5</span>
                <span className="text-[#606069]">·</span>
                <span>GENERATE IMAGE</span>
                <span className="text-[#606069]">·</span>
                <span>SHARE TO SOCIALS</span>
                <span className="text-[#606069]">·</span>
                <span className="text-[#ff3355]">NO ACCOUNT NEEDED</span>
              </div>
            </div>

            {/* RIGHT: YouTube frame */}
            <div className="flex items-start justify-center lg:justify-end gap-4">
              <div className="border border-[#2e2e38] bg-[#0a0a0c] p-2 shadow-[0_10px_40px_rgba(0,0,0,0.4)]" style={{ width: '216px' }}>
                <div className="overflow-hidden" style={{ width: '200px', height: '356px' }}>
                  <iframe
                    src="https://www.youtube.com/embed/vsU_69fRe1A"
                    title="Cody Rhodes Top 5 Games"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="font-mono-editor smallcaps text-[#a0a0aa] mt-2 flex justify-between">
                  <span>// DOSSIER</span>
                  <span className="text-[#ff3355]">▲ #1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== ERROR ========== */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6 border border-[#ff3355]/60 bg-[#2a1215] p-4 flex items-center gap-3">
            <span className="text-[#ff3355] font-mono-editor">[!]</span>
            <p className="text-[#ff6b6b] text-sm flex-1 font-mono-editor">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#a0a0aa] hover:text-[#ff3355] font-mono-editor text-xs"
            >
              ✕ ESC
            </button>
          </div>
        )}

        {/* ========== MAIN GRID ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-5">

            {/* Theme + Info row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Theme */}
              <div className="border border-[#22222a] bg-[#111115] p-4">
                <label className="block font-mono-editor smallcaps text-[#a0a0aa] mb-3">/ THEME</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {backgroundsLoading ? (
                    <div className="text-[#606069] text-xs font-mono-editor">LOADING…</div>
                  ) : Object.entries(backgrounds).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedBackground(key)}
                      className={`relative flex-shrink-0 w-12 h-12 border transition-all overflow-hidden ${
                        selectedBackground === key
                          ? 'border-[#ff3355] shadow-[0_0_0_2px_rgba(255,51,85,0.25)]'
                          : 'border-[#2e2e38] hover:border-[#a0a0aa]'
                      }`}
                      title={theme.name}
                    >
                      {theme.type === 'image' ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${theme.backgroundImage})` }} />
                      ) : (
                        <div className="w-full h-full" style={{ background: theme.gradient }} />
                      )}
                      {selectedBackground === key && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username & Social */}
              <div className="border border-[#22222a] bg-[#111115] p-4">
                <label className="block font-mono-editor smallcaps text-[#a0a0aa] mb-3">/ YOUR INFO</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606069] font-mono-editor">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, ''))}
                      placeholder="username"
                      maxLength={20}
                      className="w-full pl-8 pr-3 py-2.5 bg-[#0a0a0c] border border-[#2e2e38] text-[#f3f3f5] text-sm focus:border-[#ff3355] transition-all font-mono-editor"
                    />
                  </div>
                  <button
                    onClick={() => setIsTwitter(!isTwitter)}
                    className={`p-2.5 border transition-all ${
                      isTwitter ? 'bg-[#ff3355] text-[#0a0a0c] border-[#ff3355]' : 'bg-[#0a0a0c] text-[#a0a0aa] border-[#2e2e38] hover:border-[#a0a0aa]'
                    }`}
                    title="X / Twitter"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsInstagram(!isInstagram)}
                    className={`p-2.5 border transition-all ${
                      isInstagram ? 'bg-[#ff3355] text-[#0a0a0c] border-[#ff3355]' : 'bg-[#0a0a0c] text-[#a0a0aa] border-[#2e2e38] hover:border-[#a0a0aa]'
                    }`}
                    title="Instagram"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsReddit(!isReddit)}
                    className={`p-2.5 border transition-all ${
                      isReddit ? 'bg-[#ff3355] text-[#0a0a0c] border-[#ff3355]' : 'bg-[#0a0a0c] text-[#a0a0aa] border-[#2e2e38] hover:border-[#a0a0aa]'
                    }`}
                    title="Reddit"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                    </svg>
                  </button>
                </div>
                <p className="text-[11px] font-mono-editor mt-3 tracking-wider">
                  {!username ? (
                    <span className="text-[#ffb020]">[!] USERNAME REQUIRED TO GENERATE IMAGE</span>
                  ) : (isTwitter || isInstagram || isReddit) ? (
                    <span className="text-[#35d490]">
                      [✓] PROFILE LINKED →{' '}
                      {[
                        isTwitter && (
                          <a key="x" href={`https://x.com/${username}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            x.com/{username}
                          </a>
                        ),
                        isInstagram && (
                          <a key="ig" href={`https://instagram.com/${username}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            ig/{username}
                          </a>
                        ),
                        isReddit && (
                          <a key="rd" href={`https://reddit.com/user/${username}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            reddit.com/u/{username}
                          </a>
                        ),
                      ]
                        .filter(Boolean)
                        .reduce((acc, el, i) => (i === 0 ? [el] : [...acc, ' · ', el]), [])}
                    </span>
                  ) : (
                    <span className="text-[#a0a0aa]">// TOGGLE X · IG · REDDIT TO DRIVE TRAFFIC BACK</span>
                  )}
                </p>
              </div>
            </div>

            {/* Game Search */}
            <div className="border border-[#22222a] bg-[#111115] p-5">
              <label className="block font-mono-editor smallcaps text-[#a0a0aa] mb-3">/ SEARCH GAMES</label>
              <div className="relative">
                <div className="flex items-center gap-2 bg-[#0a0a0c] border border-[#2e2e38] px-3 focus-within:border-[#ff3355] transition-colors">
                  <span className="font-mono-editor text-[#a0a0aa]">/</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="type to search titles…"
                    spellCheck={false}
                    className="flex-1 bg-transparent border-0 py-3 text-[#f3f3f5] text-sm font-mono-editor placeholder:text-[#606069]"
                  />
                  {isSearching && (
                    <span className="font-mono-editor text-[11px] text-[#a0a0aa] smallcaps">SEARCHING…</span>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-[#111115] border border-[#2e2e38] shadow-[0_12px_40px_rgba(0,0,0,0.6)] max-h-80 overflow-y-auto">
                    {searchResults.map(game => (
                      <button
                        key={game.id}
                        onClick={() => selectGame(game)}
                        disabled={selectedGames.find(g => g.id === game.id) || selectedGames.length >= 5}
                        className="w-full text-left px-4 py-3 hover:bg-[#17171d] border-b border-[#22222a] last:border-b-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-3"
                      >
                        <div className="w-12 h-12 bg-[#17171d] border border-[#2e2e38] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {game.background_image ? (
                            <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#606069] font-mono-editor">{game.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#f3f3f5] font-medium truncate">{game.name}</div>
                          <div className="text-[#a0a0aa] text-xs font-mono-editor smallcaps mt-0.5">
                            {game.released ? new Date(game.released).getFullYear() : 'CLASSIC'}
                          </div>
                        </div>
                        <span className="font-mono-editor text-[#ff3355] text-[11px] smallcaps">+ PICK</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs mt-3 font-mono-editor smallcaps text-[#a0a0aa]">
                <span className="text-[#ff3355]">{selectedGames.length}</span> / 5 PICKED
              </p>
            </div>

            {/* Selected Games */}
            <div className="border border-[#22222a] bg-[#111115] p-5">
              <label className="block font-mono-editor smallcaps text-[#a0a0aa] mb-4">/ YOUR RANKINGS</label>

              {selectedGames.length === 0 ? (
                <div className="py-12 text-center font-mono-editor smallcaps text-[#606069]">
                  / no_picks — use search above to start your top 5
                </div>
              ) : (
                <div className="flex flex-col">
                  {selectedGames.map((game, index) => (
                    <div
                      key={game.id}
                      className="group relative flex items-center gap-4 py-4 px-2 border-b border-[#22222a] last:border-b-0 transition-colors hover:bg-[#0a0a0c]"
                    >
                      <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-[#ff3355] transition-colors" />
                      <span className="rank-num w-10 text-left">{String(index + 1).padStart(2, '0')}</span>
                      <div className="w-14 h-14 bg-[#17171d] border border-[#2e2e38] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {cachedImages[game.id] === 'loading' ? (
                          <span className="text-[#606069] text-xs font-mono-editor animate-pulse">…</span>
                        ) : cachedImages[game.id] ? (
                          <img src={cachedImages[game.id]} alt={game.name} className="w-full h-full object-cover" />
                        ) : game.background_image ? (
                          <img src={game.background_image} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#606069] font-mono-editor">{game.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#f3f3f5] font-semibold truncate text-lg tracking-tight">{game.name}</div>
                        <div className="font-mono-editor smallcaps text-[#a0a0aa] mt-1 flex items-center gap-2">
                          <span>{game.released ? new Date(game.released).getFullYear() : 'CLASSIC'}</span>
                          {cachedImages[game.id] === 'loading' && (
                            <>
                              <span className="text-[#606069]">·</span>
                              <span className="text-[#ffb020]">LOADING…</span>
                            </>
                          )}
                          {cachedImages[game.id] && cachedImages[game.id] !== 'loading' && (
                            <>
                              <span className="text-[#606069]">·</span>
                              <span className="text-[#35d490]">✓ READY</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 font-mono-editor">
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="w-9 h-9 border border-[#2e2e38] bg-[#0a0a0c] text-[#a0a0aa] hover:text-[#ff3355] hover:border-[#ff3355] disabled:opacity-30 disabled:hover:text-[#a0a0aa] disabled:hover:border-[#2e2e38] transition-colors"
                          aria-label="move up"
                        >▲</button>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index === selectedGames.length - 1}
                          className="w-9 h-9 border border-[#2e2e38] bg-[#0a0a0c] text-[#a0a0aa] hover:text-[#ff3355] hover:border-[#ff3355] disabled:opacity-30 disabled:hover:text-[#a0a0aa] disabled:hover:border-[#2e2e38] transition-colors"
                          aria-label="move down"
                        >▼</button>
                        <button
                          onClick={() => removeGame(game.id)}
                          className="w-9 h-9 border border-[#2e2e38] bg-[#0a0a0c] text-[#a0a0aa] hover:text-[#ff6b6b] hover:border-[#ff6b6b] transition-colors"
                          aria-label="remove"
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleSubmit}
                disabled={selectedGames.length !== 5 || isGenerating || isSaving || !username}
                className="btn-editorial btn-primary"
              >
                {isGenerating ? '▲ GENERATING…' : isSaving ? '▲ SAVING…' : saveSuccess ? '✓ SUBMITTED' : '▲ SUBMIT MY PICKS'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN — Leaderboard */}
          <div className="space-y-5">
            <div className="border border-[#22222a] bg-[#111115] p-5">
              <h3 className="font-mono-editor smallcaps text-[#a0a0aa] mb-4 flex items-center gap-2">
                <span className="text-[#ff3355]">▲</span> MOST PICKED · COMMUNITY
              </h3>
              {leaderboard.length === 0 ? (
                <p className="font-mono-editor smallcaps text-[#606069] text-center py-6">/ loading_feed…</p>
              ) : (
                <div className="flex flex-col">
                  {(leaderboardExpanded ? leaderboard : leaderboard.slice(0, 5)).map((game, index) => (
                    <div
                      key={game.name}
                      className="flex items-center gap-3 py-3 border-b border-[#22222a] last:border-b-0"
                    >
                      <span
                        className={`font-display text-[20px] w-7 text-center ${
                          index < 3 ? 'text-[#ff3355]' : 'text-[#606069]'
                        }`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="w-10 h-10 bg-[#17171d] border border-[#2e2e38] overflow-hidden flex-shrink-0">
                        {game.image && !game.image.startsWith('data:') ? (
                          <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#606069] font-mono-editor">
                            {game.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#f3f3f5] font-medium truncate text-sm">{game.name}</div>
                      </div>
                      <div className="font-mono-editor text-sm text-[#a0a0aa]">{game.count}</div>
                    </div>
                  ))}
                </div>
              )}
              {leaderboard.length > 5 && (
                <button
                  onClick={() => setLeaderboardExpanded(!leaderboardExpanded)}
                  className="w-full mt-4 font-mono-editor smallcaps text-[#ff3355] hover:text-[#f3f3f5] transition-colors"
                >
                  {leaderboardExpanded ? '▲ SHOW LESS' : `▼ SHOW ALL ${leaderboard.length}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        <footer className="mt-16 pt-5 border-t border-[#22222a] flex flex-col sm:flex-row justify-between gap-2 font-mono-editor smallcaps text-[#606069]">
          <div>TOP5.GAMES · COMMUNITY-RANKED CATALOG OF GREATEST GAMES · MADE WITH ♥ FOR GAMERS</div>
          <div>V1.0.0 · UPDATED CONTINUOUSLY · SEEDED 2026</div>
        </footer>
      </div>

      {/* ========== GENERATED IMAGE MODAL ========== */}
      {generatedImage && (
        <div
          className="fixed inset-0 bg-[rgba(5,5,8,0.72)] backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={(e) => e.target === e.currentTarget && setGeneratedImage(null)}
        >
          <div className="modal-content bg-[#111115] border border-[#2e2e38] p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-[0_16px_60px_rgba(0,0,0,0.7)]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="font-mono-editor smallcaps text-[#a0a0aa]">/ DOSSIER · YOUR LIST</div>
                <h3 className="font-display text-2xl text-[#f3f3f5] mt-1">Your Top 5 Games</h3>
              </div>
              <button
                onClick={() => setGeneratedImage(null)}
                className="font-mono-editor text-[11px] text-[#a0a0aa] hover:text-[#ff3355] smallcaps"
              >
                ✕ ESC
              </button>
            </div>
            <div className="flex justify-center mb-5">
              <div className="iphone-frame">
                <div className="iphone-screen">
                  <img src={generatedImage} alt="Top 5 Games" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={downloadImage} className="btn-editorial btn-primary">
                ▼ DOWNLOAD
              </button>
              <button
                onClick={() => setGeneratedImage(null)}
                className="btn-editorial btn-ghost"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
