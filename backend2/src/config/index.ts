import 'dotenv/config'

export const jwt_secret = process.env.JWT_SECRET ?? "jwt_secret"
export const db_url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/sql-assignment"
export const access_key = process.env.ACCESS_KEY;
