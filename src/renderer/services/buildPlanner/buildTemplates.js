export const BUILD_TEMPLATES = {
  ebike_conversion: [
    'frame',
    'motor',
    'battery',
    'controller',
    'display',
    'brakes',
    'drivetrain check',
    'torque arm',
    'mounting hardware',
  ],
  trail_upgrade: [
    'suspension',
    'tires',
    'brakes',
    'drivetrain',
    'cockpit',
  ],
  kids_safe_build: [
    'frame size fit',
    'brakes',
    'speed limitation',
    'protective gear',
    'stability',
  ],
};

export function getTemplateChecklist(projectType) {
  return BUILD_TEMPLATES[projectType] || [];
}

export function getTemplateOptions() {
  return [
    { value: 'ebike_conversion', label: 'E-Bike Conversion' },
    { value: 'trail_upgrade', label: 'Trail Upgrade' },
    { value: 'kids_safe_build', label: 'Kids Safe Build' },
  ];
}
