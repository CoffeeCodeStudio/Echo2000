/**
 * @module HeroLanding
 * Authentic early-2000s Swedish social network landing page with promo video.
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface PublicStatsResponse {
  stats?: {
    members?: number;
    messages?: number;
    guestbook?: number;
    klotter?: number;
  };
  recentMembers?: Array<{
    user_id: string;
    username: string;
    avatar_url: string | null;
  }>;
}

export function HeroLanding() {
  const navigate = useNavigate();
  const [memberCount, setMemberCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [guestbookCount, setGuestbookCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-stats`,
          {
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            signal: controller.signal,
          }
        );
        if (!response.ok) return;
        const data = (await response.json()) as PublicStatsResponse;
        setMemberCount(data.stats?.members ?? 0);
        setMessageCount(data.stats?.messages ?? 0);
        setGuestbookCount(data.stats?.guestbook ?? 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    };
    fetchStats();
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen w-full flex-1 bg-[#e5e5e5]">
      {/* Top banner */}
      <div className="bg-[#555] text-white text-center py-1 text-[10px] tracking-widest uppercase">
        ★ Echo2000 — Community för oss som minns 56K-modem ★
      </div>

      <div className="max-w-[800px] mx-auto py-6 px-3">
        {/* Hero section */}
        <div className="bg-white border border-[#999] mb-3">
          <div className="bg-[#555] px-3 py-1.5">
            <h1 className="text-[13px] font-bold text-white uppercase tracking-wide">Välkommen</h1>
          </div>
          <div className="px-4 py-6 text-center">
            <div className="text-[32px] sm:text-[42px] font-bold" style={{ fontFamily: "Verdana, Tahoma, sans-serif" }}>
              <span className="text-[#ff6600]">Echo</span>
              <span className="text-[#555]">2000</span>
            </div>
            <p className="text-[13px] text-[#555] mt-2 max-w-[500px] mx-auto">
              Ett community inspirerat av tidigt 2000-tal. Bygg din profil, chatta med folk och häng —&nbsp;
              <strong>utan algoritmer</strong>.
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={() => navigate("/auth")}
                className="px-5 py-2 text-[12px] font-bold text-white bg-[#ff6600] border border-[#cc5500] hover:bg-[#e55c00] cursor-pointer"
              >
                Skapa profil — gratis
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="px-5 py-2 text-[12px] font-bold text-[#333] bg-[#ddd] border border-[#999] hover:bg-[#ccc] cursor-pointer"
              >
                Logga in
              </button>
            </div>
          </div>
        </div>

        {/* Video section */}
        <div className="bg-white border border-[#999] mb-3">
          <div className="bg-[#555] px-2 py-1">
            <h2 className="text-[11px] font-bold text-white uppercase">Se hur det funkar</h2>
          </div>
          <div className="p-2 flex justify-center">
            <video
              src="/videos/echo2000-promo.mp4"
              autoPlay
              muted
              loop
              playsInline
              controls
              className="border border-[#ccc]"
              style={{ maxWidth: "480px", width: "100%", aspectRatio: "16/9", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* 3 USP cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {[
            { emoji: "📖", title: "Gästbok", desc: "Skriv till dina vänner — precis som förr." },
            { emoji: "💬", title: "Chatt", desc: "Snacka i realtid, MSN-style." },
            { emoji: "🎨", title: "Klotterplank", desc: "Rita och dela med communityn." },
          ].map((usp) => (
            <div key={usp.title} className="bg-white border border-[#999]">
              <div className="bg-[#555] px-2 py-1">
                <h3 className="text-[11px] font-bold text-white uppercase">{usp.emoji} {usp.title}</h3>
              </div>
              <div className="p-2">
                <p className="text-[11px] text-[#555]">{usp.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="bg-white border border-[#999] mb-3">
          <div className="bg-[#555] px-2 py-1">
            <h2 className="text-[11px] font-bold text-white uppercase">Statistik</h2>
          </div>
          <div className="p-2 flex justify-around text-center">
            {[
              { label: "Medlemmar", value: memberCount },
              { label: "Meddelanden", value: messageCount },
              { label: "Gästboksinlägg", value: guestbookCount },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-[18px] font-bold text-[#ff6600]" style={{ fontFamily: "Verdana, sans-serif" }}>
                  {stat.value.toLocaleString("sv-SE")}
                </div>
                <div className="text-[10px] text-[#999] uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border border-[#999] px-3 py-2 text-center">
          <p className="text-[11px] text-[#555] mb-2">
            Inga algoritmer. Ingen reklam. Bara folk som vill hänga.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-1.5 text-[11px] font-bold text-white bg-[#ff6600] border border-[#cc5500] hover:bg-[#e55c00] cursor-pointer"
          >
            Gå med nu — det är gratis!
          </button>
          <div className="text-[9px] text-[#999] mt-2">© 2024 Echo2000 — BETA v1.0</div>
        </div>
      </div>
    </div>
  );
}
