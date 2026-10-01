import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve, basename } from "node:path";

const extensions = Object.freeze({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" });

export class LocalImageStorage {
  constructor({ directory = resolve(process.cwd(), "uploads") } = {}) {
    this.directory = directory;
  }

  async save({ buffer, mimeType, fileName }) {
    await mkdir(this.directory, { recursive: true });
    let originalName = String(fileName ?? "image");
    try { originalName = decodeURIComponent(originalName); } catch { /* Keep the literal header value. */ }
    const safeName = basename(originalName).replace(/[\0-\x1f<>:"/\\|?*]/g, "_").slice(0, 255) || "image";
    const storageKey = randomUUID() + extensions[mimeType];
    await writeFile(join(this.directory, storageKey), buffer, { flag: "wx" });
    return { fileName: safeName, storageKey };
  }

  async remove(storageKey) {
    await unlink(join(this.directory, basename(storageKey))).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
