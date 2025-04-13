declare module 'three' {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    copy(v: Vector3): this;
    set(x: number, y: number, z: number): this;
  }

  export class Color {
    constructor(r?: number | string, g?: number, b?: number);
    r: number;
    g: number;
    b: number;
    set(color: number | string): this;
    setHSL(h: number, s: number, l: number): this;
    lerpColors(color1: Color, color2: Color, alpha: number): this;
  }

  export class Euler {
    constructor(x?: number, y?: number, z?: number, order?: string);
    x: number;
    y: number;
    z: number;
  }

  export class Object3D {
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    add(...objects: Object3D[]): this;
    remove(...objects: Object3D[]): this;
    lookAt(x: number | Vector3, y?: number, z?: number): void;
    traverse(callback: (object: Object3D) => void): void;
    castShadow: boolean;
    receiveShadow: boolean;
  }

  export class Group extends Object3D {
    constructor();
  }

  export class Scene extends Object3D {
    constructor();
    fog: Fog | null;
    background: Color | Texture | null;
  }

  export class Camera extends Object3D {
    constructor();
    aspect: number;
    fov: number;
    near: number;
    far: number;
    updateProjectionMatrix(): void;
  }

  export class PerspectiveCamera extends Camera {
    constructor(fov: number, aspect: number, near: number, far: number);
  }

  export class Clock {
    constructor(autoStart?: boolean);
    start(): void;
    stop(): void;
    getDelta(): number;
    getElapsedTime(): number;
    running: boolean;
  }

  export interface WebGLRendererParameters {
    canvas?: HTMLCanvasElement;
    alpha?: boolean;
    antialias?: boolean;
  }

  export class WebGLRenderer {
    constructor(parameters?: WebGLRendererParameters);
    domElement: HTMLCanvasElement;
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
    dispose(): void;
    setPixelRatio(value: number): void;
    outputEncoding: number;
    shadowMap: {
      enabled: boolean;
      type: number;
    };
  }

  export class Geometry {
    constructor();
    dispose(): void;
  }

  export class BufferGeometry {
    constructor();
    dispose(): void;
    setAttribute(name: string, attribute: BufferAttribute): this;
    attributes: any;
  }

  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean);
    needsUpdate: boolean;
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width: number, height: number, depth: number);
  }

  export class SphereGeometry extends BufferGeometry {
    constructor(radius: number, widthSegments?: number, heightSegments?: number);
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width: number, height: number, widthSegments?: number, heightSegments?: number);
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(radiusTop: number, radiusBottom: number, height: number, radialSegments?: number);
  }

  export interface MaterialParameters {
    color?: number | string;
    opacity?: number;
    transparent?: boolean;
    side?: number;
  }

  export class Material {
    constructor();
    dispose(): void;
    transparent: boolean;
    opacity: number;
    side: number;
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: MaterialParameters & { color?: number | string });
    color: Color;
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: MaterialParameters & { 
      roughness?: number;
      metalness?: number;
    });
    color: Color;
    roughness: number;
    metalness: number;
  }

  export class ShaderMaterial extends Material {
    constructor(parameters?: {
      uniforms?: any;
      vertexShader?: string;
      fragmentShader?: string;
    });
    uniforms: any;
  }

  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material | Material[]);
    geometry: BufferGeometry;
    material: Material | Material[];
  }

  export class Points extends Object3D {
    constructor(geometry?: BufferGeometry, material?: PointsMaterial);
    geometry: BufferGeometry;
    material: PointsMaterial;
  }

  export class PointsMaterial extends Material {
    constructor(parameters?: {
      color?: number | string;
      size?: number;
      sizeAttenuation?: boolean;
      map?: Texture;
      alphaMap?: Texture;
      transparent?: boolean;
      opacity?: number;
      blending?: number;
    });
    size: number;
    sizeAttenuation: boolean;
  }

  export class Light extends Object3D {
    constructor(color?: number | string, intensity?: number);
    color: Color;
    intensity: number;
    castShadow: boolean;
    shadow: {
      mapSize: {
        width: number;
        height: number;
      };
    };
  }

  export class AmbientLight extends Light {
    constructor(color?: number | string, intensity?: number);
  }

  export class DirectionalLight extends Light {
    constructor(color?: number | string, intensity?: number);
    position: Vector3;
    target: Object3D;
  }

  export class PointLight extends Light {
    constructor(color?: number | string, intensity?: number, distance?: number, decay?: number);
    distance: number;
    decay: number;
  }

  export class Texture {
    constructor(image?: any);
    image: any;
    needsUpdate: boolean;
    dispose(): void;
  }

  export class AnimationMixer {
    constructor(root: any);
    update(deltaTime: number): void;
  }

  export class Fog {
    constructor(color: number | string, near?: number, far?: number);
    color: Color;
    near: number;
    far: number;
  }

  export const PCFSoftShadowMap: number;
  export const sRGBEncoding: number;
  export const BackSide: number;
  export const AdditiveBlending: number;
}

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, WebGLRenderer } from 'three';

  export class OrbitControls {
    constructor(camera: Camera, domElement: HTMLElement);
    target: THREE.Vector3;
    update(): void;
  }
}