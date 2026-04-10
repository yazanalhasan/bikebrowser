import type { ProjectItem } from '../types/project';

export type CompatibilityRuleResult = {
  type: 'error' | 'warning';
  message: string;
};

type CompatibilityRule = {
  name: string;
  check: (a?: ProjectItem, b?: ProjectItem) => CompatibilityRuleResult | null;
};

export const compatibilityRules: CompatibilityRule[] = [
  {
    name: 'Voltage Match',
    check: (battery, controller) => {
      if (!battery?.specs?.voltage || !controller?.specs?.voltage) return null;

      return battery.specs.voltage === controller.specs.voltage
        ? null
        : {
            type: 'error',
            message: `Voltage mismatch: Battery (${battery.specs.voltage}V) vs Controller (${controller.specs.voltage}V)`,
          };
    },
  },
  {
    name: 'Controller Current Limit',
    check: (battery, controller) => {
      if (!battery?.specs?.maxCurrent || !controller?.specs?.maxCurrent) return null;

      return battery.specs.maxCurrent >= controller.specs.maxCurrent
        ? null
        : {
            type: 'error',
            message: 'Battery current too low for controller',
          };
    },
  },
  {
    name: 'Motor Power Compatibility',
    check: (motor, controller) => {
      if (!motor?.specs?.power || !controller?.specs?.power) return null;

      return controller.specs.power >= motor.specs.power
        ? null
        : {
            type: 'warning',
            message: 'Controller underpowered for motor',
          };
    },
  },
];

export default compatibilityRules;
