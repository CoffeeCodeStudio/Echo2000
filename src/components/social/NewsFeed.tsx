import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ChevronRight } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  icon: string;
  author_name: string;
  created_at: string;
}

function isRecent(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 48 * 60 * 60 * 1000;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, content, image_url, icon, author_name, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setArticles(data as NewsArticle[]);
    };
    fetchArticles();
  }, []);

  return (
    <div className="border border-[#999] bg-card">
      <div className="lunar-box-header flex items-center gap-2 px-3 py-1.5">
        <Newspaper className="w-3.5 h-3.5 text-white/90" />
        <span>Senaste Nytt</span>
      </div>

      <div className="divide-y divide-[#ccc]">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Newspaper className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-[11px]">Inga nyheter ännu</span>
          </div>
        ) : (
          articles.map((article, i) => (
            <Link
              to={`/news/${article.id}`}
              key={article.id}
              className="px-3 py-2.5 flex gap-2.5 hover:bg-[#eee] transition-colors cursor-pointer group"
              style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)" }}
            >
              {article.image_url ? (
                <img
                  src={article.image_url}
                  alt=""
                  loading="lazy"
                  className="w-11 h-11 object-cover flex-shrink-0 border border-[#999]"
                />
              ) : (
                <div className="w-11 h-11 bg-[#eee] border border-[#999] flex items-center justify-center flex-shrink-0 text-lg">
                  {article.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[12px] text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                    {article.title}
                  </span>
                  {isRecent(article.created_at) && (
                    <span className="news-new-badge">NY!</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{article.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDate(article.created_at)} · {article.author_name}
                  </span>
                  <span className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    Läs <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link
        to="/news"
        className="flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-primary hover:bg-[#eee] transition-colors border-t border-[#ccc] uppercase tracking-wide"
      >
        Alla nyheter <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
