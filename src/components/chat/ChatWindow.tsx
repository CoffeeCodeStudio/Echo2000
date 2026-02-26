/**
 * ChatWindow – MSN Messenger-style chat with contacts, messages, calls.
 * Sub-components: ChatHeader, ChatContactHeader, ChatToolbar, ChatMessages, ChatInputBar, ChatFooter, ChatAvatarPanel
 */
import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMsnSounds } from "@/hooks/useMsnSounds";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { LayoutContext } from "../SharedLayout";
import type { UserStatus } from "../StatusIndicator";
import type { MsnContact } from "./MsnContactList";

import { MsnLogin } from "./MsnLogin";
import { MsnContactList } from "./MsnContactList";
import { MsnLogo } from "./MsnLogo";
import { ChatHeader } from "./ChatHeader";
import { ChatContactHeader } from "./ChatContactHeader";
import { ChatToolbar } from "./ChatToolbar";
import { ChatMessages } from "./ChatMessages";
import { ChatInputBar } from "./ChatInputBar";
import { ChatFooter } from "./ChatFooter";
import { ChatAvatarPanel } from "./ChatAvatarPanel";
import { CallWindow } from "../calls/CallWindow";
import { IncomingCallDialog } from "../calls/IncomingCallDialog";
import { InviteToCallDialog } from "../calls/InviteToCallDialog";

interface ChatWindowProps {
  className?: string;
}

