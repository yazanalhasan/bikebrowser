export const STANDARDS = {
  drivetrainFamilies: {
    cues: {
      canonical: 'Shimano CUES',
      pullRatio: 'LINKGLIDE',
      aliases: ['cues', 'linkglide', 'rd-u4000', 'rd-u4009', 'rd-u6000'],
    },
    hyperglide: {
      canonical: 'Shimano Hyperglide',
      pullRatio: 'HYPERGLIDE',
      aliases: ['hyperglide', 'deore m592', 'alivio', 'acera', 'altus'],
    },
    sramEagle: {
      canonical: 'SRAM Eagle',
      pullRatio: 'SRAM X-ACTUATION',
      aliases: ['eagle', 'sx eagle', 'nx eagle', 'gx eagle'],
    },
  },
  frameStandards: {
    boostRear: {
      canonical: '12x148 Boost',
      aliases: ['12x148', '148 boost', 'boost rear'],
    },
    boostFront: {
      canonical: '15x110 Boost',
      aliases: ['15x110', '110 boost', 'boost front'],
    },
    udh: {
      canonical: 'SRAM UDH',
      aliases: ['udh', 'universal derailleur hanger'],
    },
  },
  brakeStandards: {
    postMount: {
      canonical: 'post mount',
      aliases: ['post mount', 'pm'],
    },
    hydraulicDisc: {
      canonical: 'hydraulic disc',
      aliases: ['hydraulic', 'disc brake'],
    },
  },
};

export default STANDARDS;
