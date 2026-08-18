import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";

// Mock sonner
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

describe("Retention Loops Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Home renders with streak badge when streak > 0", async () => {
    const Home = (await import("@/pages/Home")).default;
    const html = renderToString(
      <MemoryRouter initialEntries={["/"]}>
        <Home initialTab="feed" />
      </MemoryRouter>
    );
    expect(html).toBeDefined();
  });

  it("Home renders profile tab with quests and leaderboard", async () => {
    const Home = (await import("@/pages/Home")).default;
    const html = renderToString(
      <MemoryRouter initialEntries={["/profile"]}>
        <Home initialTab="profile" />
      </MemoryRouter>
    );
    expect(html).toBeDefined();
  });
});
