// Series-circuit math (Ohm's law) for the e-bike powertrain. Teaching model:
// the load resistance represents road demand; the controller limits current.
export function computeCircuit({ battery, controller, motor, load }) {
  const Rtotal = battery.R + controller.R + motor.winding + load.R;
  const V = battery.voltage;
  const Iideal = V / Rtotal;
  const limited = Iideal > controller.currentLimit;
  const I = Math.min(Iideal, controller.currentLimit);
  const Ptotal = V * I;
  const Puseful = I * I * load.R; // power delivered to the road
  const Ploss = I * I * (battery.R + controller.R + motor.winding);
  const efficiency = Ptotal > 0 ? (Puseful / Ptotal) * 100 : 0;
  return {
    Rtotal: Number(Rtotal.toFixed(3)),
    V,
    I: Number(I.toFixed(2)),
    Iideal: Number(Iideal.toFixed(2)),
    limited,
    Ptotal: Math.round(Ptotal),
    Puseful: Math.round(Puseful),
    Ploss: Math.round(Ploss),
    efficiency: Math.round(efficiency),
    motorRated: motor.rated,
    overMotor: Ptotal > motor.rated * 1.15,
  };
}

export function circuitInsight(c, motor) {
  if (c.overMotor) return { label: 'OVER-DRIVEN', color: '#EF4444', icon: 'x', reason: `Drawing ${c.Ptotal} W through a ${motor.rated} W motor — it will overheat. Use a bigger motor or lighter load.` };
  if (c.limited) return { label: 'CURRENT-LIMITED', color: '#EAB308', icon: 'warn', reason: `The controller is capping current at ${c.I} A (the load wants ${c.Iideal} A). A higher-amp controller would deliver more power.` };
  if (c.efficiency >= 70) return { label: 'WELL MATCHED', color: '#22C55E', icon: 'check', reason: `${c.efficiency}% of the ${c.Ptotal} W reaches the road — an efficient, well-matched powertrain.` };
  return { label: 'LOSSY', color: '#EAB308', icon: 'warn', reason: `Only ${c.efficiency}% reaches the road; ${c.Ploss} W is lost as heat in the windings and wiring.` };
}
