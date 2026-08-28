const values = new Map();

export async function getItemAsync(key) {
  return values.get(key) ?? null;
}

export async function setItemAsync(key, value) {
  values.set(key, value);
}

export async function deleteItemAsync(key) {
  values.delete(key);
}
