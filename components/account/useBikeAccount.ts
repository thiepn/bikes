"use client";

import { useCallback, useEffect, useState } from "react";
import {
  bikeAccountSession,
  type BikeAccountIdentity,
} from "@/domain/account/session";

export function useBikeAccount() {
  const [identity, setIdentity] = useState<BikeAccountIdentity>(
    bikeAccountSession.identity(),
  );

  useEffect(
    () => bikeAccountSession.subscribe(setIdentity),
    [],
  );

  useEffect(() => {
    if (identity.status === "checking") {
      void bikeAccountSession.verify();
    }
  }, [identity.status]);

  const signIn = useCallback(
    () => bikeAccountSession.signIn(),
    [],
  );
  const signOut = useCallback(
    () => bikeAccountSession.signOutLocal(),
    [],
  );

  return {
    identity,
    configured: bikeAccountSession.configured,
    signIn,
    signOut,
    verify: () => bikeAccountSession.verify(),
    getAccessToken: () => bikeAccountSession.getAccessToken(),
  };
}
