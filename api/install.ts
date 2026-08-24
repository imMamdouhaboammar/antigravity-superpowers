import fs from "node:fs";
import path from "node:path";

export default async function handler(req: Request): Promise<Response> {
  const rootDir = path.resolve(__dirname, "..");
  const installShPath = path.join(rootDir, "install.sh");

  if (!fs.existsSync(installShPath)) {
    return new Response("#!/usr/bin/env bash\necho 'Installer not found' >&2\nexit 1\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const script = fs.readFileSync(installShPath, "utf-8");
  return new Response(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
