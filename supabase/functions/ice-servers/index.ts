import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const turnUrl = Deno.env.get("TURN_SERVER_URL") || "a.relay.metered.ca";
  const turnUsername = Deno.env.get("TURN_USERNAME") || "e8dd65b92f6deb2b4a750985";
  const turnCredential = Deno.env.get("TURN_CREDENTIAL") || "3JMnR3v1HGbMskge";

  const iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    {
      urls: `turn:${turnUrl}:80`,
      username: turnUsername,
      credential: turnCredential,
    },
    {
      urls: `turn:${turnUrl}:80?transport=tcp`,
      username: turnUsername,
      credential: turnCredential,
    },
    {
      urls: `turn:${turnUrl}:443`,
      username: turnUsername,
      credential: turnCredential,
    },
    {
      urls: `turns:${turnUrl}:443?transport=tcp`,
      username: turnUsername,
      credential: turnCredential,
    },
  ];

  return new Response(JSON.stringify({ iceServers }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
