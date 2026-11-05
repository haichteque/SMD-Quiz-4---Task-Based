const COUNTRY_CODE = /^\+\d{1,4}$/;

export function toE164(countryCode: string, nationalNumber: string): string | null {
  const code = countryCode.trim();
  const digits = nationalNumber.replace(/\D/g, "");
  if (!COUNTRY_CODE.test(code)) {
    return null;
  }
  if (digits.length < 6 || digits.length > 14) {
    return null;
  }
  return `${code}${digits}`;
}

export function formatPhone(e164: string): string {
  const match = e164.match(/^(\+\d{1,3})(\d+)$/);
  if (!match) {
    return e164;
  }
  if (match[2].startsWith("0") && match[1].length > 2) {
    const code = match[1].slice(0, -1);
    const national = `${match[1].slice(-1)}${match[2]}`;
    return `${code} ${national}`;
  }
  return `${match[1]} ${match[2]}`;
}