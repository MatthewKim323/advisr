/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowUpRight, Check, Compass, Cpu, Layers, Anchor, Shield, Users, Database, Target, PenTool, Search, CircleDollarSign, Clock } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import BlurText from "./components/BlurText";
import { LoadingScreen } from "./components/LoadingScreen";

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  return (
    <>
      {!hasLoaded && <LoadingScreen onComplete={() => setHasLoaded(true)} />}
      
      {hasLoaded && (
        <main className="relative w-full min-h-screen font-sans selection:bg-white/20 selection:text-white overflow-x-hidden bg-[#080E1A]">
          {/* Navigation Bar */}
      <div className="fixed top-0 left-0 w-full z-[100] flex justify-center pt-4 px-4 pointer-events-none">
        <motion.nav 
          initial={false}
          animate={{
            width: isScrolled ? "1000px" : "100%",
            maxWidth: isScrolled ? "90%" : "1800px",
            borderRadius: isScrolled ? "100px" : "0px",
            backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.08)" : "transparent",
            backdropFilter: isScrolled ? "blur(20px)" : "blur(0px)",
            paddingLeft: isScrolled ? "2.5rem" : "1.5rem",
            paddingRight: isScrolled ? "2.5rem" : "1.5rem",
            paddingTop: isScrolled ? "0.8rem" : "1.5rem",
            paddingBottom: isScrolled ? "0.8rem" : "1.5rem",
            gap: isScrolled ? "4rem" : "2rem",
            y: isScrolled ? 15 : 0,
            border: isScrolled ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(255, 255, 255, 0)",
            boxShadow: isScrolled ? "0 20px 40px rgba(0,0,0,0.3)" : "none"
          }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 30,
            mass: 1
          }}
          className="relative flex flex-row items-center justify-between mx-auto pointer-events-auto"
        >
          <div className="flex items-center gap-12 shrink-0">
            <h1 className="text-xl md:text-2xl tracking-tighter text-white uppercase font-mondwest flex items-center">
              Nami<sup className="text-[10px] mt-0.5 ml-0.5">®</sup>
            </h1>
            
            <div className="hidden md:flex items-center gap-10 text-[11px] uppercase tracking-widest font-mono font-bold">
              <a href="#" className="text-white hover:opacity-100 transition-opacity">Mission</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">The Gap</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">The Crew</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Log</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Architecture</a>
            </div>
          </div>

          <div className="flex items-center gap-8 shrink-0">
            <button className="liquid-glass text-white/90 active:scale-95 rounded-full px-8 py-2.5 text-[10px] uppercase tracking-widest font-bold font-mono transition-all duration-300">
              Begin Dive
            </button>
          </div>
        </motion.nav>
      </div>

      {/* SECTION 1: HERO */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-right"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_3CZPMI9yqo0e85uJdS7tB0FcKsC/hf_20260419_164352_85e5afad-cee1-486c-99ec-0140a80bc9fe.mp4"
              type="video/mp4"
            />
          </video>
          {/* Subtle Black Overlay & Vignette */}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,14,26,0.4)_100%)]" />
          
          {/* Bottom fade to background color - Balanced 'in-between' fade */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#080E1A] to-transparent z-10" />
          
          {/* Top fade for navigation clarity */}
          <div className="absolute top-0 left-0 w-full h-1/4 bg-gradient-to-b from-[#080E1A]/40 to-transparent z-10" />
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full w-full max-w-[1800px] mx-auto px-6 md:px-12 pb-32">
          <div className="max-w-3xl pt-12 items-start text-left">
            {/* Headline */}
            <div className="space-y-0 mb-6">
            <h2 className="text-[56px] md:text-[80px] leading-[0.85] tracking-[-0.05em] text-white flex flex-col font-mondwest not-italic">
                <BlurText
                  text="Lost in the deep?"
                  delay={100}
                  animateBy="words"
                  direction="bottom"
                />
                <span className="opacity-95">
                  <BlurText
                    text="We built your crew."
                    delay={500}
                    animateBy="words"
                    direction="bottom"
                  />
                </span>
              </h2>
            </div>

            {/* Subheading */}
            <motion.p
              initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-white/80 font-light text-sm md:text-base max-w-[480px] mb-8 leading-relaxed"
            >
              The college process wasn't built for you. Nami gives you seven specialists who know who you are, know the landscape, and put you in the driver's seat of getting to shore.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ filter: "blur(10px)", opacity: 0 }}
              animate={{ filter: "blur(0px)", opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button className="liquid-glass rounded-full px-7 py-3 text-[11px] uppercase tracking-widest font-bold font-mono text-white flex items-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all duration-300">
                Sail Your Submarine
                <span className="text-lg">↗</span>
              </button>
              <button className="liquid-glass rounded-full px-7 py-3 text-[11px] uppercase tracking-widest font-bold font-mono text-white/60 hover:text-white hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center gap-3">
                Meet the Crew
              </button>
            </motion.div>
          </div>
        </div>

        {/* Partners Bar */}
        <footer className="absolute bottom-0 left-0 w-full z-10 pb-12">
          <div className="max-w-[1800px] mx-auto flex flex-col items-center gap-3 px-8">
            <div className="text-[10px] text-white/50 font-mono flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Your crew : 7 agents online
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-2 mt-3 text-2xl md:text-3xl opacity-90 font-mondwest">
              {['Archivist', 'Dean', 'Match-Maker', 'Draft', 'Scout', 'Bursar', 'Timekeeper'].map((partner) => (
                 <span 
                   key={partner} 
                   className="text-white tracking-tighter"
                 >
                   {partner}
                 </span>
              ))}
            </div>
          </div>
        </footer>
      </section>

      {/* SECTION 2: THE NAVIGATION (Asymmetric Layout) */}
      <section className="relative w-full py-32">
        <div className="max-w-[1024px] mx-auto px-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7">
            <h2 className="text-5xl md:text-6xl text-white mb-12 leading-[0.9] tracking-tighter max-w-lg">
              The college process assumes a lot.
            </h2>
            <div className="grid grid-cols-1 gap-8">
              <p className="text-white/60 text-sm leading-relaxed max-w-xl">
                Only 1 in 8 low-income students ever gets college counseling. The process assumes you have time, context, and someone to call when you're confused. Most students don't. And the real barrier isn't just missing information ... it's the stress and overwhelm that makes it hard to even begin.
              </p>
            </div>
            <div className="mt-12 flex items-center gap-4">
               <div className="h-px flex-1 bg-white/10" />
               <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono font-bold whitespace-nowrap">You don't need more information. You need a team</span>
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-px bg-white/10 border border-white/10">
            <div className="bg-[#080E1A] p-6 flex flex-col justify-between min-h-[320px]">
              <div>
                <span className="text-[9px] font-mono tracking-[0.2em] text-white/30 uppercase block mb-6">What the process assumes you have</span>
                <ul className="text-white/60 text-[11px] leading-relaxed space-y-4">
                  <li>Someone who has navigated this before</li>
                  <li>Time to research every option</li>
                  <li>Confidence that this is meant for you</li>
                </ul>
              </div>
              <div className="text-[9px] font-mono text-white/10 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-white/20" />
                STABLE_SIGNAL
              </div>
            </div>
            <div className="bg-[#080E1A] p-6 flex flex-col justify-between min-h-[320px] border-l border-white/10">
              <div>
                <span className="text-[9px] font-mono tracking-[0.2em] text-white/30 uppercase block mb-6">What it actually feels like</span>
                <ul className="text-white/90 text-[11px] leading-relaxed space-y-4 italic">
                  <li>Starting from zero with no map</li>
                  <li>Too overwhelmed to know where to begin</li>
                  <li>A process that wasn't designed for your life</li>
                </ul>
              </div>
              <div className="text-[9px] font-mono text-white/40 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-500/50 animate-pulse" />
                NO_MAP_DETECTED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE CREW (Specialsits Grid) */}
      <section className="relative w-full">
        <div className="max-w-[1024px] mx-auto pt-32 pb-16 px-16">
          <h2 className="text-5xl md:text-6xl text-white mb-4 leading-[0.9] tracking-tighter max-w-lg">
            Your crew. Seven specialists. Zero dollars.
          </h2>
          <p className="text-white/40 text-sm font-mono uppercase tracking-[0.2em] mb-12">Crew Status: All Stations Operational</p>
        </div>
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-2">
          {/* Agent 1: Dean */}
          <div className="border-y md:border-t-0 md:border-r border-white/10 p-16 flex flex-col justify-between min-h-[400px] hover:bg-white/[0.01] transition-colors group">
            <div>
              <h3 className="text-3xl text-white mb-4 tracking-tighter">Dean</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs transition-colors group-hover:text-white/60">
                Orchestrates your entire trajectory from departure to shore. The captain of your crew.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-xs text-white/20 font-mono tracking-widest uppercase">HEAD COUNSELOR</span>
            </div>
          </div>
          {/* Agent 2: Archivist */}
          <div className="border-b border-white/10 p-16 flex flex-col justify-between min-h-[400px] hover:bg-white/[0.01] transition-colors group">
            <div>
              <h3 className="text-3xl text-white mb-4 tracking-tighter">Archivist</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs transition-colors group-hover:text-white/60">
                Builds your profile. Synthesizes your life into an ocean-ready digital dossier.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Database className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-xs text-white/20 font-mono tracking-widest uppercase">PROFILE BUILDER</span>
            </div>
          </div>
          {/* Agent 3: Match-Maker */}
          <div className="border-b md:border-r border-white/10 p-16 flex flex-col justify-between min-h-[400px] hover:bg-white/[0.01] transition-colors group">
            <div>
              <h3 className="text-3xl text-white mb-4 tracking-tighter">Match-Maker</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs transition-colors group-hover:text-white/60">
                Finds schools you can actually afford. Mathematical filters applied to your academic potential.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Target className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-xs text-white/20 font-mono tracking-widest uppercase">FINANCIAL MATCH</span>
            </div>
          </div>
          {/* Agent 4: Draft */}
          <div className="border-b border-white/10 p-16 flex flex-col justify-between min-h-[400px] hover:bg-white/[0.01] transition-colors group">
            <div>
              <h3 className="text-3xl text-white mb-4 tracking-tighter">Draft</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs transition-colors group-hover:text-white/60">
                Reads and improves your essays. Linguistic optimization for maximum impact.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <PenTool className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-xs text-white/20 font-mono tracking-widest uppercase">ESSAY ANALYST</span>
            </div>
          </div>
          {/* Agent 5: Scout */}
          <div className="border-b md:border-r border-white/10 p-16 flex flex-col justify-between min-h-[400px] hover:bg-white/[0.01] transition-colors group">
            <div>
              <h3 className="text-3xl text-white mb-4 tracking-tighter">Scout</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs transition-colors group-hover:text-white/60">
                Finds scholarships you qualify for. Deep-search strategies across the aid landscape.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Search className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-xs text-white/20 font-mono tracking-widest uppercase">GRANT FINDER</span>
            </div>
          </div>
          {/* Agent 6: Bursar */}
          <div className="border-b border-white/10 p-16 flex flex-col justify-between min-h-[400px] hover:bg-white/[0.01] transition-colors group">
            <div>
              <h3 className="text-3xl text-white mb-4 tracking-tighter">Bursar</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs transition-colors group-hover:text-white/60">
                Shows your real cost after aid. Pure economic data, stripped of obfuscation.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <CircleDollarSign className="w-8 h-8 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-xs text-white/20 font-mono tracking-widest uppercase">COST ANALYSIS</span>
            </div>
          </div>
          {/* Agent 7: Timekeeper - Spanning 2 columns on desktop */}
          <div className="md:col-span-2 border-b border-white/10 p-16 flex flex-col md:flex-row justify-between items-start md:items-center min-h-[300px] hover:bg-white/[0.01] transition-colors group">
            <div className="max-w-xl">
              <h3 className="text-4xl text-white mb-4 tracking-tighter">Timekeeper</h3>
              <p className="text-white/40 text-base leading-relaxed transition-colors group-hover:text-white/60">
                Builds your deadline calendar. Temporal mapping of admission-critical milestones. Never miss a deadline.
              </p>
            </div>
            <div className="flex items-center gap-8 mt-12 md:mt-0">
              <Clock className="w-12 h-12 text-white/20 group-hover:text-white/40 transition-colors" />
              <span className="text-sm text-white/20 font-mono tracking-[0.2em] uppercase">DEADLINE SCHEDULER</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS (Navigation Log) */}
      <section className="relative w-full py-48 bg-white/[0.02] border-t border-b border-white/10">
        <div className="max-w-[1024px] mx-auto px-16 text-center">
          <span className="text-[10px] uppercase font-mono font-bold tracking-[0.3em] text-white/30 mb-12 block">Navigation Log</span>
          <h2 className="text-[120px] md:text-[180px] text-white tracking-tighter leading-[0.75] font-mondwest mb-12">
            From lost<br/>to landed.
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-12 text-left max-w-4xl mx-auto">
             {/* Step 1 */}
             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 text-white">
                   <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20 rounded">01</span>
                   <span className="text-lg font-medium tracking-tight">Drop your context.</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                   Your transcript, essays, financial info. Archivist reads all of it and builds your profile.
                </p>
             </div>
             {/* Step 2 */}
             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 text-white">
                   <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20 rounded">02</span>
                   <span className="text-lg font-medium tracking-tight">Talk to Dean.</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                   Your head counselor learns what you need and puts the crew to work in real time.
                </p>
             </div>
             {/* Step 3 */}
             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 text-white">
                   <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-white/20 rounded">03</span>
                   <span className="text-lg font-medium tracking-tight">Get your plan.</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                   A school list, matched scholarships, essay feedback, your real aid picture, and a deadline calendar built for you.
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: HOW IT WAS BUILT */}
      <section className="relative w-full py-48">
        <div className="max-w-[1024px] mx-auto px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-24">
            <div>
              <h2 className="text-5xl md:text-6xl text-white mb-8 leading-[0.9] tracking-tighter">
                Built because the gap is real.
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-md">
                Nami was built for the student who is juggling two jobs, taking care of her family, and trying to navigate a process that assumes she has time, context, and someone to call. The college counseling gap is not an information problem. It is a team problem. We built the team.
              </p>
            </div>
            <div>
              <h3 className="text-2xl text-white mb-6 italic tracking-tight underline decoration-white/10 underline-offset-8">The architecture.</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Nami runs on two kinds of memory. A Student Graph that knows who you are ... built from everything you upload, stored as structured claims every agent can query. And a World Corpus powered by Human Delta that knows the landscape ... pre-indexed schools, scholarships, aid policies, and essay resources. Seven Claude agents sit at the intersection of both, synthesizing personal knowledge and world knowledge into guidance specific to you.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    </div>
                  ))}
                </div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">7 Agent Sub-Cluster Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center pt-24 border-t border-white/10">
            <span className="text-sm md:text-lg text-white/90 font-mondwest tracking-tighter italic">
              Two memories. Seven specialists. One student.
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="relative w-full py-32 flex flex-col items-center">
        <div className="w-full max-w-[1024px] px-16 mb-24 grayscale opacity-40 hover:opacity-60 transition-opacity duration-1000">
           <img 
             src="https://picsum.photos/seed/nautical/1200/600" 
             alt="Deep navigation" 
             referrerPolicy="no-referrer"
             className="w-full aspect-[2/1] object-cover border border-white/10"
           />
        </div>
        
        <button className="liquid-glass-strong rounded-full px-12 py-5 text-sm font-bold uppercase tracking-widest text-white hover:scale-[1.03] transition-transform active:scale-95">
           Your Crew Is Ready
        </button>
      </section>

      {/* FINAL FOOTER */}
      <footer className="relative w-full py-16 border-t border-white/10">
        <div className="max-w-[1024px] mx-auto px-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl italic text-white/80">Nami<sup className="text-[10px]">®</sup></div>
          <div className="flex items-center gap-12">
             <span className="text-[10px] text-white/30 uppercase font-mono tracking-[0.2em]">Privacy</span>
             <span className="text-[10px] text-white/30 uppercase font-mono tracking-[0.2em]">Terms</span>
             <span className="text-[10px] text-white/30 uppercase font-mono tracking-[0.2em]">X / Insta</span>
          </div>
          <div className="text-[10px] text-white/20 uppercase font-mono tracking-widest">&copy; 2026 Nami Systems</div>
        </div>
      </footer>
    </main>
    )}
    </>
  );
}


