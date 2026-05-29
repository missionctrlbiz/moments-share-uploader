"use client";

import dynamic from "next/dynamic";
import ShareForm from "@/components/ShareForm";
import { getWelcomeMessage } from "@/lib/utils";
import { useState } from "react";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), {
  ssr: false,
});

export default function Home() {
  const [welcomeMessage] = useState(() => getWelcomeMessage());

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-start scrollable">
      <ThreeBackground />
      <div className="flex-1 flex flex-col items-center justify-center w-full py-8 px-4">
        {welcomeMessage && <ShareForm welcomeMessage={welcomeMessage} />}
      </div>
      <footer
        className="pb-6 text-center text-xs text-muted shrink-0"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Made with love by{" "}
        <span className="animated-gradient-text font-semibold">Bibi</span>
      </footer>
    </main>
  );
}
