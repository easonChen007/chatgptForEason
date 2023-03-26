import type { APIRoute } from "astro";
import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any;

async function loadSupabaseClient() {
  if (!supabaseInstance) {
    const SUPABASE_URL = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  return { supabase: supabaseInstance };
}

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const record = body.record;

  const { supabase } = await loadSupabaseClient();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 构建对象
        const { data, error } = await supabase.from('HumanRequest').insert({
          user_input: record.user_input,
          generated_text: record.generated_text,
        });

        if (error) {
          throw new Error(error.message);
        }

        // 返回成功响应
        const successMessage = JSON.stringify({
          message: "Record saved successfully.",
          data,
        });
        controller.enqueue(successMessage);
        controller.close();
      } catch (error: unknown) {
        // 返回错误响应
        const errorMessage = JSON.stringify({
          message: "Failed to save the record.",
          error: (error as Error).message,
        });
        controller.enqueue(errorMessage);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/json" } });
};

export default post;
