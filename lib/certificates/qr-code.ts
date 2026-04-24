import QRCode from "qrcode";

const DEFAULT_VERIFY_BASE_URL =
  process.env.CERTIFICATE_VERIFY_BASE_URL ||
  "https://certidraft.com/verify";

export const DEFAULT_QR_SIZE = 200;

export function generateVerificationToken() {
  return crypto.randomUUID();
}

export function buildVerificationUrl(
  token: string,
  baseUrl: string = DEFAULT_VERIFY_BASE_URL
) {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  return `${normalizedBaseUrl}/${encodeURIComponent(token)}`;
}

export async function generateVerificationQrCodeDataUrl(
  token: string,
  options?: {
    baseUrl?: string;
    size?: number;
  }
) {
  const url = buildVerificationUrl(token, options?.baseUrl);

  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    type: "image/png",
    width: options?.size ?? DEFAULT_QR_SIZE,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
