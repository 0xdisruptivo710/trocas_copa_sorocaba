"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ExploreMap = dynamic(() => import("./explore-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center rounded-2xl border bg-muted/30 text-sm text-muted-foreground">
      Carregando mapa...
    </div>
  ),
});

export function ExploreMapLoader(props: ComponentProps<typeof ExploreMap>) {
  return <ExploreMap {...props} />;
}
