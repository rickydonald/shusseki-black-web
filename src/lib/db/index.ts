import { DATABASE_URL } from '$env/static/private';
import { drizzle } from "drizzle-orm/mysql2";
import 'dotenv/config';

const db = drizzle(DATABASE_URL!);

export default db;