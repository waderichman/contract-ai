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

    const prompt = `
You are a legal assistant.

Analyze the following contract and return:
1. Plain-English summary
2. Key obligations
3. Risks or red flags
4. Important dates or deadlines

Contract text:
${text}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = response.choices[0].message?.content || "No summary.";
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ summary: "Error processing file." });
  }
}
