function normalizeCategoryKey(category) {
  const value = String(category || '').toLowerCase();

  if (value.includes('motor') || value.includes('drive')) {
    return 'motor';
  }

  if (value.includes('battery') || value.includes('power')) {
    return 'battery';
  }

  if (value.includes('brake')) {
    return 'brakes';
  }

  if (value.includes('drivetrain') || value.includes('cassette') || value.includes('freewheel')) {
    return 'drivetrain';
  }

  return 'general';
}

export const KNOWN_PRODUCTS = {
  motor: [
    {
      name: 'Bafang BBS02B 750W Mid-Drive Kit',
      url: 'https://www.ebay.com/sch/i.html?_nkw=bafang+bbs02b+750w+mid+drive+kit',
      priceRange: '$500-$700',
    },
    {
      name: 'CYC Photon Mid-Drive Conversion Kit',
      url: 'https://www.ebay.com/sch/i.html?_nkw=cyc+photon+mid+drive+kit',
      priceRange: '$700-$1100',
    },
  ],
  battery: [
    {
      name: '48V Hailong Downtube Battery Pack',
      url: 'https://www.ebay.com/sch/i.html?_nkw=48v+hailong+downtube+battery',
      priceRange: '$250-$450',
    },
    {
      name: '52V Hailong Battery (13Ah-20Ah)',
      url: 'https://www.ebay.com/sch/i.html?_nkw=52v+hailong+battery',
      priceRange: '$320-$550',
    },
  ],
  brakes: [
    {
      name: 'Shimano MT200 Hydraulic Brake Set',
      url: 'https://www.amazon.com/s?k=shimano+mt200+brake+set',
      priceRange: '$80-$150',
    },
    {
      name: 'Shimano MT201 Hydraulic Disc Brakes',
      url: 'https://www.amazon.com/s?k=shimano+mt201+hydraulic+disc+brake',
      priceRange: '$90-$170',
    },
  ],
  drivetrain: [
    {
      name: 'Shimano 7-Speed Freewheel 14-28T',
      url: 'https://www.ebay.com/sch/i.html?_nkw=shimano+7+speed+freewheel+14-28t',
      priceRange: '$20-$45',
    },
    {
      name: 'KMC eBike Chain 7/8-Speed',
      url: 'https://www.amazon.com/s?k=kmc+ebike+chain+7+8+speed',
      priceRange: '$25-$60',
    },
  ],
  general: [],
};

export function getKnownGoodProducts(part) {
  const key = normalizeCategoryKey(part?.category);
  return KNOWN_PRODUCTS[key] || [];
}

export default {
  KNOWN_PRODUCTS,
  getKnownGoodProducts,
};
