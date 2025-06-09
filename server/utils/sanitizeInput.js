const safeField = (value) => {
  if (typeof value === "string" && value.trim() === "") return null;
  return value ?? null;
};

const safeArray = (value) =>
  Array.isArray(value) && value.length ? value : [];

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age >= 0 ? age : null;
};

module.exports = { safeField, safeArray, calculateAge };
