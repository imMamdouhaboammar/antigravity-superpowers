import manifestData from "./skills_manifest.json";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request): Promise<Response> {
  return new Response(JSON.stringify(manifestData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
