/**
 * useGeolocation — requests browser geolocation and updates store.
 * Returns { request, loading, error, supported }
 */
import { useState, useCallback } from "react";
import { useMetroStore } from "@/store/metro.store";

export function useGeolocation() {
  const { setUserLocation } = useMetroStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const request = useCallback(() => {
    if (!supported) {
      setError("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("دسترسی به موقعیت رد شد");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("موقعیت در دسترس نیست");
            break;
          case err.TIMEOUT:
            setError("زمان درخواست موقعیت تمام شد");
            break;
          default:
            setError("خطا در دریافت موقعیت");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [supported, setUserLocation]);

  return { request, loading, error, supported };
}
