import vine from '@vinejs/vine'

const userpwSchema = vine.object({
  username: vine.string()
                .minLength(8)
                .maxLength(32),
  password: vine.string()
                .minLength(8)
                .maxLength(32)
});

export function validateUserData(username, password) {
  const data = {username: username, password: password };
  const validator = vine.compile(userpwSchema);
  return validator.validate(data);
}

export function DetectUndefined() {
  for (let i = 0; i < arguments.length; i++) {if (arguments[i] === undefined) {return true;}}
  return false;
}

export function CheckVariableIf(type, value) {
  switch (type) {
      case "numeric":
          return !isNaN(parseFloat(value)) && isFinite(value);
      case "text":
          return typeof value === "string";
      case "boolean":
          return value === "true" || value === "false";
      default:
          return false; // Unsupported type
  }
}