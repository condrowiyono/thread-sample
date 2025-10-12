/**
 * Parse a curl command and extract URL, headers and body
 * @param curlCommand - The curl command copied from browser DevTools
 * @returns An object containing URL, headers and body
 */
export function parseCurlCommand(curlCommand: string) {
  // Remove line continuation backslashes for easier parsing
  const cleanedCommand = curlCommand.replace(/\\\s*\n\s*/g, " ");

  // Extract URL (first argument after curl)
  const urlRegex = /curl\s+'([^']+)'/;
  const url = cleanedCommand.match(urlRegex)?.[1] || "";

  // Extract all headers (-H flags)
  const headerRegex = /-H\s+'([^']+?):\s*([^']+?)'/g;
  const headers = new Headers();
  let match;

  while ((match = headerRegex.exec(cleanedCommand)) !== null) {
    const [, key, value] = match;
    headers.append(key, value);
  }

  // Extract cookies (-b flag) and add as cookie header
  const cookieRegex = /-b\s+'([^']+)'/;
  const cookieMatch = cleanedCommand.match(cookieRegex);
  if (cookieMatch?.[1]) {
    headers.set("cookie", cookieMatch[1]);
  }

  // Extract body (--data-raw flag)
  const bodyRegex = /--data-raw\s+'([^']+)'/;
  const bodyMatch = cleanedCommand.match(bodyRegex);
  const body = bodyMatch?.[1] || "";

  return { url, headers, body };
}

/**
 * Parse URL-encoded body string into an object
 * @param encodedBody - URL-encoded body string
 * @returns Parsed body object
 */
function parseUrlEncodedBody(encodedBody: string) {
  const params = new URLSearchParams(encodedBody);
  const result: Record<string, any> = {};

  for (const [key, value] of params.entries()) {
    // Try to parse JSON values (like variables)
    if (key === "variables") {
      try {
        result[key] = JSON.parse(value);
      } catch (e) {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}
