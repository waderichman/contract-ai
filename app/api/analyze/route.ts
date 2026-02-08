import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) return NextResponse.json({ summary: "No file uploaded." });

    // Convert uploaded file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse PDF from buffer (no file path!)
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    const chunkText = (input: string, size: number, overlap: number) => {
      if (size <= overlap) throw new Error("Chunk size must be > overlap.");
      const chunks: string[] = [];
      for (let i = 0; i < input.length; i += size - overlap) {
        chunks.push(input.slice(i, i + size));
      }
      return chunks;
    };

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const withRetry = async <T>(
      fn: () => Promise<T>,
      retries: number,
      baseDelayMs: number
    ): Promise<T> => {
      let attempt = 0;
      while (true) {
        try {
          return await fn();
        } catch (err: any) {
          attempt += 1;
          const status = err?.status || err?.response?.status;
          if (status !== 429 || attempt > retries) throw err;
          const retryAfterMs =
            Number(err?.headers?.get?.("retry-after-ms")) ||
            Number(err?.headers?.get?.("retry-after")) * 1000 ||
            0;
          const delay = Math.max(baseDelayMs * attempt, retryAfterMs || 0);
          await sleep(delay);
        }
      }
    };

    // Chunk large inputs to stay under context limits.
    // 128k tokens is roughly <= 200k-300k chars depending on content.
    const CHUNK_SIZE = 30_000;
    const CHUNK_OVERLAP = 1_000;
    const MAX_CHUNKS = 8;

    const allChunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    const wasTruncated = allChunks.length > MAX_CHUNKS;
    const chunks = wasTruncated ? allChunks.slice(0, MAX_CHUNKS) : allChunks;

    const chunkSummaries: string[] = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const chunkPrompt = `
You are a legal assistant.

Summarize this contract section.
Return concise bullets for:
1. Plain-English summary (2-4 bullets)
2. Key obligations
3. Risks or red flags
4. Important dates or deadlines

Section ${i + 1} of ${chunks.length}:
${chunks[i]}
`;

      const chunkResponse = await withRetry(
        () =>
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: chunkPrompt }],
          }),
        3,
        2_000
      );

      const chunkSummary =
        chunkResponse.choices[0].message?.content || "No summary.";
      chunkSummaries.push(
        `Section ${i + 1} summary:\n${chunkSummary}`.trim()
      );
    }

    const finalPrompt = `
You are a legal assistant.

Using the section summaries below, produce a single coherent output with:
1. Plain-English summary
2. Key obligations
3. Risks or red flags
4. Important dates or deadlines

Be concise and remove duplicates.
${wasTruncated ? "Note: Some sections were omitted due to size; mention uncertainty.\n" : ""}
Section summaries:
${chunkSummaries.join("\n\n")}
`;

    const finalResponse = await withRetry(
      () =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: finalPrompt }],
        }),
      3,
      2_000
    );

    const summary =
      finalResponse.choices[0].message?.content || "No summary.";
    return NextResponse.json({ summary, truncated: wasTruncated });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ summary: "Error processing file." });
  }
}