export function ChatWindow({ className }: ChatWindowProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userStatus, setUserStatus] = useState<UserStatus>("online");
  const [selectedContact, setSelectedContact] = useState<MsnContact | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showContactList, setShowContactList] = useState(true);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const { playSound } = useMsnSounds();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();

  const { messages: dbMessages, loading: messagesLoading, sendMessage: sendDbMessage } = useChatMessages(selectedContact?.id || null);

  const webrtc = useWebRTC({ userId: user?.id || "", contactId: selectedContact?.id || "" });

  const context = useOutletContext<LayoutContext>();
  const setHideNavbar = context?.setHideNavbar;

  // Hide navbar when input is focused on mobile
  useEffect(() => {
    if (isMobile && setHideNavbar) setHideNavbar(inputFocused);
    return () => { if (setHideNavbar) setHideNavbar(false); };
  }, [inputFocused, isMobile, setHideNavbar]);

  // Map DB messages to display format
  const currentMessages = dbMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    timestamp: new Date(msg.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }),
    isSelf: msg.sender_id === user?.id,
    senderName: msg.sender_id === user?.id ? (userDisplayName || "Du") : (selectedContact?.name || ""),
    date: new Date(msg.created_at),
  }));

  // Listen for incoming nudges via realtime broadcast
  useEffect(() => {
    if (!user) return;
    const nudgeChannel = supabase.channel(`nudge-${user.id}`);
    nudgeChannel
      .on("broadcast", { event: "nudge" }, ({ payload }) => {
        if (payload.from === user.id) return;
        const chatWindow = document.getElementById("msn-chat-window");
        if (chatWindow) {
          chatWindow.classList.add("animate-shake");
          setTimeout(() => chatWindow.classList.remove("animate-shake"), 500);
        }
        if (soundEnabled) playSound("nudge");
      })
      .subscribe();
    return () => { supabase.removeChannel(nudgeChannel); };
  }, [user, soundEnabled, playSound]);

  const handleLogin = (displayName: string, status: string) => {
    setUserDisplayName(displayName);
    setUserStatus(status as UserStatus);
    setIsLoggedIn(true);
  };

  const handleSelectContact = (contact: MsnContact) => {
    setSelectedContact(contact);
    if (isMobile) setMobileShowChat(true);
  };

  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || !selectedContact) return;
    const msg = inputMessage;
    setInputMessage("");
    if (soundEnabled) playSound("send");
    await sendDbMessage(msg);
  }, [inputMessage, selectedContact, soundEnabled, playSound, sendDbMessage]);

  const nudge = useCallback(async () => {
    if (!selectedContact || !user) return;
    if (soundEnabled) playSound("nudge");
    const chatWindow = document.getElementById("msn-chat-window");
    if (chatWindow) {
      chatWindow.classList.add("animate-shake");
      setTimeout(() => chatWindow.classList.remove("animate-shake"), 500);
    }
    await sendDbMessage("🔔 skickade en nudge!");
    const nudgeChannel = supabase.channel(`nudge-${selectedContact.id}`);
    nudgeChannel.subscribe(() => {
      nudgeChannel.send({ type: "broadcast", event: "nudge", payload: { from: user.id, fromName: userDisplayName } });
      setTimeout(() => supabase.removeChannel(nudgeChannel), 1000);
    });
  }, [selectedContact, user, soundEnabled, playSound, sendDbMessage, userDisplayName]);

  const handleClearAllMessages = async () => {
    if (!user) return;
    try {
      const { error: e1 } = await supabase.from("chat_messages").delete().eq("sender_id", user.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("chat_messages").delete().eq("recipient_id", user.id);
      if (e2) throw e2;
      toast({ title: "Meddelanden raderade", description: "Alla dina chattmeddelanden har raderats." });
      setSelectedContact(null);
      setShowContactList(true);
      setMobileShowChat(false);
    } catch (error) {
      console.error("Error clearing messages:", error);
      toast({ title: "Kunde inte radera", description: "Något gick fel, försök igen", variant: "destructive" });
    }
  };

  const startVoiceCall = () => { if (user && selectedContact && !webrtc.callActive) { webrtc.startCall("voice"); webrtc.ringContact(selectedContact.id, "voice"); } };
  const startVideoCall = () => { if (user && selectedContact && !webrtc.callActive) { webrtc.startCall("video", "camera"); webrtc.ringContact(selectedContact.id, "video"); } };
  const startScreenShare = () => { if (user && selectedContact && !webrtc.callActive) { webrtc.startCall("screenshare", "screen"); webrtc.ringContact(selectedContact.id, "screenshare"); } };

  if (!isLoggedIn) return <MsnLogin onLogin={handleLogin} />;

  return (
    <div className={cn("flex-1 flex flex-col h-full overflow-hidden", className)}>
      <ChatHeader userDisplayName={userDisplayName} userStatus={userStatus} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled(!soundEnabled)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Contact List */}
        {showContactList && (!isMobile || !mobileShowChat) && (
          <div className={cn("border-r border-gray-300 dark:border-gray-700 flex-shrink-0", isMobile ? "w-full" : "w-60")}>
            <MsnContactList onSelectContact={handleSelectContact} selectedContactId={selectedContact?.id} soundEnabled={soundEnabled} />
          </div>
        )}

        {/* Chat Area */}
        {(!isMobile || mobileShowChat) && (
          <div className="flex-1 flex flex-col min-w-0">
            {selectedContact ? (
              <>
                {/* Call overlays */}
                {webrtc.callActive && (
                  <CallWindow callType={webrtc.callType} localStream={webrtc.localStream} remoteStreams={webrtc.remoteStreams}
                    isMuted={webrtc.isMuted} isVideoOff={webrtc.isVideoOff} contactName={selectedContact.name}
                    participants={webrtc.participants} onToggleMute={webrtc.toggleMute} onToggleVideo={webrtc.toggleVideo}
                    onEndCall={webrtc.endCall} onInvite={() => setShowInviteDialog(true)} />
                )}
                {webrtc.incomingCall && !webrtc.callActive && (
                  <IncomingCallDialog callerName={selectedContact.name} callType={webrtc.incomingCall.callType}
                    onAccept={() => webrtc.answerCall(webrtc.incomingCall!.channelName, webrtc.incomingCall!.callType)}
                    onDecline={webrtc.declineCall} />
                )}
                {showInviteDialog && webrtc.callActive && (
                  <InviteToCallDialog currentParticipants={webrtc.participants} maxParticipants={4}
                    onInvite={(userId) => webrtc.inviteUser(userId)} onClose={() => setShowInviteDialog(false)} />
                )}

                <ChatContactHeader contact={selectedContact} isMobile={isMobile}
                  onBack={() => setMobileShowChat(false)} onNudge={nudge}
                  onVoiceCall={startVoiceCall} onVideoCall={startVideoCall} onScreenShare={startScreenShare} />

                <ChatToolbar
                  onInvite={() => { if (webrtc.callActive) setShowInviteDialog(true); }}
                  onVoiceCall={startVoiceCall} onVideoCall={startVideoCall} onScreenShare={startScreenShare}
                  onNudge={nudge} showInviteDialog={showInviteDialog}
                  callActive={webrtc.callActive} callType={webrtc.callType} />

                <ChatMessages messages={currentMessages} loading={messagesLoading} contactName={selectedContact.name} />
                <ChatInputBar inputMessage={inputMessage} onInputChange={setInputMessage}
                  onSend={handleSend} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8">
                <MsnLogo size="lg" animated className="mb-4" />
                <h2 className="font-bold text-lg text-gray-700 dark:text-gray-300 mb-2">Välkommen till Echo Messenger!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
                  Välj en kontakt från listan till vänster för att starta en konversation.
                </p>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span>💬 Chatta</span><span>•</span><span>🎮 Spela</span><span>•</span><span>📞 Ring</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Panel - Avatars (Desktop only) */}
        {selectedContact && (
          <ChatAvatarPanel contact={selectedContact} userDisplayName={userDisplayName} userStatus={userStatus} />
        )}
      </div>

      <ChatFooter soundEnabled={soundEnabled} showClearButton={!!user} onClearAll={handleClearAllMessages} />
    </div>
  );
}
