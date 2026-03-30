import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsComments } from "@/components/social/NewsComments";

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
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function isRecent(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() < 48 * 60 * 60 * 1000;
}

/** Single article view */
function NewsArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchArticle = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, content, image_url, icon, author_name, created_at")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      setArticle(data as NewsArticle | null);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground mb-4 text-[11px]">Artikeln hittades inte.</p>
        <Link to="/news">
          <Button variant="outline" size="sm" className="text-[11px]">
            <ArrowLeft className="w-3 h-3 mr-1" /> Tillbaka till nyheter
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-4">
      <Link to="/news" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors mb-3">
        <ArrowLeft className="w-3 h-3" /> Alla nyheter
      </Link>

      <article className="border border-[#999] bg-card">
        {/* Article header bar */}
        <div className="lunar-box-header flex items-center gap-2 px-3 py-1.5">
          <Newspaper className="w-3.5 h-3.5 text-white/90" />
          <span>Nyhet</span>
        </div>

        {article.image_url && (
          <img src={article.image_url} alt="" className="w-full h-40 sm:h-56 object-cover border-b border-[#999]" />
        )}

        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xl flex-shrink-0">{article.icon}</span>
            <h1 className="font-bold text-base sm:text-lg text-foreground leading-tight">{article.title}</h1>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3 pb-2 border-b border-[#ccc]">
            <span className="flex items-center gap-1 uppercase tracking-wide">
              <Calendar className="w-3 h-3" /> {formatDate(article.created_at)}
            </span>
            <span className="flex items-center gap-1 uppercase tracking-wide">
              <User className="w-3 h-3" /> {article.author_name}
            </span>
          </div>

          <div className="text-[12px] text-foreground/90 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "Verdana, Tahoma, Geneva, sans-serif" }}>
            {article.content}
          </div>

          <NewsComments articleId={article.id} />
        </div>
      </article>
    </div>
  );
}

/** Archive listing */
function NewsArchive() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("id, title, content, image_url, icon, author_name, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (data) setArticles(data as NewsArticle[]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-3 py-4">
      <div className="border border-[#999] bg-card">
        <div className="lunar-box-header flex items-center gap-2 px-3 py-1.5">
          <Newspaper className="w-3.5 h-3.5 text-white/90" />
          <span>Alla Nyheter</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : articles.length === 0 ? (
          <p className="text-muted-foreground text-[11px] p-4 text-center">Inga nyheter publicerade ännu.</p>
        ) : (
          <div className="divide-y divide-[#ccc]">
            {articles.map((article, i) => (
              <Link
                to={`/news/${article.id}`}
                key={article.id}
                className="px-3 py-2.5 flex gap-2.5 hover:bg-[#eee] transition-colors cursor-pointer group"
                style={{ background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)" }}
              >
                {article.image_url ? (
                  <img src={article.image_url} alt="" className="w-14 h-14 object-cover flex-shrink-0 border border-[#999]" />
                ) : (
                  <div className="w-14 h-14 bg-[#eee] border border-[#999] flex items-center justify-center flex-shrink-0 text-xl">
                    {article.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[12px] text-foreground truncate group-hover:text-primary transition-colors">
                      {article.title}
                    </span>
                    {isRecent(article.created_at) && (
                      <span className="news-new-badge">NY!</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{article.content}</p>
                  <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                    {formatDateShort(article.created_at)} · {article.author_name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Router entry: /news shows archive, /news/:id shows article */
export default function News() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-background">
      {id ? <NewsArticlePage /> : <NewsArchive />}
    </div>
  );
}
