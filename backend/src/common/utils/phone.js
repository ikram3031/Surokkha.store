const BD_MOBILE = /^01[3-9]\d{8}$/;

// Digits only, with Bangla digits (০-৯) turned into English ones
const digitsOf = (raw) =>
  String(raw ?? "")
    .replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
    .replace(/\D/g, "");

// Any typed Bangladeshi mobile (01…, 1…, 8801…, +8801…, 008801…, with spaces or dashes) as 01XXXXXXXXX; other input comes back as plain digits
export const toLocalBdPhone = (raw) => {
  const digits = digitsOf(raw);
  if (!digits) return "";
  const core = digits.replace(/^(00)?880?/, "");
  if (core.length === 10 && core.startsWith("1")) return `0${core}`;
  if (core.length === 11 && core.startsWith("01")) return core;
  const tail = digits.slice(-11);
  return BD_MOBILE.test(tail) ? tail : digits;
};

// True when the input is a valid Bangladeshi mobile number in any common format
export const isValidBdPhone = (raw) => BD_MOBILE.test(toLocalBdPhone(raw));

// Bangladeshi mobile as 8801XXXXXXXXX digits (for ad-platform hashing); other input comes back as plain digits
export const toIntlBdPhone = (raw) => {
  const local = toLocalBdPhone(raw);
  return BD_MOBILE.test(local) ? `88${local}` : local;
};

// Every stored form of one number (01…, 8801…, +8801…) for database lookups
export const bdPhoneVariants = (raw) => {
  const local = toLocalBdPhone(raw);
  return /^0\d{10}$/.test(local) ? [local, `88${local}`, `+88${local}`] : [];
};

export const BD_PHONE_ERROR = "Enter a valid Bangladeshi mobile number, e.g. 01712345678";
