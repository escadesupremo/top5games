export function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Privacy Policy</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="prose prose-sm text-gray-600 space-y-4">
          <p>
            <strong>Data Collection:</strong> We collect minimal data to provide our service, including
            your username, game selections, and optionally your email if you subscribe to our
            newsletter.
          </p>

          <p>
            <strong>Data Usage:</strong> Your data is used to generate and display your Top 5 Games
            list, show leaderboards, and send newsletter updates if subscribed.
          </p>

          <p>
            <strong>Data Storage:</strong> All data is stored securely on Supabase servers. Game
            images are cached to improve performance.
          </p>

          <p>
            <strong>Third Parties:</strong> We use RAWG.io API for game data. No personal data is
            shared with third parties except as required for the service.
          </p>

          <p>
            <strong>Your Rights:</strong> You can request deletion of your data at any time by
            contacting us.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
