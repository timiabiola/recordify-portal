import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest } from "./handlers/requestHandler.ts";

serve(async (req) => {
  return await handleRequest(req);
});