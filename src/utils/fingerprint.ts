type FingerprintItem = {
  name: string;
  category: string;
};

export const generateFingerprint = (item: FingerprintItem): string => {
  return `${item.name}-${item.category}`
    .toLowerCase()
    .replace(/\s/g, '');
};
