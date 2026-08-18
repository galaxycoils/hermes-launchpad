import { useNavigate } from "react-router";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount: number;
}

const tabs = [
  { id: "home", label: "Home", icon: "🏠", path: "/" },
  { id: "trade", label: "Trade", icon: "📈", path: "/trade" },
  { id: "portfolio", label: "Portfolio", icon: "👤", path: "/portfolio" },
  { id: "activity", label: "Activity", icon: "🔔", path: "/activity" },
  { id: "menu", label: "Menu", icon: "☰", path: "/menu" },
];

export default function BottomNav({ activeTab, onTabChange, unreadCount }: BottomNavProps) {
  const navigate = useNavigate();

  const handleTabChange = (tab: typeof tabs[number]) => {
    if (tab.id !== activeTab) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
    onTabChange(tab.id);
    navigate(tab.path);
  };

  const handleFabPress = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    navigate("/trade");
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="relative flex items-end h-[60px]">
        {/* Left group: Home, Trade */}
        <div className="flex flex-1">
          {tabs.slice(0, 2).map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab)}
            />
          ))}
        </div>

        {/* Center FAB */}
        <div className="flex-shrink-0 flex justify-center" style={{ width: "68px" }}>
          <button
            onClick={handleFabPress}
            className="-mt-5 flex items-center justify-center w-14 h-14 rounded-full bg-pump text-black shadow-lg shadow-pump/30 hover:shadow-pump/50 active:scale-[0.92] transition-all"
            aria-label="Quick trade"
          >
            <span className="text-2xl leading-none">🚀</span>
          </button>
        </div>

        {/* Right group: Portfolio, Activity, Menu */}
        <div className="flex flex-1">
          {tabs.slice(2).map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab)}
              badge={tab.id === "activity" ? unreadCount : 0}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function TabButton({
  tab,
  isActive,
  onClick,
  badge = 0,
}: {
  tab: (typeof tabs)[number];
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
        isActive ? "text-pump" : "text-white/60"
      }`}
      aria-label={tab.label}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active indicator dot */}
      {isActive && (
        <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pump" />
      )}

      <span className="text-xl leading-none relative">
        {tab.icon}
        {/* Badge */}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-dump px-1 text-[9px] font-bold text-white leading-none">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wide leading-none ${
          isActive ? "text-pump" : "text-white/60"
        }`}
      >
        {tab.label}
      </span>
    </button>
  );
}
