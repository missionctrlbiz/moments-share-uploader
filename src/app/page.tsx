"use client";

import dynamic from "next/dynamic";
import ShareForm from "@/components/ShareForm";
import { getWelcomeMessage } from "@/lib/utils";
import { useState, useEffect } from "react";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), {
  ssr: false,
});

export default function Home() {
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    setWelcomeMessage(getWelcomeMessage());
  }, []);

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-4 py-8">
      <ThreeBackground />
      {welcomeMessage && <ShareForm welcomeMessage={welcomeMessage} />}
      <footer
        className="mt-auto pt-8 pb-4 text-center text-xs text-muted"
        style={{ fontFamily: "var(--font-inter)" }}
      >
        Made with love by{" "}
        <span className="gradient-text font-semibold">Bibi</span>
      </footer>
    </main>
  );
}
