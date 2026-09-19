// Ambiguous characters (0/O, 1/I) are excluded so a code is easy to read aloud.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateJoinCode = (length = 6) =>
  Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export default generateJoinCode;
