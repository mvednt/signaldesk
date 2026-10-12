"use client";

import { useEffect, useState } from "react";

const IST = 5.5 * 3600e3;

/** Next Mon/Thu 08:00 Asia/Kolkata after `now`. */
function nextRun(now: number): number {
  for (let d = 0; d < 9; d++) {
    const x = new Date(now + IST);
    x.setUTCDate(x.getUTCDate() + d);
    x.setUTCHours(8, 0, 0, 0);
    const t = x.getTime() - IST;
    const dow = x.getUTCDay();
    if ((dow === 1 || dow === 4) && t > now) return t;
  }
  return now;
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now == null) {
    return (
      <>
        <div className="flex items-baseline gap-2.5">
          <span className="text-[44px] font-semibold leading-none tabular-nums tracking-[-0.03em]">--:--:--</span>
        </div>
        <div className="text-[13.5px] text-[#b9bbc0]">Emailed Mon &amp; Thu · 08:00 IST</div>
      </>
    );
  }

  const t = nextRun(now);
  const diff = Math.max(0, t - now);
  const dd = Math.floor(diff / 864e5);
  const hh = Math.floor(diff / 36e5) % 24;
  const mm = Math.floor(diff / 6e4) % 60;
  const ss = Math.floor(diff / 1e3) % 60;
  const label = new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });

  return (
    <>
      <div className="flex items-baseline gap-2.5">
        <span className="text-[22px] font-medium tabular-nums text-[#f2a385]">{dd}d</span>
        <span className="text-[44px] font-semibold leading-none tabular-nums tracking-[-0.03em]">
          {pad(hh)}:{pad(mm)}:{pad(ss)}
        </span>
      </div>
      <div className="text-[13.5px] text-[#b9bbc0]">{label} · 08:00 IST · emailed Mon &amp; Thu</div>
    </>
  );
}
