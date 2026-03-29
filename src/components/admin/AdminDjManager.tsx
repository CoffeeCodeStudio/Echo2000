import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Music, GripVertical } from "lucide-react";

interface DjTrack {
  id: string;
  title: string;
  artist: string;
  file_url: string;
  genre: string | null;
  is_active: boolean;
  sort_order: number;
  play_count: number;
  created_at: string;
}

export default function AdminDjManager() {
  const [tracks, setTracks] = useState<DjTrack[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("Suno AI");
  const [genre, setGenre] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    const { data } = await supabase
      .from("dj_tracks")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setTracks(data);
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Ange titel och välj en fil");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("dj-tracks")
        .upload(path, file, { contentType: file.type });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from("dj-tracks")
        .getPublicUrl(path);

      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from("dj_tracks").insert({
        title: title.trim(),
        artist: artist.trim() || "Suno AI",
        file_url: publicUrl,
        genre: genre.trim() || null,
        sort_order: tracks.length,
        added_by: user?.id || null,
      });

      if (dbError) throw dbError;

      toast.success(`"${title}" uppladdad!`);
      setTitle("");
      setArtist("Suno AI");
      setGenre("");
      setFile(null);
      fetchTracks();
    } catch (err: any) {
      toast.error("Uppladdning misslyckades: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (track: DjTrack) => {
    await supabase.from("dj_tracks").update({ is_active: !track.is_active }).eq("id", track.id);
    fetchTracks();
  };

  const deleteTrack = async (track: DjTrack) => {
    if (!confirm(`Ta bort "${track.title}"?`)) return;
    // Remove file from storage
    const urlParts = track.file_url.split("/dj-tracks/");
    if (urlParts[1]) {
      await supabase.storage.from("dj-tracks").remove([urlParts[1]]);
    }
    await supabase.from("dj_tracks").delete().eq("id", track.id);
    toast.success("Borttagen");
    fetchTracks();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold font-mono flex items-center gap-2">
        <Music className="w-5 h-5 text-primary" />
        DJ Echo – Hantera spellista
      </h3>

      {/* Upload form */}
      <div className="p-4 rounded-lg border border-border bg-card space-y-3">
        <h4 className="text-sm font-bold">Ladda upp ny låt</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Låttitel *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Artist (standard: Suno AI)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
          <Input
            placeholder="Genre (valfritt)"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <Input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <Button onClick={handleUpload} disabled={uploading || !file || !title.trim()} className="gap-2">
          <Upload className="w-4 h-4" />
          {uploading ? "Laddar upp..." : "Ladda upp"}
        </Button>
      </div>

      {/* Track list */}
      <div className="space-y-2">
        {tracks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Inga låtar ännu. Ladda upp din första Suno-låt!
          </p>
        )}
        {tracks.map((track, i) => (
          <div
            key={track.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/40" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground">{track.artist} {track.genre && `· ${track.genre}`}</p>
            </div>
            <span className="text-xs text-muted-foreground">{track.play_count} plays</span>
            <Button
              variant={track.is_active ? "default" : "outline"}
              size="sm"
              onClick={() => toggleActive(track)}
            >
              {track.is_active ? "Aktiv" : "Inaktiv"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteTrack(track)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
