"use client";

import { useCallback } from "react";
import { getFirebaseInstances } from "./firebase/client";

export function useAuthFetch() {
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const { auth } = getFirebaseInstances();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User is not authenticated. Please log in to continue.");
    }

    const token = await user.getIdToken(true);

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Failed to parse error response from server.",
      }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }, []);

  return authFetch;
}
