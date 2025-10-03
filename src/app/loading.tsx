export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4">
          <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">読み込み中...</h2>
        <p className="text-white/70">しばらくお待ちください</p>
      </div>
    </div>
  );
}



