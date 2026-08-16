export default function BottomTabBar({
  tab,
  onTabChange,
  onCreatePress,
}: {
  tab: "tokens" | "profile";
  onTabChange: (tab: "tokens" | "profile") => void;
  onCreatePress: () => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-black/90 backdrop-blur-xl px-4 pb-[env(safe-area-inset-bottom)] sm:hidden"
      aria-label="Mobile navigation"
    >
      <button
        onClick={() => onTabChange("tokens")}
        className={`flex-1 py-3 text-sm font-black transition-colors ${
          tab === "tokens" ? "text-pump" : "text-white/40"
        }`}
      >
        Trade
      </button>

      <button
        onClick={onCreatePress}
        className="-mt-4 rounded-full bg-pump px-5 py-3 text-sm font-black text-black shadow-lg shadow-pump/20 hover:shadow-pump/40 hover:bg-pump/90 active:scale-[0.95] transition-all"
      >
        + Create
      </button>

      <button
        onClick={() => onTabChange("profile")}
        className={`flex-1 py-3 text-sm font-black transition-colors ${
          tab === "profile" ? "text-pump" : "text-white/40"
        }`}
      >
        Profile
      </button>
    </nav>
  );
}
