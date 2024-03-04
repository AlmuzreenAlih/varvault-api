import bcrypt from "bcrypt"
const saltRounds = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}