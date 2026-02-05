import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface Klotter {
  id: string;
  user_id: string;
  image_url: string;
  comment: string | null;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
}

export function useKlotter() {
  const [klotter, setKlotter] = useState<Klotter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  const fetchKlotter = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('klotter')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKlotter(data || []);
    } catch (error) {
      console.error('Error fetching klotter:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchKlotter();
    } else {
      setKlotter([]);
      setLoading(false);
    }
  }, [user, fetchKlotter]);

  const uploadAndSaveKlotter = async (
    imageDataUrl: string,
    comment?: string
  ): Promise<boolean> => {
    if (!user || !profile) {
      toast.error('Du måste vara inloggad för att publicera');
      return false;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Generate unique filename
      const filename = `${user.id}/${Date.now()}.png`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('klotter')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('klotter')
        .getPublicUrl(filename);

      // Save to database
      const { error: insertError } = await supabase
        .from('klotter')
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          comment: comment?.trim() || null,
          author_name: profile.username,
          author_avatar: profile.avatar_url
        });

      if (insertError) throw insertError;

      toast.success('Klotter publicerat! 🎨');
      await fetchKlotter();
      return true;
    } catch (error) {
      console.error('Error publishing klotter:', error);
      toast.error('Kunde inte publicera klottret');
      return false;
    }
  };

  const deleteKlotter = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('klotter')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setKlotter(prev => prev.filter(k => k.id !== id));
      toast.success('Klotter borttaget');
      return true;
    } catch (error) {
      console.error('Error deleting klotter:', error);
      toast.error('Kunde inte ta bort klottret');
      return false;
    }
  };

  return {
    klotter,
    loading,
    uploadAndSaveKlotter,
    deleteKlotter,
    refetch: fetchKlotter
  };
}
