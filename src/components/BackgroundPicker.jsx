export function BackgroundPicker({ backgrounds, selectedBackground, setSelectedBackground, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const bgKeys = Object.keys(backgrounds);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-600">Choose Theme</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {bgKeys.map((key) => {
          const bg = backgrounds[key];
          const isSelected = selectedBackground === key;

          return (
            <button
              key={key}
              onClick={() => setSelectedBackground(key)}
              className={`relative w-full aspect-square rounded-lg overflow-hidden transition-all ${
                isSelected ? 'ring-2 ring-offset-2 ring-gray-800 scale-105' : 'hover:scale-105'
              }`}
              title={bg.name}
            >
              {bg.type === 'image' && bg.backgroundImage ? (
                <img src={bg.backgroundImage} alt={bg.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: bg.gradient }} />
              )}
              {bg.overlay && <div className="absolute inset-0" style={{ background: bg.overlay }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
