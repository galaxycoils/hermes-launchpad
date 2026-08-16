"use client";
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
function registerGsapPlugins() {
  if (registered || typeof window === "undefined") return;
  try {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  } catch (e) {
    console.warn("GSAP plugin registration failed:", e);
  }
}

export function useGsapContext(cb: () => void, deps: React.DependencyList = []) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerGsapPlugins();
    try {
      const ctx = gsap.context(() => {
        try {
          cb();
        } catch (e) {
          console.warn("GSAP context callback failed:", e);
        }
      }, containerRef);
      return () => {
        try {
          ctx.revert();
        } catch (e) {
          console.warn("GSAP revert failed:", e);
        }
      };
    } catch (e) {
      console.warn("GSAP context initialization failed:", e);
    }
  }, deps);
  return containerRef;
}
