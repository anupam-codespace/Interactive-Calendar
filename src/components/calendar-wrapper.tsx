"use client";

import dynamic from "next/dynamic";

const WallCalendar = dynamic(
  () => import("@/components/wall-calendar").then((mod) => mod.WallCalendar),
  { ssr: false },
);

export function CalendarWrapper() {
  return <WallCalendar />;
}
