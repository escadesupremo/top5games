export function ImagePreview({ generatedImage, isGenerating }) {
  if (!generatedImage && !isGenerating) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <div className="iphone-frame">
        <div className="iphone-screen" style={{ width: '390px', height: '844px' }}>
          {isGenerating ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Generating...</p>
              </div>
            </div>
          ) : (
            <img
              src={generatedImage}
              alt="Your Top 5 Games"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}
