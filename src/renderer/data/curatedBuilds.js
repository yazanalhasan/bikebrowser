export const CURATED_EBIKE_BUILDS = [
  {
    id: 'bbs02-hardtail-budget',
    name: 'Bafang BBS02 Budget Hardtail Build',
    useCase: ['trail', 'commuter'],
    bikeType: 'hardtail_mtb',
    riderHeightRange: [150, 180],
    compatibility: {
      frame: ['hardtail', 'aluminum'],
      bottomBracket: ['68mm', '73mm threaded'],
      wheelSize: ['27.5', '29'],
    },
    parts: {
      motor: {
        name: 'Bafang BBS02B 750W Mid Drive Kit',
        category: 'motor',
        priority: 'required',
        knownGood: true,
        searchQueries: [
          'Bafang BBS02B 750W 48V mid drive kit',
          'BBS02B 68mm ebike conversion kit',
        ],
      },
      battery: {
        name: '48V 13Ah Hailong Downtube Battery',
        category: 'battery',
        priority: 'required',
        knownGood: true,
        searchQueries: [
          '48V 13Ah Hailong ebike battery',
          '48V downtube lithium ebike battery',
        ],
      },
      brakes: {
        name: 'Shimano MT200 Hydraulic Disc Brakes',
        category: 'brakes',
        priority: 'required',
        knownGood: true,
        searchQueries: [
          'Shimano MT200 brake set front rear',
          'MT200 hydraulic disc brakes MTB',
        ],
      },
      drivetrain: {
        name: 'Shimano 8-speed cassette + derailleur',
        category: 'drivetrain',
        priority: 'recommended',
        knownGood: true,
      },
      safety: {
        name: 'Mid-drive torque arm / stabilizer',
        category: 'safety',
        priority: 'required',
        knownGood: true,
      },
    },
    warnings: [
      'Entry-level frames may not tolerate long-term mid-drive torque',
      'Upgrade brakes before riding trails',
      'Check BB compatibility before purchase',
    ],
    estimatedCost: {
      low: 800,
      high: 1400,
    },
  },
];

export default CURATED_EBIKE_BUILDS;
