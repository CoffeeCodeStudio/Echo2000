import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  icon: string;
  author_name: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export function NewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, content, image_url, icon, author_name, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setArticles(data as NewsArticle[]);
    };
    fetch();
  }, []);

  if (articles.length === 0) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary flex items-center gap-1">
          <Newspaper className="w-4 h-4" /> Senaste Nytt
        </h3>
      </div>
      <div className="bg-card divide-y divide-border">
        {articles.map((article) => (
          <div key={article.id} className="p-3 flex gap-3 hover:bg-muted/30 transition-colors">
            {article.image_url ? (
              <img
                src={article.image_url}
                alt=""
                className="w-14 h-14 rounded object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-14 h-14 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
                {article.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{article.icon}</span>
                <span className="font-bold text-sm truncate">{article.title}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{article.content}</p>
              <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                {formatDate(article.created_at)} · {article.author_name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
