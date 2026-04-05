/**
 * @module useChatFileUpload
 * Handles file uploads to Supabase Storage for the chat.
 */
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

export function useChatFileUpload(onSendMessage: (content: string) => Promise<any>) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return;
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("Filen är för stor (max 10 MB)");
    }

    setUploading(true);
    setUploadProgress(10);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${timestamp}_${safeName}`;

    setUploadProgress(30);

    const { error } = await supabase.storage
      .from("chat-files")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      setUploading(false);
      setUploadProgress(0);
      throw error;
    }

    setUploadProgress(80);

    const { data: urlData } = await supabase.storage
      .from("chat-files")
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

    const fileUrl = urlData?.signedUrl;
    if (!fileUrl) {
      setUploading(false);
      setUploadProgress(0);
      throw new Error("Could not generate file URL");
    }
    const isImage = IMAGE_TYPES.includes(file.type);
    const fileType = isImage ? "image" : "file";
    const bbcode = `[file type="${fileType}" url="${fileUrl}"]${file.name}[/file]`;

    setUploadProgress(90);
    await onSendMessage(bbcode);
    setUploadProgress(100);

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 500);
  }, [user, onSendMessage]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be selected again
    e.target.value = "";
    try {
      await uploadFile(file);
    } catch (err: any) {
      console.error("File upload failed:", err);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [uploadFile]);

  return {
    uploading,
    uploadProgress,
    fileInputRef,
    openFilePicker,
    handleFileSelect,
    uploadFile,
  };
}
