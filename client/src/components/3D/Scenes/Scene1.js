import ReactDOM from "react-dom";
import React, { useState } from "react";
import { useFrame } from "react-three-fiber";

import { Canvas } from "react-three-fiber";
import Controls from "../Controls";
import "./scene1.css";

let world = [];
for (let i = 0; i < 1500; i++) {
  world.push(
    <mesh
      key={i}
      position={[Math.random() * 1600 - 800, 0, Math.random() * 1600 - 800]}
      scale={[20, Math.random() * 100 + 10, 20]}
    >
      <boxBufferGeometry
        attach="geometry"
        args={[1, 1, 1]}
        ref={(ref) => ref && ref.translate(0, 0.5, 0)}
      />
      <meshPhongMaterial attach="material" color="#e8e7ee" flatShading={true} />
    </mesh>
  );
}

function Plane() {
  return (
    <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeBufferGeometry
        attach="geometry"
        args={[28000, 28000]}
        ref={(ref) => ref && ref.translate(0, 0.5, 0)}
      />
      <meshPhongMaterial attach="material" color="#760059" flatShading={true} />
    </mesh>
  );
}

function Scene() {
  const [screenSpacePanning, toggle] = useState(false);
  return (
    <Canvas camera={{ position: [400, 300, 0] }}>
      <Controls screenSpacePanning={screenSpacePanning} />
      <fog attach="fog" args={["#0d0149", 0.003, 1000]} />

      <ambientLight color="#fff" />
      {world}
      <Plane />
    </Canvas>
  );
}

export default Scene;
