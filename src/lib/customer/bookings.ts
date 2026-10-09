"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";

export type BookingStatus = "new" | "contacted" | "quoted" | "pending" | "confirmed" | "cancelled" | "completed";

export interface CustomerBooking {
  id: string;
  reference: string;
  type: "tour" | "excursion" | "vehicle" | "general";
  itemTitle: string;
  startDate?: string;
  endDate?: string;
  adults: number;
  children: number;
  pickupLocation: string;
  status: BookingStatus;
  quotedAmount?: number;
  currency: string;
  statusHistory: { status: BookingStatus; changedAt: string }[];
  createdAt: string;
}

const get = (path: string, method: "GET" | "POST" = "GET") =>
  fetch(`${API_URL}/customer${path}`, {
    method,
    credentials: "include",
    headers: { accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}) },
    body: method === "POST" ? "{}" : undefined,
  });

/** The signed-in customer's booking requests, newest first. Rotates an expired session once. */
export function useCustomerBookings(enabled: boolean) {
  const [bookings, setBookings] = useState<CustomerBooking[] | null>(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        let res = await get("/bookings");
        if (res.status === 401 && (await get("/auth/refresh", "POST")).ok) res = await get("/bookings");
        const json = (await res.json().catch(() => null)) as { data?: CustomerBooking[] } | null;
        if (cancelled) return;
        if (res.ok && Array.isArray(json?.data)) {
          setBookings(json.data);
          setError(false);
        } else setError(true);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, version]);

  const retry = useCallback(() => {
    setError(false);
    setVersion((v) => v + 1);
  }, []);

  return { bookings, loading: enabled && bookings === null && !error, error, retry };
}
