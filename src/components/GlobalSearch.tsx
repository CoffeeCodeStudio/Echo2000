import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SearchResult {
  user_id: string;
  username: string;
  avatar_url: string | null;
  city: string | null;
  age: number | null;
}

export function GlobalSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time search with debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.
        from('profiles').
        select('user_id, username, avatar_url, city, age').
        ilike('username', `%${query}%`).
        limit(8);

        if (error) {
          console.error('Search error:', error);
          setResults([]);
        } else {
          setResults(data || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(`/profile/${encodeURIComponent(result.username)}`);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      






























      

      {/* Results Dropdown */}
      {isOpen &&
      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[250px]">
          {results.length === 0 ?
        <div className="p-4 text-center text-sm text-muted-foreground">
              {user ?
          <>Inga användare hittades för "{query}"</> :

          <>Logga in för att söka användare</>
          }
            </div> :

        <ul className="max-h-80 overflow-y-auto">
              {results.map((result) =>
          <li key={result.user_id}>
                  <button
              onClick={() => handleSelect(result)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left">
              
                    <Avatar
                name={result.username}
                src={result.avatar_url || undefined}
                size="sm" />
              
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {result.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[result.age && `${result.age} år`, result.city].
                  filter(Boolean).
                  join(', ') || 'Användare'}
                      </p>
                    </div>
                  </button>
                </li>
          )}
            </ul>
        }
        </div>
      }
    </div>);

}