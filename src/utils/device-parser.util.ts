export type DeviceType = "desktop" | "mobile" | "tablet";

export interface ParsedDevice {
  deviceType: DeviceType | null;
  deviceName: string | null;
  browserName: string | null;
  osName: string | null;
  osVersion: string | null;
}

export interface RequestHeaders {
  "user-agent"?: string;
  "sec-ch-ua-platform"?: string;
  "sec-ch-ua-mobile"?: string;
  "sec-ch-ua"?: string;
  "x-forwarded-for"?: string;
  [key: string]: string | undefined;
}

export function parseDevice(headers: RequestHeaders): ParsedDevice {
  const ua = headers["user-agent"] ?? "";
  const platform = headers["sec-ch-ua-platform"]?.replace(/"/g, "");
  const isMobileHint = headers["sec-ch-ua-mobile"] === "?1";

  return {
    ...parseOs(ua, platform),
    browserName: parseBrowser(ua),
    ...parseDeviceInfo(ua, isMobileHint),
  };
}

export function extractIp(headers: RequestHeaders, remoteAddress?: string): string | null {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return remoteAddress ?? null;
}

export interface DeviceInfo extends ParsedDevice {
  ipAddress: string | null;
  userAgent: string | null;
}

export function deviceFrom(req: { headers?: Record<string, string | undefined>; socket?: { remoteAddress?: string } }): DeviceInfo {
  const headers: RequestHeaders = req.headers ?? {};
  return {
    ipAddress: extractIp(headers, req.socket?.remoteAddress),
    userAgent: headers["user-agent"] ?? null,
    ...parseDevice(headers),
  };
}

// ─── Private helpers ────────────────────────────────────────────────────────

function parseOs(ua: string, platform?: string): { osName: string | null; osVersion: string | null } {
  if (platform) return { osName: platform, osVersion: null };

  const unUnderscored = (v: string) => v.replaceAll("_", ".");

  const rules: Array<[RegExp, string, ((m: string) => string)?]> = [
    [/windows nt ([\d.]+)/i,   "Windows",  windowsVersion],
    [/mac os x ([\d_]+)/i,     "macOS",    unUnderscored],
    [/android ([\d.]+)/i,      "Android",  undefined],
    [/iphone os ([\d_]+)/i,    "iOS",      unUnderscored],
    [/ipad; cpu os ([\d_]+)/i, "iOS",      unUnderscored],
    [/linux/i,                 "Linux",    undefined],
  ];

  for (const [pattern, name, transform] of rules) {
    const match = pattern.exec(ua);
    if (!match) continue;
    let osVersion: string | null = null;
    if (match[1]) osVersion = transform ? transform(match[1]) : match[1];
    return { osName: name, osVersion };
  }

  return { osName: null, osVersion: null };
}

function parseBrowser(ua: string): string | null {
  if (/edg\//i.test(ua))                      return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/firefox\//i.test(ua))                  return "Firefox";
  if (/chrome\//i.test(ua))                   return "Chrome";
  if (/safari\//i.test(ua))                   return "Safari";
  return null;
}

function parseDeviceInfo(ua: string, isMobileHint: boolean): {
  deviceType: "desktop" | "mobile" | "tablet" | null;
  deviceName: string | null;
} {
  return {
    deviceType: parseDeviceType(ua, isMobileHint),
    deviceName: parseDeviceName(ua),
  };
}

function parseDeviceType(ua: string, isMobileHint: boolean): "desktop" | "mobile" | "tablet" | null {
  if (isMobileHint)              return "mobile";
  if (/tablet|ipad/i.test(ua))  return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (ua)                        return "desktop";
  return null;
}

function parseDeviceName(ua: string): string | null {
  if (/iphone/i.test(ua))    return "iPhone";
  if (/ipad/i.test(ua))      return "iPad";
  if (/macintosh/i.test(ua)) return "Mac";

  if (/android/i.test(ua)) {
    const pattern = /android[\s/][\d.]+;\s*(?:wv;\s*)?([^;)]+?)\s*(?:build|bui)[/\s)]/i;
    const match = pattern.exec(ua);
    return match ? match[1].trim() : "Android Device";
  }

  return null;
}

function windowsVersion(nt: string): string {
  const map: Record<string, string> = {
    "10.0": "11/10",
    "6.3": "8.1",
    "6.2": "8",
    "6.1": "7",
  };
  return map[nt] ?? nt;
}
