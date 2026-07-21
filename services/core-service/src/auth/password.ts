import bcrypt from 'bcryptjs';

// Model's pre-save hook hashes passwordHash automatically on create/update;
// this standalone helper exists for call sites that need a hash without saving a User doc.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 11);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
