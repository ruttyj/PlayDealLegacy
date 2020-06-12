import ReactDOM from "react-dom";
import React, { useState } from "react";
import { useFrame } from "react-three-fiber";

import { Canvas } from "react-three-fiber";
import Controls from "../Controls";
import "./style.css";

let scale = 3;
let world = [];

//Draw deck
for (let i = 0; i < 7; i++) {
  world.push(
    <mesh
      key={i}
      position={[0, i * 1, -80]}
      scale={[3 * scale, 0.1, 4.5 * scale]}
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

//Draw deck
for (let i = 0; i < 4; i++) {
  world.push(
    <mesh
      key={i}
      position={[10, i * 1, -80]}
      scale={[3 * scale, 0.1, 4.5 * scale]}
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

for (let i = 0; i < 7; i++) {
  world.push(
    <mesh
      key={i}
      position={[-40 + i * 15, 0, -40]}
      scale={[3 * scale, 0.1, 4.5 * scale]}
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

//Draw deck
for (let i = 0; i < 4; i++) {
  world.push(
    <mesh
      key={i}
      position={[80, i * 1, -40]}
      scale={[3 * scale, 0.1, 4.5 * scale]}
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
    <Canvas camera={{ position: [0, 20, 0] }}>
      <Controls screenSpacePanning={screenSpacePanning} />
      <fog attach="fog" args={["#0d0149", 0.003, 1000]} />

      <ambientLight color="#fff" />
      {world}
      <Plane />
    </Canvas>
  );
}

export default Scene;
