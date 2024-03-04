import bcrypt from "bcrypt"
const saltRounds = 10;

export async function hashPassword(password) {
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password_input, stored_user_pw) {
  return bcrypt.compare(password_input, stored_user_pw);
}