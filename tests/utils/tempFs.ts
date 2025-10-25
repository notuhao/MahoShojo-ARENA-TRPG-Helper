import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const TMP_DIR = join(process.cwd(), 'tests/.tmp');

export const ensureTempDir = async () => {
  await fs.mkdir(TMP_DIR, { recursive: true });
  return TMP_DIR;
};

export const writeTempJson = async (filename: string, data: unknown) => {
  const dir = await ensureTempDir();
  const filepath = join(dir, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  return filepath;
};

export const readTempJson = async <T>(filename: string) => {
  const dir = await ensureTempDir();
  const filepath = join(dir, filename);
  const text = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(text) as T;
};
