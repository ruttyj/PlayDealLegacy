import React, { useRef } from "react";
import { extend, useFrame, useThree } from "react-three-fiber";

import { MapControls } from "three/examples/jsm/controls/OrbitControls";

extend({ MapControls });

function Controls(props) {
  const controls = useRef();
  const { camera, gl } = useThree();
  useFrame(() => {
    controls.current.update();
  });

  return (
    <mapControls
      ref={controls}
      args={[camera, gl.domElement]}
      enableDamping={true}
      dampingFactor={0.5}
      autoRotate={false}
      autoRotateSpeed={0.5}
      minDistance={100}
      maxDistance={500}
      maxPolarAngle={((170 / 180) * Math.PI) / 2}
      {...props}
    />
  );
}

export default Controls;
