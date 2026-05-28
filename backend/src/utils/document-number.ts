export const nextDocumentNumber = (prefix: string, currentCount: number) => {
  const numeric = String(currentCount + 1).padStart(4, "0");
  return `${prefix}-${numeric}`;
};
