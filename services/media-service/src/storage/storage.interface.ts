export interface SavedFile {
  url: string;
  key: string;
}

export interface StorageProvider {
  save(buffer: Buffer, filename: string, subdir: string): Promise<SavedFile>;
}
