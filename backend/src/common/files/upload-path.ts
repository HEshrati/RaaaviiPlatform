import { mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Returns a directory inside the persistent upload root and creates it when
 * needed. In production UPLOAD_DIR should point at the mounted /app/uploads
 * volume; process.cwd()/uploads is the safe default for both Docker and dev.
 */
export function uploadDirectory(subdirectory?: string): string {
  const root = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  const directory = subdirectory ? join(root, subdirectory) : root;
  mkdirSync(directory, { recursive: true });
  return directory;
}
