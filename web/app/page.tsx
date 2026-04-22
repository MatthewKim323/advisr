import type { Metadata } from "next";
import CritiqueLanding from "@/components/landing/CritiqueLanding";

export const metadata: Metadata = {
  title: "nami — college navigation for first-gen students",
  description:
    "A crew of seven AI specialists that guide first-generation students through college applications — essays, aid, deadlines, and cost analysis.",
};

/**
 * Public marketing landing (Critique). The submarine is `/office` on the same app.
 */
export default function Home() {
  return <CritiqueLanding />;
}
