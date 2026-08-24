import path from "node:path";
import { generateSkillsManifest } from "../scripts/generate_manifest.ts";

export default async function handler(req: Request): Promise<Response> {
  const rootDir = path.resolve(__dirname, "..");
  const manifest = generateSkillsManifest(rootDir);

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
