export const tokenizeSearchText = (value: string): readonly string[] => {
  const uniqueTokens = new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
  );

  return [...uniqueTokens];
};
