import { randomBytes } from "crypto";
import { API_KEY_PREFIX, API_KEY_LENGTH } from "./constants";

export function generateApiKey(): string {
  const bytes = randomBytes(API_KEY_LENGTH);
  const token = bytes.toString("base64url");
  return `${API_KEY_PREFIX}${token}`;
}

export function generateAnonymousId(): string {
  return `ag-${randomBytes(4).toString("hex")}`;
}
