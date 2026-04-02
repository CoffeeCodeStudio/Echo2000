/**
 * @module HeroLanding
 * Authentic early-2000s Swedish social network landing page.
 * Flat design, no gradients, no shadows, no rounded corners.
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface MemberAvatar {
  id: string;
  username: string;
  avatar_url: string | null;
}

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
  const [members, setMembers] = useState<MemberAvatar[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [guestbookCount, setGuestbookCount] = useState(0);
  const [klotterCount, setKlotterCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMembers = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-stats`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as PublicStatsResponse;

        setMembers(
          (data.recentMembers ?? []).slice(0, 8).map((member) => ({
            id: member.user_id,
            username: member.username,
            avatar_url: member.avatar_url,
          }))
        );
        setMemberCount(data.stats?.members ?? 0);
        setMessageCount(data.stats?.messages ?? 0);
        setGuestbookCount(data.stats?.guestbook ?? 0);
        setKlotterCount(data.stats?.klotter ?? 0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    };

    fetchMembers();

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen w-full flex-1 bg-[#e5e5e5]">
      {/* Top banner */}
      <div className="bg-[#555] text-white text-center py-1 text-[10px] tracking-widest uppercase">
        ★ Echo2000 — Community för oss som minns 56K-modem ★
      </div>

      {/* Main content area */}
      <div className="max-w-[700px] mx-auto py-6 px-3">
        {/* Logo / title box */}
        <div className="bg-white border border-[#999] mb-2">
          <div className="bg-[#555] px-3 py-1.5">
            <h1 className="text-[13px] font-bold text-white uppercase tracking-wide">Välkommen</h1>
          </div>
          <div className="px-4 py-5 text-center">
            <div className="text-[28px] font-bold" style={{ fontFamily: "Verdana, Tahoma, sans-serif" }}>
              <span className="text-[#333]">Välkommen till </span>
              <span className="text-[#ff6600]">Echo</span>
              <span className="text-[#555]">2000</span>
            </div>
            <p className="text-[12px] text-[#555] mt-2">
              Chatta med folk. Bygg din profil. Inga algoritmer. Som förr, fast nu.
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Left column - login/register */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Login box */}
            <div className="bg-white border border-[#999]">
              <div className="bg-[#555] px-2 py-1">
                <h2 className="text-[11px] font-bold text-white uppercase">Logga in / Registrera</h2>
              </div>
              <div className="p-3">
                <p className="text-[11px] text-[#333] mb-3">
                  Skapa din profil och bli en del av communityn. Helt gratis!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate("/auth")}
                    className="flex-1 px-3 py-1.5 text-[11px] font-bold text-white bg-[#ff6600] border border-[#cc5500] hover:bg-[#e55c00] cursor-pointer"
                  >
                    Skapa profil
                  </button>
                  <button
                    onClick={() => navigate("/auth")}
                    className="flex-1 px-3 py-1.5 text-[11px] font-bold text-[#333] bg-[#ddd] border border-[#999] hover:bg-[#ccc] cursor-pointer"
                  >
                    Logga in
                  </button>
                </div>
              </div>
            </div>

            {/* Features box */}
            <div className="bg-white border border-[#999]">
              <div className="bg-[#555] px-2 py-1">
                <h2 className="text-[11px] font-bold text-white uppercase">Funktioner</h2>
              </div>
              <div className="p-2">
                <ul className="text-[11px] text-[#333] space-y-1">
                  {[
                    { emoji: "📖", text: "Gästbok — skriv till dina vänner" },
                    { emoji: "👤", text: "Profilbilder — visa vem du är" },
                    { emoji: "❤️", text: "Vänner — bygg ditt nätverk" },
                    { emoji: "🎨", text: "Klotterplank — rita och dela" },
                    { emoji: "💬", text: "Chatt — snacka i realtid" },
                    { emoji: "📡", text: "Lajv — vad händer just nu?" },
                  ].map((f) => (
                    <li key={f.text} className="flex items-start gap-1.5">
                      <span className="shrink-0">{f.emoji}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right column - members + info */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Stats box */}
            <div className="bg-white border border-[#999]">
              <div className="bg-[#555] px-2 py-1">
                <h2 className="text-[11px] font-bold text-white uppercase">Statistik</h2>
              </div>
              <div className="p-2 text-[11px] text-[#333]">
                <div className="flex justify-between border-b border-[#ddd] py-1">
                  <span>Medlemmar:</span>
                  <span className="font-bold text-[#ff6600]">{memberCount}</span>
                </div>
                <div className="flex justify-between border-b border-[#ddd] py-1">
                  <span>Meddelanden:</span>
                  <span className="font-bold text-[#ff6600]">{messageCount.toLocaleString("sv-SE")}</span>
                </div>
                <div className="flex justify-between border-b border-[#ddd] py-1">
                  <span>Gästbok:</span>
                  <span className="font-bold text-[#ff6600]">{guestbookCount}</span>
                </div>
                <div className="flex justify-between border-b border-[#ddd] py-1">
                  <span>Klotter:</span>
                  <span className="font-bold text-[#ff6600]">{klotterCount}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Status:</span>
                  <span className="font-bold text-[#339900]">BETA v1.0</span>
                </div>
              </div>
            </div>

            {/* Recent members box */}
            <div className="bg-white border border-[#999]">
              <div className="bg-[#555] px-2 py-1">
                <h2 className="text-[11px] font-bold text-white uppercase">Nya medlemmar</h2>
              </div>
              <div className="p-2">
                {members.length === 0 ? (
                  <p className="text-[10px] text-[#999]">Laddar...</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {members.map((m) => (
                      <div key={m.id} className="text-center">
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt={m.username}
                            className="w-10 h-10 border border-[#999] object-cover mx-auto"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 border border-[#999] bg-[#eee] flex items-center justify-center text-[11px] font-bold text-[#666] mx-auto">
                            {m.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="text-[9px] text-[#666] mt-0.5 truncate">{m.username}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* About box */}
            <div className="bg-white border border-[#999]">
              <div className="bg-[#555] px-2 py-1">
                <h2 className="text-[11px] font-bold text-white uppercase">Om Echo2000</h2>
              </div>
              <div className="p-2 text-[11px] text-[#555]">
                <p>
                  Echo2000 är ett community inspirerat av tidigt 2000-tal. 
                  Inga algoritmer, ingen reklam — bara folk som vill hänga.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-2 bg-white border border-[#999] px-3 py-1.5 text-center">
          <span className="text-[10px] text-[#999]">
            © 2024 Echo2000 — BETA v1.0 — 
            <button onClick={() => navigate("/auth")} className="text-[#ff6600] hover:underline cursor-pointer">
              Gå med nu!
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
