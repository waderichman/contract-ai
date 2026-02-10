import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { getSessionFromCookies } from "@/lib/auth";
import {
  getTodayUsageCount,
  getUserById,
  hasActiveSubscription,
  incrementUsage,
} from "@/lib/db";

const getOpenAIClient = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey });
};

type AnalysisResult = {
  plain_summary: string[];
  obligations: string[];
  risks: string[];
  deadlines: string[];
  deadline_events?: { title: string; date: string; note?: string }[];
  uncertainty_note?: string;
};

const toIsoDate = (value: string): string | null => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const extractDeadlineEventsFromText = (
  deadlines: string[]
): { title: string; date: string; note?: string }[] => {
  const events: { title: string; date: string; note?: string }[] = [];
  const isoRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
  const monthDayYearRegex =
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i;
  const dayMonthYearRegex =
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i;

  for (const item of deadlines) {
    const isoMatch = item.match(isoRegex)?.[1];
    const monthDayYear = item.match(monthDayYearRegex)?.[0];
    const dayMonthYear = item.match(dayMonthYearRegex)?.[0];

    const date =
      isoMatch ||
      (monthDayYear ? toIsoDate(monthDayYear) : null) ||
      (dayMonthYear ? toIsoDate(dayMonthYear) : null);

    if (!date) continue;

    const title = item
      .replace(isoRegex, "")
      .replace(monthDayYearRegex, "")
      .replace(dayMonthYearRegex, "")
      .replace(/\s+/g, " ")
      .replace(/^[-:,. ]+|[-:,. ]+$/g, "")
      .trim();

    events.push({
      title: title || "Contract deadline",
      date,
      note: item,
    });
  }

  const unique = new Map<string, { title: string; date: string; note?: string }>();
  for (const event of events) {
    const key = `${event.date}|${event.title.toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, event);
  }

  return Array.from(unique.values());
};

const emptyAnalysis = (): AnalysisResult => ({
  plain_summary: [],
  obligations: [],
  risks: [],
  deadlines: [],
  deadline_events: [],
});

const parseAnalysisJson = (content: string | null | undefined): AnalysisResult => {
  if (!content) return emptyAnalysis();

  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch?.[0] || trimmed;

  try {
    const parsed = JSON.parse(candidate);
    const rawDeadlineEvents = Array.isArray(parsed?.deadline_events)
      ? (parsed.deadline_events as Array<{
          title?: unknown;
          date?: unknown;
          note?: unknown;
        }>)
      : [];
    return {
      plain_summary: Array.isArray(parsed?.plain_summary)
        ? parsed.plain_summary.map(String)
        : [],
      obligations: Array.isArray(parsed?.obligations)
        ? parsed.obligations.map(String)
        : [],
      risks: Array.isArray(parsed?.risks) ? parsed.risks.map(String) : [],
      deadlines: Array.isArray(parsed?.deadlines)
        ? parsed.deadlines.map(String)
        : [],
      deadline_events: rawDeadlineEvents
        .map((event) => ({
          title: typeof event?.title === "string" ? event.title : "",
          date: typeof event?.date === "string" ? event.date : "",
          note: typeof event?.note === "string" ? event.note : undefined,
        }))
        .filter((event: { title: string; date: string }) => {
          return (
            event.title.trim().length > 0 &&
            /^\d{4}-\d{2}-\d{2}$/.test(event.date)
          );
        }),
      uncertainty_note:
        typeof parsed?.uncertainty_note === "string"
          ? parsed.uncertainty_note
          : undefined,
    };
  } catch {
    return emptyAnalysis();
  }
};

const toSummaryText = (analysis: AnalysisResult): string => {
  const lines: string[] = [];

  lines.push("Plain-English Summary");
  if (analysis.plain_summary.length === 0) lines.push("- No summary returned.");
  lines.push(...analysis.plain_summary.map((item) => `- ${item}`));
  lines.push("");

  lines.push("Key Obligations");
  if (analysis.obligations.length === 0) lines.push("- None identified.");
  lines.push(...analysis.obligations.map((item) => `- ${item}`));
  lines.push("");

  lines.push("Risks or Red Flags");
  if (analysis.risks.length === 0) lines.push("- None identified.");
  lines.push(...analysis.risks.map((item) => `- ${item}`));
  lines.push("");

  lines.push("Important Dates or Deadlines");
  if (analysis.deadlines.length === 0) lines.push("- None identified.");
  lines.push(...analysis.deadlines.map((item) => `- ${item}`));

  if (analysis.uncertainty_note) {
    lines.push("");
    lines.push(`Note: ${analysis.uncertainty_note}`);
  }

  return lines.join("\n");
};

const mergeLocally = (analyses: AnalysisResult[]): AnalysisResult => {
  const dedupeStrings = (items: string[]): string[] =>
    Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

  const mergedDeadlineEvents = new Map<string, { title: string; date: string; note?: string }>();
  for (const analysis of analyses) {
    for (const event of analysis.deadline_events || []) {
      const key = `${event.date}|${event.title.toLowerCase().trim()}`;
      if (!mergedDeadlineEvents.has(key)) {
        mergedDeadlineEvents.set(key, event);
      }
    }
  }

  const uncertaintyNotes = dedupeStrings(
    analyses
      .map((analysis) => analysis.uncertainty_note || "")
      .filter((item) => item.length > 0)
  );

  return {
    plain_summary: dedupeStrings(analyses.flatMap((analysis) => analysis.plain_summary)),
    obligations: dedupeStrings(analyses.flatMap((analysis) => analysis.obligations)),
    risks: dedupeStrings(analyses.flatMap((analysis) => analysis.risks)),
    deadlines: dedupeStrings(analyses.flatMap((analysis) => analysis.deadlines)),
    deadline_events: Array.from(mergedDeadlineEvents.values()),
    uncertainty_note: uncertaintyNotes.join(" ").trim(),
  };
};

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json(
        { summary: "You must sign in before analyzing contracts." },
        { status: 401 }
      );
    }
    const user = await getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { summary: "Your account was not found. Please sign in again." },
        { status: 401 }
      );
    }

    // current free amount
    const FREE_DAILY_LIMIT = 1;
    const isPro = hasActiveSubscription(user.subscription_status);
    if (!isPro) {
      const usedToday = await getTodayUsageCount({
        userId: user.id,
        eventName: "analyze_contract",
      });
      if (usedToday >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            summary:
              "Free plan daily limit reached (2 analyses/day). Upgrade to Pro for higher usage.",
          },
          { status: 429 }
        );
      }
    }

    const openai = getOpenAIClient();
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
        } catch (err: unknown) {
          attempt += 1;
          const status =
            typeof err === "object" && err !== null
              ? Number(
                  (err as { status?: unknown; response?: { status?: unknown } })
                    .status ||
                    (err as { status?: unknown; response?: { status?: unknown } })
                      .response?.status
                )
              : 0;
          if (status !== 429 || attempt > retries) throw err;
          const headers =
            typeof err === "object" && err !== null
              ? (
                  err as {
                    headers?: { get?: (key: string) => string | null | undefined };
                  }
                ).headers
              : undefined;
          const retryAfterMs =
            Number(headers?.get?.("retry-after-ms")) ||
            Number(headers?.get?.("retry-after")) * 1000 ||
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
    const REDUCE_BATCH_SIZE = 8;
    const allChunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    const chunks = allChunks;

    const normalizeAnalysis = (analysis: AnalysisResult): AnalysisResult => {
      const fallbackEvents = extractDeadlineEventsFromText(analysis.deadlines);
      return {
        ...analysis,
        deadline_events:
          analysis.deadline_events && analysis.deadline_events.length > 0
            ? analysis.deadline_events
            : fallbackEvents,
      };
    };

    const mergeAnalysesWithModel = async (
      analyses: AnalysisResult[],
      stageLabel: string
    ): Promise<AnalysisResult> => {
      const mergePrompt = `
You are a legal assistant.

Merge the JSON analyses below into one coherent JSON object with this exact shape:
{
  "plain_summary": string[],
  "obligations": string[],
  "risks": string[],
  "deadlines": string[],
  "deadline_events": [{"title": string, "date": "YYYY-MM-DD", "note": string}],
  "uncertainty_note": string
}

Rules:
- Return JSON only. No markdown.
- Keep clear, concise, non-duplicate bullets.
- Preserve important concrete details from any input analysis.
- Keep deadline_events only for concrete YYYY-MM-DD dates.
- Set "deadline_events" to [] when no concrete dates exist.
- Set "uncertainty_note" to "" when nothing is uncertain.

Merge stage: ${stageLabel}
Input analyses:
${JSON.stringify(analyses)}
`;

      const response = await withRetry(
        () =>
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: mergePrompt }],
          }),
        3,
        2_000
      );

      const parsed = parseAnalysisJson(response.choices[0].message?.content || "");
      const normalized = normalizeAnalysis(parsed);
      const empty = emptyAnalysis();
      const isEmpty =
        normalized.plain_summary.length === empty.plain_summary.length &&
        normalized.obligations.length === empty.obligations.length &&
        normalized.risks.length === empty.risks.length &&
        normalized.deadlines.length === empty.deadlines.length &&
        (normalized.deadline_events || []).length === (empty.deadline_events || []).length &&
        !(normalized.uncertainty_note || "").trim();

      return isEmpty ? mergeLocally(analyses) : normalized;
    };

    const chunkAnalyses: AnalysisResult[] = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const chunkPrompt = `
You are a legal assistant.

Analyze this contract section and return a JSON object with this exact shape:
{
  "plain_summary": string[],
  "obligations": string[],
  "risks": string[],
  "deadlines": string[],
  "deadline_events": [{"title": string, "date": "YYYY-MM-DD", "note": string}],
  "uncertainty_note": string
}

Rules:
- Return JSON only. No markdown.
- Keep concise bullets, no duplicates.
- "deadline_events" must include only concrete dates with YYYY-MM-DD.
- If a deadline has no concrete date, include it in "deadlines" only.
- Set "deadline_events" to [] when none are concrete.
- Set "uncertainty_note" to "" when nothing is uncertain.

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

      const parsedChunk = parseAnalysisJson(
        chunkResponse.choices[0].message?.content || ""
      );
      chunkAnalyses.push(normalizeAnalysis(parsedChunk));
    }

    let currentRound = chunkAnalyses.length ? chunkAnalyses : [emptyAnalysis()];
    let round = 1;
    while (currentRound.length > 1) {
      const nextRound: AnalysisResult[] = [];
      for (let i = 0; i < currentRound.length; i += REDUCE_BATCH_SIZE) {
        const group = currentRound.slice(i, i + REDUCE_BATCH_SIZE);
        if (group.length === 1) {
          nextRound.push(group[0]);
          continue;
        }
        const merged = await mergeAnalysesWithModel(
          group,
          `Round ${round}, group ${Math.floor(i / REDUCE_BATCH_SIZE) + 1}`
        );
        nextRound.push(merged);
      }
      currentRound = nextRound;
      round += 1;
    }

    const normalizedAnalysis = currentRound[0] || emptyAnalysis();
    const summary = toSummaryText(normalizedAnalysis);
    await incrementUsage({ userId: user.id, eventName: "analyze_contract" });
    return NextResponse.json({
      summary,
      analysis: normalizedAnalysis,
      truncated: false,
      analyzedSections: chunks.length,
      totalSections: allChunks.length,
    });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ summary: "Error processing file." });
  }
}
