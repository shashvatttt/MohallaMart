
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ChatClient from "./ChatClient";
import ChatParamsHandler from "./ChatParamsHandler";

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatParamsHandler />
      <ChatClient />
    </Suspense>
  );
}
