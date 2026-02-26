/** Right-side avatar panel showing contact + self (desktop only) */
import { Avatar } from "../Avatar";
import { StatusIndicator, type UserStatus } from "../StatusIndicator";
import type { MsnContact } from "./MsnContactList";

interface ChatAvatarPanelProps {
  contact: MsnContact;
  userDisplayName: string;
  userStatus: UserStatus;
}

export function ChatAvatarPanel({ contact, userDisplayName, userStatus }: ChatAvatarPanelProps) {
  return (
    <div className="hidden xl:flex flex-col w-44 border-l border-gray-300 dark:border-gray-700 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
      <AvatarSlot name={contact.name} status={contact.status} gradient="from-pink-200/50 to-purple-200/50 dark:from-pink-900/30 dark:to-purple-900/30" />
      <AvatarSlot name={userDisplayName || "Du"} status={userStatus} gradient="from-blue-200/50 to-green-200/50 dark:from-blue-900/30 dark:to-green-900/30" />
    </div>
  );
}

function AvatarSlot({ name, status, gradient }: { name: string; status: UserStatus; gradient: string }) {
  return (
    <div className="flex-1 p-2 flex flex-col items-center justify-center border-b border-gray-300 dark:border-gray-600 last:border-b-0">
      <div className="relative mb-2">
        <div className={`w-24 h-24 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600`}>
          <Avatar name={name} size="xl" />
        </div>
        <div className="absolute -bottom-1 -right-1">
          <StatusIndicator status={status} size="md" />
        </div>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full text-center font-medium">{name}</p>
      <p className="text-[10px] text-gray-400 capitalize">{status}</p>
    </div>
  );
}
