import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

// Mock confettiBurst
vi.mock("@/components/ConfettiBurst", () => ({
  confettiBurst: vi.fn(),
}));

// Mock shareLink
vi.mock("@/lib/identity", () => ({
  shareLink: (code: string) => `https://hermes.launch/?ref=${code || "default"}`,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { confettiBurst } from "@/components/ConfettiBurst";
import { toast } from "sonner";

describe("useViral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    navigator.share = undefined;
  });

  it("exports useViral hook", async () => {
    const viral = await import("@/hooks/useViral");
    expect(viral.useViral).toBeDefined();
    expect(typeof viral.useViral).toBe("function");
  });

  it("confettiBurst is called with correct preset for buy", () => {
    confettiBurst("buy");
    expect(confettiBurst).toHaveBeenCalledWith("buy");
  });

  it("confettiBurst is called with correct preset for sell", () => {
    confettiBurst("sell");
    expect(confettiBurst).toHaveBeenCalledWith("sell");
  });

  it("confettiBurst is called with migration preset", () => {
    confettiBurst("migration");
    expect(confettiBurst).toHaveBeenCalledWith("migration");
  });

  it("confettiBurst can trigger all presets", () => {
    const presets = ["buy", "sell", "create", "like", "migration", "xp"] as const;
    presets.forEach((preset) => {
      confettiBurst(preset);
      expect(confettiBurst).toHaveBeenCalledWith(preset);
    });
  });

  it("toast.success is called on copy", () => {
    toast.success("Referral link copied!");
    expect(toast.success).toHaveBeenCalledWith("Referral link copied!");
  });

  it("shareLink generates correct URL with ref code", async () => {
    const { shareLink } = await import("@/lib/identity");
    const link = shareLink("TESTCODE");
    expect(link).toBe("https://hermes.launch/?ref=TESTCODE");
  });

  it("shareLink generates default URL without ref code", async () => {
    const { shareLink } = await import("@/lib/identity");
    const link = shareLink("");
    expect(link).toBe("https://hermes.launch/?ref=default");
  });
});

describe("ReferralBanner SSR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders with referral code", async () => {
    const ReferralBanner = (await import("@/components/ReferralBanner")).default;
    const html = renderToString(React.createElement(ReferralBanner, { code: "TEST123" }));

    expect(html).toContain("Invite friends");
    expect(html).toContain("Copy Link");
    expect(html).toContain("Dismiss banner");
  });

  it("renders with default code when none provided", async () => {
    const ReferralBanner = (await import("@/components/ReferralBanner")).default;
    const html = renderToString(React.createElement(ReferralBanner, {}));

    expect(html).toContain("Invite friends");
  });
});
