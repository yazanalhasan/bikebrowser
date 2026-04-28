import flatTireExplainer from './flatTireExplainer.js';

const EXPLAINERS = {
  [flatTireExplainer.id]: flatTireExplainer,
};

export function getExplainer(id) {
  return EXPLAINERS[id] || null;
}

export default EXPLAINERS;
