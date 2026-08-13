const DEYWURO_URL = "https://deywuro.com/api/sms";

function toGhanaMsisdn(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return "233" + digits.slice(-9);
}

// Server-only: sends one SMS via Deywuro. Never throws — a notification
// failure must not break the core matching/accept flow that triggered it.
export async function sendSms(phone: string | null, message: string): Promise<void> {
  if (!phone) return;
  const destination = toGhanaMsisdn(phone);
  if (!destination) return;

  const username = process.env.DEYWURO_USERNAME;
  const password = process.env.DEYWURO_PASSWORD;
  const source = process.env.DEYWURO_SOURCE;
  if (!username || !password || !source) return;

  const params = new URLSearchParams({
    username,
    password,
    source,
    destination,
    message,
  });

  try {
    await fetch(`${DEYWURO_URL}?${params.toString()}`, { method: "GET" });
  } catch {
    // best-effort notification; swallow network errors
  }
}
