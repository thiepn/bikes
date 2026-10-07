"use client";

import { useBikeAccount } from "@/components/account/useBikeAccount";
import { BIKES_ACCOUNT_URL } from "@/domain/account/session";

export function AccountStatus() {
  const account = useBikeAccount();

  if (!account.configured) return null;

  if (account.identity.status === "signed-in") {
    return (
      <div className="account-status">
        <a
          href={BIKES_ACCOUNT_URL}
          target="_blank"
          rel="noreferrer"
          title={account.identity.email ?? "THIEPN Account"}
        >
          Account
        </a>
        <span aria-label="Signed in" />
      </div>
    );
  }

  if (account.identity.status === "checking") {
    return (
      <button
        type="button"
        className="account-status account-status--button"
        disabled
      >
        Account…
      </button>
    );
  }

  return (
    <button
      type="button"
      className="account-status account-status--button"
      onClick={() => void account.signIn()}
    >
      Sign in
    </button>
  );
}
