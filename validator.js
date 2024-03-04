import vine from '@vinejs/vine'

const userpwSchema = vine.object({
  username: vine.string().minLength(8).maxLength(32),
  password: vine.string().minLength(8).maxLength(32)
});

export function validateUserData(username, password) {
  const data = {username: username, password: password };
  const validator = vine.compile(userpwSchema);
  return validator.validate(data);
}