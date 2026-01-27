export function SelectedGames({ selectedGames, cachedImages, onRemove, onMoveUp, onMoveDown }) {
  if (selectedGames.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">🎮</div>
        <p>Search and select your top 5 games</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selectedGames.map((game, index) => (
        <div
          key={game.id}
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover-lift smooth-shadow"
        >
          <div className="text-2xl font-light text-gray-300 w-8 text-center">{index + 1}</div>

          {cachedImages[game.id] === 'loading' ? (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <img
              src={cachedImages[game.id] || game.background_image}
              alt={game.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate">{game.name}</div>
            <div className="text-sm text-gray-500">
              {game.released ? new Date(game.released).getFullYear() : 'Classic'}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move up"
            >
              ↑
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === selectedGames.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Move down"
            >
              ↓
            </button>
            <button
              onClick={() => onRemove(game.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      {selectedGames.length < 5 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          {5 - selectedGames.length} more to go...
        </div>
      )}
    </div>
  );
}
