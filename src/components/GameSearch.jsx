export function GameSearch({ searchQuery, setSearchQuery, searchResults, isSearching, onSelectGame, disabled }) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={disabled ? 'Top 5 complete!' : 'Search for a game...'}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={disabled}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-gray-300 transition-colors bg-white disabled:bg-gray-100 disabled:text-gray-500"
      />

      {isSearching && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-100 max-h-80 overflow-y-auto">
          {searchResults.map((game) => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
            >
              {game.background_image ? (
                <img
                  src={game.background_image}
                  alt={game.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                  {game.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{game.name}</div>
                <div className="text-sm text-gray-500">
                  {game.released ? new Date(game.released).getFullYear() : 'Classic'}
                  {game.rating && ` • ★ ${game.rating.toFixed(1)}`}
                </div>
              </div>
              {game._fromCache && (
                <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded">Cached</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
