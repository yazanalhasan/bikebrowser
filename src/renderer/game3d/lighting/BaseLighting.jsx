// Standard light rig for outdoor screens. Per-location overrides
// (warm garage interior, harsh desert noon, cool mountain dawn)
// will subclass or replace this; default values match the rebuild
// blueprint's warm Sonoran Desert palette.
export default function BaseLighting({
  sunPosition = [8, 12, 6],
  sunIntensity = 1.1,
  sunColor = '#fff1d6',
  ambientIntensity = 0.45,
  hemiSky = '#cfe4ff',
  hemiGround = '#a07a4a',
  hemiIntensity = 0.35,
}) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <hemisphereLight args={[hemiSky, hemiGround, hemiIntensity]} />
      <directionalLight
        position={sunPosition}
        intensity={sunIntensity}
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
    </>
  );
}
