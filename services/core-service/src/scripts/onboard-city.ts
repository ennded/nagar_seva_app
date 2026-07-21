// Startup-run CLI, not part of the public API — creates a City and its first Admin.
// Usage: npm run onboard-city -w services/core-service -- --name "Pune" --slug pune --adminName "Asha Patil" --adminMobile "9800000001"
import 'dotenv/config';
import { connectDb } from '../config/db.js';
import { CityModel } from '../models/City.js';
import { UserModel } from '../models/User.js';
import mongoose from 'mongoose';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { name, slug, adminName, adminMobile } = args;
  if (!name || !slug || !adminName || !adminMobile) {
    console.error(
      'Usage: onboard-city -- --name "Pune" --slug pune --adminName "Asha Patil" --adminMobile "9800000001"',
    );
    process.exit(1);
  }

  await connectDb();

  const existingCity = await CityModel.findOne({ slug });
  if (existingCity) {
    console.error(`City with slug "${slug}" already exists (id=${existingCity._id}).`);
    process.exit(1);
  }

  const existingAdmin = await UserModel.findOne({ mobile: adminMobile });
  if (existingAdmin) {
    console.error(`A user with mobile "${adminMobile}" already exists.`);
    process.exit(1);
  }

  const city = await CityModel.create({ name, slug });
  const admin = await UserModel.create({
    name: adminName,
    mobile: adminMobile,
    role: 'admin',
    city: city._id,
  });

  console.log(`Created city "${city.name}" (slug=${city.slug}, id=${city._id})`);
  console.log(`Created admin "${admin.name}" (mobile=${admin.mobile}, id=${admin._id})`);
  console.log(`Admin logs in via requestOtp/verifyOtp with mobile "${adminMobile}".`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
