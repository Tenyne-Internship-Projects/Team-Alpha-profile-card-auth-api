//@ Helper function to clean and safely return a string field
const safeField = (field) => {
  if (typeof field !== "string") return null; // If it's not a string, return null
  const trimmed = field.trim(); // Remove spaces at the beginning and end
  //@ If the string starts and ends with double quotes, remove them
  return trimmed.startsWith('"') && trimmed.endsWith('"')
    ? trimmed.slice(1, -1)
    : trimmed; // Otherwise, return the trimmed string as is
};

//@ Helper function to return an array only if it's a non-empty array
const safeArray = (value) =>
  Array.isArray(value) && value.length ? value : []; // Return an empty array if it's not a valid one

//@ Helper function to calculate a user's age from their date of birth
const calculateAge = (dob) => {
  if (!dob) return null; // If no date is provided, return null
  const birthDate = new Date(dob); // Convert dob string to Date object
  const diff = Date.now() - birthDate.getTime(); // Get time difference from now
  const age = new Date(diff).getUTCFullYear() - 1970; // Convert time difference to age
  return age >= 0 ? age : null;
};
//@ Export the helper functions so they can be used in other files
module.exports = { safeField, safeArray, calculateAge };
