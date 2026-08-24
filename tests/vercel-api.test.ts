import { describe, expect, it } from "bun:test";
import skillsHandler from "../api/skills.ts";
import manifestHandler from "../api/manifest.ts";
import installHandler from "../api/install.ts";

describe("Vercel Serverless API Handlers", () => {
  it("GET /api/skills returns all skills with categories", async () => {
    const req = new Request("https://antigravity-superpowers.vercel.app/api/skills");
    const res = await skillsHandler(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
    expect(data.skills.length).toBe(data.total);
    expect(data.categories).toBeDefined();
  });

  it("GET /api/skills with search query filters results", async () => {
    const req = new Request("https://antigravity-superpowers.vercel.app/api/skills?q=architect");
    const res = await skillsHandler(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.filtered).toBeGreaterThan(0);
    expect(data.skills.every((s: { name: string; description: string }) =>
      s.name.includes("architect") || s.description.toLowerCase().includes("architect")
    )).toBe(true);
  });

  it("GET /api/skills with specific name returns skill markdown", async () => {
    const req = new Request("https://antigravity-superpowers.vercel.app/api/skills?name=antigravity-superpowers");
    const res = await skillsHandler(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("antigravity-superpowers");
    expect(data.content).toContain("# Antigravity Superpowers Core Protocol");
  });

  it("GET /api/manifest returns valid skills.json", async () => {
    const req = new Request("https://antigravity-superpowers.vercel.app/api/manifest");
    const res = await manifestHandler(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.skillsCount).toBeGreaterThan(0);
    expect(data.skills.length).toBe(data.skillsCount);
  });

  it("GET /api/install returns bash installer script", async () => {
    const req = new Request("https://antigravity-superpowers.vercel.app/api/install");
    const res = await installHandler(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("#!/usr/bin/env bash");
    expect(text).toContain("Antigravity Superpowers");
  });
});
