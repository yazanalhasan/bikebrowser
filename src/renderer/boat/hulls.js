// Hull configs for the hydro tank (Ch 5). roughness (0–1) adjusts drag.
export const HULLS = [
  { id: 'v_hull_aluminum_dinghy', name: 'V-Hull Aluminum Dinghy', length: 4.2, beam: 1.6, draft_max: 0.45, displacement_kg: 320, hull_form: 'v_hull', color: '#94a3b8', drag_coefficient: 0.042, wetted_area_m2: 5.8, maxTowSpeed: 12, roughness: 0.2 },
  { id: 'flat_bottom_fiberglass_skiff', name: 'Flat-Bottom Fiberglass Skiff', length: 5.0, beam: 1.9, draft_max: 0.3, displacement_kg: 410, hull_form: 'flat_bottom', color: '#e2e8f0', drag_coefficient: 0.078, wetted_area_m2: 8.1, maxTowSpeed: 8, roughness: 0.3 },
  { id: 'cfrp_racing_cat', name: 'CFRP Racing Catamaran', length: 6.5, beam: 3.2, draft_max: 0.25, displacement_kg: 280, hull_form: 'catamaran', color: '#1e293b', drag_coefficient: 0.031, wetted_area_m2: 6.4, maxTowSpeed: 22, roughness: 0.15 },
  { id: 'wooden_dory', name: 'Wooden Dory', length: 4.8, beam: 1.5, draft_max: 0.55, displacement_kg: 520, hull_form: 'v_hull', color: '#92400e', drag_coefficient: 0.065, wetted_area_m2: 7.2, maxTowSpeed: 7, roughness: 0.45 },
];
export const getHullById = (id) => HULLS.find((h) => h.id === id) || HULLS[0];
