export function configureNeighborhoodCamera(scene, target) {
  scene.cameras.main.setBounds(0, 0, 1600, 1000);
  scene.cameras.main.startFollow(target, true, 0.08, 0.08);
  scene.cameras.main.setZoom(1);
}
