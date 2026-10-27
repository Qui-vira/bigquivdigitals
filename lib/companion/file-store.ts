/**
 * Where the product zip lives. The download route only talks to FileStore.
 *
 * Production: a Vercel Blob PRIVATE store. Private blobs are read with the SDK
 * `get(pathname, { access: "private", token })`, which returns a ReadableStream plus
 * metadata (size, etag). The token is COMPANION_BLOB_TOKEN (env var NAME only).
 * Docs read 2026-10-15:
 *   https://vercel.com/docs/vercel-blob/private-storage
 *   https://vercel.com/docs/vercel-blob/using-blob-sdk
 *   https://vercel.com/docs/functions/limitations (4.5 MB payload note, see DELIVERY.md)
 * @vercel/blob 2.3.2 is already in package.json and installed. The import below
 * is dynamic so tests and local runs never load it.
 *
 * The SDK `get` has no byte-range option, so ranges are NOT supported. The
 * download route refuses Range requests instead of pretending to honour them.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { env } from "./env";

export type FileHead = { size: number; contentType: string; etag: string | null };
export type FileStream = { stream: ReadableStream<Uint8Array>; head: FileHead };

export interface FileStore {
  /** null when the key does not exist. Whole file only (no ranges). */
  getStream(key: string): Promise<FileStream | null>;
  head(key: string): Promise<FileHead | null>;
}

/** Local disk, for tests and local runs. Keys are resolved inside `root` only. */
export class LocalDiskFileStore implements FileStore {
  constructor(private root: string) {}

  private resolve(key: string): string | null {
    const full = path.resolve(this.root, key);
    const rel = path.relative(path.resolve(this.root), full);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
    return full;
  }

  async head(key: string): Promise<FileHead | null> {
    const full = this.resolve(key);
    if (!full) return null;
    try {
      const s = await stat(full);
      if (!s.isFile()) return null;
      return { size: s.size, contentType: "application/zip", etag: `${s.size}-${Math.floor(s.mtimeMs)}` };
    } catch {
      return null;
    }
  }

  async getStream(key: string): Promise<FileStream | null> {
    const full = this.resolve(key);
    const head = await this.head(key);
    if (!full || !head) return null;
    const stream = Readable.toWeb(createReadStream(full)) as unknown as ReadableStream<Uint8Array>;
    return { stream, head };
  }
}

export class FileStoreNotConfiguredError extends Error {
  constructor(name: string) {
    super(`${name} is not set`);
    this.name = "FileStoreNotConfiguredError";
  }
}

export const BLOB_TOKEN_VAR = "COMPANION_BLOB_TOKEN";

/**
 * Vercel Blob private store. Uses ITS OWN token (COMPANION_BLOB_TOKEN). The
 * default BLOB_READ_WRITE_TOKEN belongs to the existing PUBLIC store used by
 * app/api/upload/route.ts and is never read here. Missing token fails closed.
 */
export class VercelBlobFileStore implements FileStore {
  private async sdk() {
    return await import("@vercel/blob");
  }

  private token(): string {
    const t = env(BLOB_TOKEN_VAR);
    if (!t) {
      console.error(`[companion] ${BLOB_TOKEN_VAR} is not set: downloads are disabled until the private store token is added`);
      throw new FileStoreNotConfiguredError(BLOB_TOKEN_VAR);
    }
    return t;
  }

  async head(key: string): Promise<FileHead | null> {
    const { head, BlobNotFoundError } = await this.sdk();
    try {
      const h = await head(key, { token: this.token() });
      return { size: h.size, contentType: h.contentType || "application/zip", etag: h.etag ?? null };
    } catch (err) {
      if (err instanceof BlobNotFoundError) return null;
      throw err;
    }
  }

  async getStream(key: string): Promise<FileStream | null> {
    const { get } = await this.sdk();
    const res = await get(key, { access: "private", token: this.token() });
    if (!res || res.statusCode !== 200) return null;
    return {
      stream: res.stream,
      head: { size: res.blob.size, contentType: res.blob.contentType || "application/zip", etag: res.blob.etag ?? null },
    };
  }
}

/** Env var NAMES: COMPANION_FILE_KEY (default below), COMPANION_BLOB_TOKEN (private store only). */
export const DEFAULT_FILE_KEY = "companion/TheEditCompanion.zip";
export const DOWNLOAD_FILENAME = "TheEditCompanion.zip";

export function fileKey(): string {
  return env("COMPANION_FILE_KEY") || DEFAULT_FILE_KEY;
}

export function createDefaultFileStore(): FileStore {
  return new VercelBlobFileStore();
}
