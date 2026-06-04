export function configureNeighborhoodCamera(scene, target) {
  // Follow within the scene's world bounds (the neighbourhood world grew to fit
  // four distinct regions, so read the size from the scene rather than hardcode).
  scene.cameras.main.setBounds(0, 0, scene.worldWidth || 1600, scene.worldHeight || 1000);
  scene.cameras.main.startFollow(target, true, 0.08, 0.08);
  scene.cameras.main.setZoom(1);
}
