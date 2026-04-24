export const ACADEMY_ID = "my-academy";
export const QR_TYPE = "academy_checkin";

export type AcademyQrPayload = {
  type: typeof QR_TYPE;
  academyId: string;
  turnstileId: string;
  v: 1;
};

export function encodePayload(turnstileId: string): string {
  const payload: AcademyQrPayload = {
    type: QR_TYPE,
    academyId: ACADEMY_ID,
    turnstileId,
    v: 1,
  };
  return JSON.stringify(payload);
}

export function decodePayload(raw: string): AcademyQrPayload | null {
  try {
    const obj = JSON.parse(raw);
    if (
      obj?.type === QR_TYPE &&
      obj?.academyId === ACADEMY_ID &&
      typeof obj?.turnstileId === "string" &&
      obj?.v === 1
    ) {
      return obj as AcademyQrPayload;
    }
  } catch {
    // not JSON — not our QR
  }
  return null;
}

// Local calendar date "YYYY-MM-DD" — used for the "already scanned today" check.
export function todayLocalYYYYMMDD(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
