/**
 * @module ChatWindow
 * MSN Messenger-style chat — thin render shell.
 *
 * All state & logic lives in {@link useChatWindow}.
 * Visual sub-sections are delegated to dedicated components.
 */
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useChatWindow } from "@/hooks/useChatWindow";

import { MsnLogin } from "./MsnLogin";
import { MsnContactList } from "./MsnContactList";
import { ChatHeader } from "./ChatHeader";
import { ChatContactHeader } from "./ChatContactHeader";
import { ChatToolbar } from "./ChatToolbar";
import { ChatMessages } from "./ChatMessages";
import { ChatInputBar } from "./ChatInputBar";
import { ChatFooter } from "./ChatFooter";
import { ChatAvatarPanel } from "./ChatAvatarPanel";
import { ChatCallOverlays } from "./ChatCallOverlays";
import { ChatWelcomeScreen } from "./ChatWelcomeScreen";
import { BotCallWindow } from "../calls/BotCallWindow";

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const chat = useChatWindow();
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      await chat.fileUpload.uploadFile(file);
    } catch (err: any) {
      console.error("Drop upload failed:", err);
    }
  }, [chat.fileUpload]);

  if (!chat.isLoggedIn) return <MsnLogin onLogin={chat.handleLogin} />;

  return (
    <div
      className={cn("flex-1 flex flex-col h-full overflow-hidden relative", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="absolute inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-card border-2 border-dashed border-primary rounded-lg px-8 py-6 text-center shadow-lg">
            <p className="text-sm font-bold text-primary">📎 Släpp filen här</p>
          </div>
        </div>
      )}
      <ChatHeader
        userDisplayName={chat.userDisplayName}
        userStatus={chat.userStatus}
        soundEnabled={chat.soundEnabled}
        onToggleSound={() => chat.setSoundEnabled(!chat.soundEnabled)}
        onLogout={chat.handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Contact List */}
        {chat.showContactList && (!chat.isMobile || !chat.mobileShowChat) && (
          <div
            className={cn(
              "border-r border-gray-300 dark:border-gray-700 flex-shrink-0",
              chat.isMobile ? "w-full" : "w-60"
            )}
          >
            <MsnContactList
              onSelectContact={chat.handleSelectContact}
              selectedContactId={chat.selectedContact?.id}
              soundEnabled={chat.soundEnabled}
              userDisplayName={chat.userDisplayName}
              userStatus={chat.userStatus}
            />
          </div>
        )}

        {/* Chat Area */}
        {(!chat.isMobile || chat.mobileShowChat) && (
          <div className="flex-1 flex flex-col min-w-0">
            {chat.selectedContact ? (
              <>
                {chat.botCall.active && (
                  <BotCallWindow
                    botName={chat.botCall.botName}
                    botAvatar={chat.selectedContact.avatar}
                    duration={chat.botCall.duration}
                    isSpeaking={chat.botCall.isSpeaking}
                    onEndCall={chat.endBotCall}
                  />
                )}

                <ChatCallOverlays
                  webrtc={chat.webrtc}
                  contactName={chat.selectedContact.name}
                  showInviteDialog={chat.showInviteDialog}
                  onOpenInvite={() => chat.setShowInviteDialog(true)}
                  onCloseInvite={() => chat.setShowInviteDialog(false)}
                />

                <ChatContactHeader
                  contact={chat.selectedContact}
                  isMobile={chat.isMobile}
                  onBack={() => chat.setMobileShowChat(false)}
                  onNudge={chat.nudge}
                  onVoiceCall={chat.startVoiceCall}
                  onVideoCall={chat.startVideoCall}
                  onScreenShare={chat.startScreenShare}
                />

                <ChatToolbar
                  onInvite={() => {
                    if (chat.webrtc.callActive) chat.setShowInviteDialog(true);
                  }}
                  onVoiceCall={chat.startVoiceCall}
                  onVideoCall={chat.startVideoCall}
                  onScreenShare={chat.startScreenShare}
                  onNudge={chat.nudge}
                  showInviteDialog={chat.showInviteDialog}
                  callActive={chat.webrtc.callActive}
                  callType={chat.webrtc.callType}
                />

                <ChatMessages
                  messages={chat.currentMessages}
                  loading={chat.messagesLoading}
                  contactName={chat.selectedContact.name}
                  contactTyping={!!chat.contactTyping}
                />

                <ChatInputBar
                  inputMessage={chat.inputMessage}
                  onInputChange={chat.setInputMessage}
                  onSend={chat.handleSend}
                  onFocus={() => chat.setInputFocused(true)}
                  onBlur={() => chat.setInputFocused(false)}
                  onNudge={chat.nudge}
                  onFileClick={chat.fileUpload.openFilePicker}
                  fileInputRef={chat.fileUpload.fileInputRef}
                  onFileSelect={chat.fileUpload.handleFileSelect}
                  uploading={chat.fileUpload.uploading}
                  uploadProgress={chat.fileUpload.uploadProgress}
                  recording={chat.voice.recording}
                  voiceUploading={chat.voice.uploading}
                  voiceElapsed={chat.voice.formattedTime}
                  onToggleVoice={chat.voice.toggleRecording}
                />
              </>
            ) : (
              <ChatWelcomeScreen />
            )}
          </div>
        )}

        {/* Right Panel - Avatars (Desktop only) */}
        {chat.selectedContact && (
          <ChatAvatarPanel
            contact={chat.selectedContact}
            userDisplayName={chat.userDisplayName}
            userStatus={chat.userStatus}
          />
        )}
      </div>

      <ChatFooter
        soundEnabled={chat.soundEnabled}
        showClearButton={!!chat.user}
        onClearAll={chat.handleClearAllMessages}
      />
    </div>
  );
}
