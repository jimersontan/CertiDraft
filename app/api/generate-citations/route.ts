import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const MAX_RETRY_ATTEMPTS = 3;

type GenerateCitationsRequest = {
  batch_upload_id?: string;
};

type JsonRecord = Record<string, unknown>;

type RecipientRecord = {
  index: number;
  raw: JsonRecord;
  name: string;
  achievement: string;
};

type CitationRow = {
  id?: string;
  batch_upload_id?: string;
  recipient_index?: number;
  recipient_name?: string | null;
  name?: string | null;
  achievement?: string | null;
  citation_text?: string | null;
  citation?: string | null;
  status?: string | null;
  error_message?: string | null;
};

type StreamEvent =
  | {
      type: "started";
      batch_upload_id: string;
      total: number;
      skipped: number;
      completed: number;
      failed: number;
    }
  | {
      type: "progress";
      batch_upload_id: string;
      recipient_index: number;
      recipient_name: string;
      status: "completed" | "failed" | "skipped";
      total: number;
      completed: number;
      failed: number;
      skipped: number;
      citation?: string;
      error?: string;
    }
  | {
      type: "completed";
      batch_upload_id: string;
      total: number;
      completed: number;
      failed: number;
      skipped: number;
    }
  | {
      type: "error";
      batch_upload_id?: string;
      message: string;
    };

