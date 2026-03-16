export interface ParsedDevice {
  deviceType: "desktop" | "mobile" | "tablet" | null;
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

  // ─── OS ─────────────────────────────────────────────────
  let osName: string | null = null;
  let osVersion: string | null = null;

  if (platform) {
    osName = platform; // e.g. "macOS", "Windows", "Android"
  } else if (/windows nt ([\d.]+)/i.test(ua)) {
    osName = "Windows";
    osVersion = windowsVersion(RegExp.$1);
  } else if (/mac os x ([\d_]+)/i.test(ua)) {
    osName = "macOS";
    osVersion = RegExp.$1.replace(/_/g, ".");
  } else if (/android ([\d.]+)/i.test(ua)) {
    osName = "Android";
    osVersion = RegExp.$1;
  } else if (/iphone os ([\d_]+)/i.test(ua)) {
    osName = "iOS";
    osVersion = RegExp.$1.replace(/_/g, ".");
  } else if (/ipad; cpu os ([\d_]+)/i.test(ua)) {
    osName = "iOS";
    osVersion = RegExp.$1.replace(/_/g, ".");
  } else if (/linux/i.test(ua)) {
    osName = "Linux";
  }

  // ─── Browser ────────────────────────────────────────────
  let browserName: string | null = null;

  if (/edg\//i.test(ua)) {
    browserName = "Edge";
  } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
    browserName = "Opera";
  } else if (/firefox\//i.test(ua)) {
    browserName = "Firefox";
  } else if (/chrome\//i.test(ua)) {
    browserName = "Chrome";
  } else if (/safari\//i.test(ua)) {
    browserName = "Safari";
  }

  // ─── Device type ────────────────────────────────────────
  let deviceType: "desktop" | "mobile" | "tablet" | null = null;

  if (isMobileHint) {
    deviceType = "mobile";
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = "tablet";
  } else if (/mobile|android|iphone/i.test(ua)) {
    deviceType = "mobile";
  } else if (ua) {
    deviceType = "desktop";
  }

  // ─── Device name ────────────────────────────────────────
  let deviceName: string | null = null;

  if (/iphone/i.test(ua)) {
    deviceName = "iPhone";
  } else if (/ipad/i.test(ua)) {
    deviceName = "iPad";
  } else if (/macintosh/i.test(ua)) {
    deviceName = "Mac";
  }

  return { deviceType, deviceName, browserName, osName, osVersion };
}

export function extractIp(headers: RequestHeaders, remoteAddress?: string): string | null {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return remoteAddress ?? null;
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
