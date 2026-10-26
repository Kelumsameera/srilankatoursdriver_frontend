"use client";

import { useEffect } from "react";

export const TRIPADVISOR_LOCATION_ID = "23985020";
export const TRIPADVISOR_PROFILE_URL =
  "https://www.tripadvisor.com/Attraction_Review-g293962-d23985020-Reviews-Sri_Lanka_Tours_Driver-Colombo_Western_Province.html";

type TaWindow = Window & { taValidate?: () => void; taValList?: unknown[] };

/**
 * TripAdvisor's official "Write a review" widget (embed code from the TripAdvisor Review Express widgets page).
 * Their script only draws on window.onload, which has usually fired already in a Next.js page,
 * so once it has registered itself we run its callback by hand. Without JS the logo link stays.
 */
export function TripAdvisorWriteReview() {
  useEffect(() => {
    const w = window as TaWindow;
    const before = w.taValList?.length ?? 0;
    const script = document.createElement("script");
    script.src = `https://www.jscache.com/wejs?wtype=cdswritereviewlgvi&uniq=315&locationId=${TRIPADVISOR_LOCATION_ID}&lang=en_US&display_version=2`;
    script.async = true;
    document.body.appendChild(script);
    let tries = 0;
    const timer = setInterval(() => {
      if ((w.taValList?.length ?? 0) > before && w.taValidate) {
        clearInterval(timer);
        try {
          w.taValidate();
        } catch {
          // their script failed – the plain logo link below still works
        }
      } else if (++tries > 50) clearInterval(timer);
    }, 200);
    return () => {
      clearInterval(timer);
      script.remove();
    };
  }, []);

  return (
    <div id="TA_cdswritereviewlgvi315" className="TA_cdswritereviewlgvi">
      <ul id="uaOjpoSbm" className="TA_links Mo4oDoM2">
        <li id="lrxD9D" className="LON5Ury">
          <a target="_blank" rel="noopener noreferrer" href="https://www.tripadvisor.com/">
            {/* eslint-disable-next-line @next/next/no-img-element -- TripAdvisor's own logo file, required as-is by their widget */}
            <img src="https://static.tacdn.com/img2/brand_refresh/Tripadvisor_lockup_horizontal_secondary_registered.svg" alt="TripAdvisor" className="h-8 w-auto" />
          </a>
        </li>
      </ul>
    </div>
  );
}
