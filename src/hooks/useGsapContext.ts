"use client";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
function registerGsapPlugins() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export function useGsapContext(cb: () => void, deps: React.DependencyList = []) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerGsapPlugins();
    const ctx = gsap.context(() => { cb(); }, containerRef);
    return () => ctx.revert();
  }, deps);
  return containerRef;
}
