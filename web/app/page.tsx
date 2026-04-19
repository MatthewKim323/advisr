import { redirect } from "next/navigation";

export default function Home() {
  // The public landing is served from /site (Vite). The app entry is the office.
  redirect("/office");
}
