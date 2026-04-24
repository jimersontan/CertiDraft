import puppeteer from "puppeteer";

type JsonPrimitive = string | number | boolean | null | undefined;
type JsonValue = JsonPrimitive | JsonRecord | JsonValue[];

interface JsonRecord {
  [key: string]: JsonValue;
}

export type CertificateDesign =
  | string
  | {
      htmlTemplate?: string | null;
      title?: string | null;
      subtitle?: string | null;
      issuerName?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
      backgroundColor?: string | null;
      textColor?: string | null;
      designSnapshot?: string | null;
    };

export type CertificateRecipientData = Record<string, unknown> & {
  name?: string;
  achievement?: string;
  citation?: string;
  issuedDate?: string;
  grade?: string;
  verificationToken?: string;
  verificationUrl?: string;
  qrCodeDataUrl?: string;
};

export async function generateCertificatePDF(
  design: CertificateDesign,
  recipientData: CertificateRecipientData
) {
  const html = renderCertificateHtml(design, recipientData);

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-dev-shm-usage",
        "--font-render-hinting=medium",
        ...(process.env.PUPPETEER_DISABLE_SANDBOX === "false"
          ? []
          : ["--no-sandbox", "--disable-setuid-sandbox"]),
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 1754,
      height: 1240,
      deviceScaleFactor: 2,
    });
    await page.emulateMediaType("screen");
    await page.setContent(html, { waitUntil: ["load", "networkidle0"] });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    const detail =
      error instanceof Error && error.message
        ? error.message
        : "Unknown browser error.";
    throw new Error(`Unable to generate certificate PDF with Puppeteer: ${detail}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

export function renderCertificateHtml(
  design: CertificateDesign,
  recipientData: CertificateRecipientData
) {
  const normalizedRecipientData: RequiredCertificateRecipientData & JsonRecord = {
    ...toInterpolationRecord(recipientData),
    name: stringifyValue(recipientData.name),
    achievement: stringifyValue(recipientData.achievement),
    citation: stringifyValue(recipientData.citation),
    issuedDate:
      stringifyValue(recipientData.issuedDate) ||
      new Date().toLocaleDateString("en-US"),
    grade: stringifyValue(recipientData.grade),
    verificationToken: stringifyValue(recipientData.verificationToken),
    verificationUrl: stringifyValue(recipientData.verificationUrl),
    qrCodeDataUrl: stringifyValue(recipientData.qrCodeDataUrl),
  };

  if (typeof design === "string") {
    return wrapPrintHtml(interpolateTemplate(design, normalizedRecipientData));
  }

  const htmlTemplate = stringifyValue(design.htmlTemplate);
  if (htmlTemplate) {
    return wrapPrintHtml(interpolateTemplate(htmlTemplate, normalizedRecipientData));
  }

  return buildDefaultCertificateHtml(design, normalizedRecipientData);
}

function buildDefaultCertificateHtml(
  design: Exclude<CertificateDesign, string>,
  recipientData: RequiredCertificateRecipientData
) {
  const primaryColor = normalizeColor(design.primaryColor, "#214ccf");
  const secondaryColor = normalizeColor(design.secondaryColor, "#14b8a6");
  const backgroundColor = normalizeColor(design.backgroundColor, "#fffdf8");
  const textColor = normalizeColor(design.textColor, "#0f172a");
  const title = escapeHtml(
    stringifyValue(design.title) || "Certificate of Achievement"
  );
  const subtitle = escapeHtml(
    stringifyValue(design.subtitle) || "This certificate is proudly presented to"
  );
  const issuerName = escapeHtml(stringifyValue(design.issuerName) || "CERTIDRAFT");
  const designSnapshotNote = stringifyValue(design.designSnapshot)
    ? '<p class="snapshot-note">Custom design snapshot attached to this batch job.</p>'
    : "";
  const qrMarkup = recipientData.qrCodeDataUrl
    ? `
      <div class="verification-box">
        <img src="${escapeAttribute(recipientData.qrCodeDataUrl)}" alt="Certificate verification QR code" />
        <p>Verify online</p>
      </div>
    `
    : "";
  const gradeMarkup = recipientData.grade
    ? `<p class="meta-line">Grade: ${escapeHtml(recipientData.grade)}</p>`
    : "";
  const verificationMarkup = recipientData.verificationUrl
    ? `<p class="meta-line verification-link">${escapeHtml(recipientData.verificationUrl)}</p>`
    : "";

  return wrapPrintHtml(`
    <section
      class="certificate"
      style="
        --certificate-primary:${primaryColor};
        --certificate-secondary:${secondaryColor};
        --certificate-background:${backgroundColor};
        --certificate-text:${textColor};
      "
    >
      <div class="certificate-frame">
        <p class="issuer">${issuerName}</p>
        <h1>${title}</h1>
        <p class="subtitle">${subtitle}</p>
        <h2>${escapeHtml(recipientData.name)}</h2>
        <p class="achievement">For ${escapeHtml(recipientData.achievement)}</p>
        <p class="citation">${escapeHtml(recipientData.citation)}</p>
        <div class="certificate-footer">
          <div class="meta">
            <p class="meta-line">Issued: ${escapeHtml(recipientData.issuedDate)}</p>
            ${gradeMarkup}
            ${verificationMarkup}
            ${designSnapshotNote}
          </div>
          ${qrMarkup}
        </div>
      </div>
    </section>
  `);
}

function wrapPrintHtml(content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            text-rendering: geometricPrecision;
            -webkit-font-smoothing: antialiased;
          }

          body {
            overflow: hidden;
          }

          .certificate {
            width: 297mm;
            height: 210mm;
            padding: 12mm;
            background: var(--certificate-background, #fffdf8);
            color: var(--certificate-text, #0f172a);
          }

          .certificate-frame {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 14mm 16mm;
            border: 1.4mm solid var(--certificate-primary, #214ccf);
            outline: 0.4mm solid var(--certificate-secondary, #14b8a6);
            outline-offset: -6mm;
          }

          .issuer {
            margin: 0;
            text-align: center;
            letter-spacing: 0.38em;
            font-size: 13px;
            font-weight: 700;
            color: var(--certificate-secondary, #14b8a6);
          }

          h1 {
            margin: 18mm 0 8mm;
            text-align: center;
            font-size: 30px;
            line-height: 1.1;
            color: var(--certificate-primary, #214ccf);
          }

          .subtitle {
            margin: 0 0 4mm;
            text-align: center;
            font-size: 14px;
            color: #475569;
          }

          h2 {
            margin: 0 0 6mm;
            text-align: center;
            font-size: 24px;
            line-height: 1.2;
            color: var(--certificate-text, #0f172a);
          }

          .achievement {
            margin: 0 0 4mm;
            text-align: center;
            font-size: 14px;
            color: #334155;
          }

          .citation {
            margin: 0 auto;
            max-width: 190mm;
            text-align: center;
            font-size: 13px;
            line-height: 1.75;
            color: #475569;
          }

          .certificate-footer {
            position: absolute;
            right: 16mm;
            bottom: 14mm;
            left: 16mm;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 10mm;
          }

          .meta {
            min-width: 0;
            max-width: 190mm;
          }

          .meta-line,
          .snapshot-note {
            margin: 0 0 2mm;
            font-size: 11px;
            line-height: 1.45;
            color: #64748b;
          }

          .verification-link {
            word-break: break-all;
          }

          .verification-box {
            width: 34mm;
            text-align: center;
            flex: 0 0 auto;
          }

          .verification-box img {
            display: block;
            width: 100%;
            height: auto;
            image-rendering: high-quality;
          }

          .verification-box p {
            margin: 2mm 0 0;
            font-size: 10px;
            font-weight: 700;
            color: #475569;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `.trim();
}

type RequiredCertificateRecipientData = {
  name: string;
  achievement: string;
  citation: string;
  issuedDate: string;
  grade: string;
  verificationToken: string;
  verificationUrl: string;
  qrCodeDataUrl: string;
};

function interpolateTemplate(template: string, values: JsonRecord) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const resolved = resolvePath(values, key);
    return escapeHtml(stringifyValue(resolved));
  });
}

function toInterpolationRecord(value: Record<string, unknown>): JsonRecord {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, toJsonValue(entry)])
  );
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
    return toInterpolationRecord(value as Record<string, unknown>);
  }

  return String(value);
}

function resolvePath(value: JsonValue, path: string): JsonValue {
  return path.split(".").reduce<JsonValue>((currentValue, segment) => {
    if (
      currentValue &&
      typeof currentValue === "object" &&
      !Array.isArray(currentValue) &&
      segment in currentValue
    ) {
      return (currentValue as JsonRecord)[segment];
    }

    return "";
  }, value);
}

function stringifyValue(value: JsonValue) {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function normalizeColor(value: string | null | undefined, fallback: string) {
  return value && /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
