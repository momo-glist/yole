import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { inputAudio } = await req.json();

    if (!inputAudio?.data || !inputAudio?.format) {
      return new Response(JSON.stringify({ error: "Missing audio data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openRouterApiKey = Deno.env.get("OPEN_ROUTER_API_KEY");

    if (!openRouterApiKey) {
      throw new Error("OPEN_ROUTER_API_KEY is not set");
    }

    // Convert base64 to blob
    const audioBuffer = Uint8Array.from(atob(inputAudio.data), (c) => c.charCodeAt(0));
    const blob = new Blob([audioBuffer], { type: `audio/${inputAudio.format}` });

    const formData = new FormData();
    formData.append("file", blob, `audio.${inputAudio.format}`);
    formData.append("model", "microsoft/mai-transcribe-1.5");

    const response = await fetch(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", errorText);
      throw new Error(`OpenRouter error: ${errorText}`);
    }

    const data = await response.json();

    console.log("OpenRouter response:", JSON.stringify(data));

    const transcription = data.text;

    if (!transcription) {
      console.error("No text in transcription response:", JSON.stringify(data));
      throw new Error("Empty transcription returned from API");
    }

    return new Response(JSON.stringify({ transcript: transcription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
