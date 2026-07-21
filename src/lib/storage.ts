import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

export interface StorageService {
  /** Persists a file and returns its storage key or Blob URL. */
  save(buffer: Buffer, originalName: string, contentType?: string): Promise<string>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Strips path fragments and dangerous characters from a client filename. */
export function sanitizeFileName(name: string): string {
  const base = path.basename(name).normalize("NFKD");
  return (
    base
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[.-]+|[.-]+$/g, "")
      .slice(0, 120) || "archivo"
  );
}

function storageKey(originalName: string): string {
  const safe = sanitizeFileName(originalName);
  return `evidencias/${new Date().getFullYear()}/${randomBytes(12).toString("hex")}-${safe}`;
}

class LocalStorageService implements StorageService {
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(path.resolve(this.root) + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async save(buffer: Buffer, originalName: string): Promise<string> {
    const key = storageKey(originalName);
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buffer);
    return key;
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolve(key)).catch(() => {
      // Already gone: deletion is idempotent.
    });
  }
}

class VercelBlobStorageService implements StorageService {
  async save(buffer: Buffer, originalName: string, contentType?: string): Promise<string> {
    const blob = await put(storageKey(originalName), buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });
    return blob.url;
  }

  async read(key: string): Promise<Buffer> {
    const response = await fetch(key);
    if (!response.ok) {
      throw new Error(`Unable to read evidence blob: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await del(key).catch(() => {
      // Already gone: deletion is idempotent.
    });
  }
}

function createStorage(): StorageService {
  const useBlob =
    process.env.STORAGE_DRIVER === "vercel-blob" ||
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) ||
    process.env.VERCEL === "1";

  if (useBlob) {
    return new VercelBlobStorageService();
  }

  return new LocalStorageService(process.env.UPLOAD_DIR ?? "./data/uploads");
}

export const storage: StorageService = createStorage();
