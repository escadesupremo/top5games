export function Leaderboard({ leaderboard, expanded, setExpanded }) {
  if (leaderboard.length === 0) return null;

  const displayedGames = expanded ? leaderboard : leaderboard.slice(0, 5);

  return (
    <div className="bg-white rounded-xl p-6 smooth-shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Most Popular Games</h3>

      <div className="space-y-3">
        {displayedGames.map((game, index) => (
          <div key={game.name} className="flex items-center gap-3">
            <div className="text-lg font-bold text-gray-300 w-6">{index + 1}</div>

            {game.image && !game.image.startsWith('data:') ? (
              <img src={game.image} alt={game.name} className="w-10 h-10 object-cover rounded" />
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                {game.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-700 truncate">{game.name}</div>
            </div>

            <div className="text-sm text-gray-500">{game.count} picks</div>
          </div>
        ))}
      </div>

      {leaderboard.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? 'Show less ↑' : `Show all ${leaderboard.length} ↓`}
        </button>
      )}
    </div>
  );
}
