"use client";

import { useEffect, useState } from "react";
import {
  bikeAccountSession,
  BIKES_PRODUCTION_URL,
} from "@/domain/account/session";

export default function AccountCallbackPage() {
  const [message, setMessage] = useState("Completing secure sign-in…");

  useEffect(() => {
    let active = true;

    void bikeAccountSession.completeCallback(window.location).then(
      (identity) => {
        if (!active) return;

        if (identity.status === "signed-in") {
          window.location.replace(BIKES_PRODUCTION_URL);
          return;
        }

        setMessage(
          identity.status === "unconfigured"
            ? "Bike Atlas Account activation is not configured yet."
            : "Sign-in could not be completed. Your local Bike Atlas data is unchanged.",
        );
      },
    );

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="account-callback">
      <strong>Bike Atlas · THIEPN Account</strong>
      <p>{message}</p>
      <a href={BIKES_PRODUCTION_URL}>Return to Bike Atlas</a>
    </main>
  );
}
