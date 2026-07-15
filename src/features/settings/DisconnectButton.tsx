"use client";

import { disconnectSocialAccountAction } from "./social-accounts-actions";

export function DisconnectButton({ accountId }: { accountId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm("Disconnect this account?")) {
          disconnectSocialAccountAction(accountId);
        }
      }}
      className="text-xs font-medium text-red-500 hover:text-red-700"
    >
      Disconnect
    </button>
  );
}