class OpenAiRequestError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "OpenAiRequestError";
    this.status = status;
    this.retryable = retryable;
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: GenerateCitationsRequest;

  try {
    body = (await request.json()) as GenerateCitationsRequest;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const batchUploadId = body.batch_upload_id?.trim();

  if (!batchUploadId) {
    return Response.json(
      { error: "Missing required field: batch_upload_id." },
      { status: 400 }
    );
  }

  if (!hasSupabaseServerEnv()) {
    return Response.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "OpenAI is not configured. Add OPENAI_API_KEY to generate citations.",
      },
      { status: 500 }
    );
  }

  let supabase;

  try {
    supabase = await createClient();
  } catch (error) {
    return Response.json(
      {
        error: getErrorMessage(error, "Unable to create Supabase client."),
      },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return Response.json(
      { error: `Unable to verify the current user: ${authError.message}` },
      { status: 401 }
    );
  }

  if (!user) {
    return Response.json(
      { error: "Authentication required to generate citations." },
      { status: 401 }
    );
  }

  const { data: batchUpload, error: batchError } = await supabase
    .from("batch_uploads")
    .select("*")
    .eq("id", batchUploadId)
    .single();

  if (batchError || !batchUpload) {
    return Response.json(
      {
        error: batchError?.message || "Batch upload not found.",
      },
      { status: 404 }
    );
  }

  if (
    typeof batchUpload.user_id === "string" &&
    batchUpload.user_id !== user.id
  ) {
    return Response.json(
      { error: "You do not have permission to generate citations for this batch." },
      { status: 403 }
    );
  }

  const recipients = extractRecipients(batchUpload);

  if (recipients.length === 0) {
    return Response.json(
      {
        error:
          "No recipients were found on the batch upload. Expected an array in one of: recipients, rows, parsed_rows, recipient_rows, data, payload.",
      },
      { status: 400 }
    );
  }

  const { data: citations, error: citationsError } = await supabase
    .from("citations")
    .select("*")
    .eq("batch_upload_id", batchUploadId);

  if (citationsError) {
    return Response.json(
      {
        error: `Unable to read existing citations: ${citationsError.message}`,
      },
      { status: 500 }
    );
  }

  const existingCitations = (citations ?? []) as CitationRow[];
  const encoder = new TextEncoder();
  const model = process.env.OPENAI_CITATION_MODEL || DEFAULT_OPENAI_MODEL;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const counts = {
        completed: 0,
        failed: 0,
        skipped: 0,
      };

      const writeEvent = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        writeEvent({
          type: "started",
          batch_upload_id: batchUploadId,
          total: recipients.length,
          skipped: counts.skipped,
          completed: counts.completed,
          failed: counts.failed,
        });

        for (const recipient of recipients) {
          const existingCitation = findExistingCitation(existingCitations, recipient);

          if (hasCompletedCitation(existingCitation)) {
            counts.skipped += 1;
            writeEvent({
              type: "progress",
              batch_upload_id: batchUploadId,
              recipient_index: recipient.index,
              recipient_name: recipient.name,
              status: "skipped",
              total: recipients.length,
              completed: counts.completed,
              failed: counts.failed,
              skipped: counts.skipped,
              citation:
                existingCitation?.citation_text || existingCitation?.citation || "",
            });
            continue;
          }

          try {
            const citation = await withRetries(
              () =>
                generateCitation({
                  apiKey: process.env.OPENAI_API_KEY!,
                  model,
                  name: recipient.name,
                  achievement: recipient.achievement,
                }),
              MAX_RETRY_ATTEMPTS
            );

            await persistCitation({
              supabase,
              existingCitation,
              batchUploadId,
              recipient,
              citation,
              model,
              status: "completed",
            });

            counts.completed += 1;
            writeEvent({
              type: "progress",
              batch_upload_id: batchUploadId,
              recipient_index: recipient.index,
              recipient_name: recipient.name,
              status: "completed",
              total: recipients.length,
              completed: counts.completed,
              failed: counts.failed,
              skipped: counts.skipped,
              citation,
            });
          } catch (error) {
            const message = getErrorMessage(
              error,
              "Unable to generate citation for this recipient."
            );

            try {
              await persistCitation({
                supabase,
                existingCitation,
                batchUploadId,
                recipient,
                citation: null,
                model,
                status: "failed",
                errorMessage: message,
              });
            } catch (persistError) {
              const persistMessage = getErrorMessage(
                persistError,
                "Failed to save the citation error state."
              );
              counts.failed += 1;
              writeEvent({
                type: "progress",
                batch_upload_id: batchUploadId,
                recipient_index: recipient.index,
                recipient_name: recipient.name,
                status: "failed",
                total: recipients.length,
                completed: counts.completed,
                failed: counts.failed,
                skipped: counts.skipped,
                error: `${message} Save error: ${persistMessage}`,
              });
              continue;
            }

            counts.failed += 1;
            writeEvent({
              type: "progress",
              batch_upload_id: batchUploadId,
              recipient_index: recipient.index,
              recipient_name: recipient.name,
              status: "failed",
              total: recipients.length,
              completed: counts.completed,
              failed: counts.failed,
              skipped: counts.skipped,
              error: message,
            });
          }
        }

        writeEvent({
          type: "completed",
          batch_upload_id: batchUploadId,
          total: recipients.length,
          completed: counts.completed,
          failed: counts.failed,
          skipped: counts.skipped,
        });
      } catch (error) {
        writeEvent({
          type: "error",
          batch_upload_id: batchUploadId,
          message: getErrorMessage(error, "Citation generation failed."),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function extractRecipients(batchUpload: JsonRecord): RecipientRecord[] {
  const sources = [
    batchUpload.recipients,
    batchUpload.rows,
    batchUpload.parsed_rows,
    batchUpload.recipient_rows,
    batchUpload.data,
    batchUpload.payload,
  ];

  const rawRecipients =
    sources
      .map((source) => extractArray(source))
      .find((value) => value.length > 0) ?? [];

  return rawRecipients
    .map((item, index) => normalizeRecipient(item, index))
    .filter((recipient): recipient is RecipientRecord => recipient !== null);
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  const nestedKeys = [
    "recipients",
    "rows",
    "parsed_rows",
    "recipient_rows",
    "data",
    "items",
  ];

  for (const key of nestedKeys) {
    const nestedValue = record[key];
    if (Array.isArray(nestedValue)) {
      return nestedValue;
    }
  }

  return [];
}

function normalizeRecipient(item: unknown, index: number): RecipientRecord | null {
  const raw = asRecord(item);

  if (!raw) {
    return null;
  }

  const name = pickString(raw, [
    "name",
    "Name",
    "full_name",
    "fullName",
    "recipient_name",
    "recipientName",
  ]);
  const achievement = pickString(raw, [
    "achievement",
    "Achievement",
    "award",
    "Award",
    "course",
    "Course",
    "result",
    "Result",
    "title",
    "Title",
  ]);

  if (!name || !achievement) {
    return null;
  }

  return {
    index,
    raw,
    name,
    achievement,
  };
}

function pickString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function findExistingCitation(
  citations: CitationRow[],
  recipient: RecipientRecord
): CitationRow | undefined {
  return citations.find((citation) => {
    if (typeof citation.recipient_index === "number") {
      return citation.recipient_index === recipient.index;
    }

    const citationName = (citation.recipient_name || citation.name || "")
      .toString()
      .trim()
      .toLowerCase();
    const citationAchievement = (citation.achievement || "")
      .toString()
      .trim()
      .toLowerCase();

    return (
      citationName === recipient.name.trim().toLowerCase() &&
      citationAchievement === recipient.achievement.trim().toLowerCase()
    );
  });
}

function hasCompletedCitation(citation?: CitationRow) {
  const text = citation?.citation_text || citation?.citation || "";
  const status = (citation?.status || "").toLowerCase();

  return text.trim().length > 0 && status !== "failed";
}

async function generateCitation({
  apiKey,
  model,
  name,
  achievement,
}: {
  apiKey: string;
  model: string;
  name: string;
  achievement: string;
}) {
  const prompt =
    `Generate a professional, personalized certificate citation for ${name} ` +
    `who ${achievement}. The citation should be 2-3 sentences, formal tone, ` +
    `acknowledge their specific accomplishment. Do not include "Certificate of Completion" as a preamble.`;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "You write concise, professional certificate citations for awards, course completion, and recognitions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await readOpenAiError(response);
    throw new OpenAiRequestError(
      details || `OpenAI request failed with status ${response.status}.`,
      response.status,
      response.status === 429 || response.status >= 500
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new OpenAiRequestError(
      "OpenAI returned an empty citation response.",
      502,
      true
    );
  }

  return content;
}

async function withRetries<T>(
  operation: () => Promise<T>,
  maxAttempts: number
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxAttempts) {
        break;
      }

      await sleep(400 * attempt);
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown) {
  if (error instanceof OpenAiRequestError) {
    return error.retryable;
  }

  if (error instanceof TypeError) {
    return true;
  }

  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function persistCitation({
  supabase,
  existingCitation,
  batchUploadId,
  recipient,
  citation,
  model,
  status,
  errorMessage = null,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  existingCitation?: CitationRow;
  batchUploadId: string;
  recipient: RecipientRecord;
  citation: string | null;
  model: string;
  status: "completed" | "failed";
  errorMessage?: string | null;
}) {
  const now = new Date().toISOString();
  const payload = {
    batch_upload_id: batchUploadId,
    recipient_index: recipient.index,
    recipient_name: recipient.name,
    achievement: recipient.achievement,
    citation_text: citation,
    status,
    error_message: errorMessage,
    model,
    generated_at: status === "completed" ? now : null,
    updated_at: now,
  };

  let result;

  if (existingCitation?.id) {
    result = await supabase.from("citations").update(payload).eq("id", existingCitation.id);
  } else {
    result = await supabase.from("citations").insert(payload);
  }

  if (result.error) {
    throw new Error(
      `Unable to save citation row. Expected \`citations\` to support at least batch_upload_id, recipient_index, recipient_name, achievement, citation_text, status, error_message, model, generated_at, and updated_at. Supabase error: ${result.error.message}`
    );
  }
}

async function readOpenAiError(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    return payload.error?.message || "";
  } catch {
    return "";
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
