import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * TavernScene - Manages the 3D environment for the fantasy tavern
 * Uses Three.js for rendering the background and interactive elements
 */
export class TavernScene {
  // Core Three.js components
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private controls: OrbitControls | null = null;
  
  // Scene elements
  private lights: {
    ambient: THREE.AmbientLight;
    fireplace: THREE.PointLight;
    candles: THREE.PointLight[];
    mainLight: THREE.DirectionalLight;
  };
  
  // Animation elements
  private animationFrameId: number | null = null;
  private animationMixers: THREE.AnimationMixer[] = [];
  private particleSystems: THREE.Points[] = [];
  
  // Scene objects
  private tavernObjects: Record<string, THREE.Object3D> = {};
  private isInitialized: boolean = false;
  private debugMode: boolean = false;
  
  // Environment settings
  private time: number = 0;  // 0-24 hours
  private weather: 'clear' | 'rain' | 'storm' = 'clear';
  private weatherIntensity: number = 0;
  
  // Container dimensions
  private containerWidth: number = 800;
  private containerHeight: number = 600;
  
  constructor() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.containerWidth / this.containerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // Transparent background to allow CSS background to show
    });
    this.clock = new THREE.Clock();
    
    // Setup basic lighting
    this.lights = {
      ambient: new THREE.AmbientLight(0x404040, 1.5),
      fireplace: new THREE.PointLight(0xff6600, 1.5, 10, 2),
      candles: [],
      mainLight: new THREE.DirectionalLight(0xffffff, 0.8)
    };
    
    // Set default camera position
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 1, 0);
    
    // Configure renderer
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
  }
  
  /**
   * Initialize the 3D scene with the given container element
   * @param container - DOM element to contain the 3D scene
   * @param debug - Whether to enable debug controls
   */
  initialize(container: HTMLElement, debug: boolean = false): void {
    if (this.isInitialized) return;
    
    this.debugMode = debug;
    this.containerWidth = container.clientWidth;
    this.containerHeight = container.clientHeight;
    
    // Update camera aspect ratio
    this.camera.aspect = this.containerWidth / this.containerHeight;
    this.camera.updateProjectionMatrix();
    
    // Configure renderer size
    this.renderer.setSize(this.containerWidth, this.containerHeight);
    
    // Add the renderer canvas to the container
    container.appendChild(this.renderer.domElement);
    
    // Add event listener for window resize
    window.addEventListener('resize', this.handleResize);
    
    // Enable debug controls if requested
    if (debug) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.target.set(0, 1, 0);
      this.controls.update();
    }
    
    // Setup basic scene
    this.setupBasicScene();
    
    // Start animation loop
    this.startAnimationLoop();
    
    this.isInitialized = true;
  }
  
  /**
   * Clean up resources when the scene is no longer needed
   */
  dispose(): void {
    if (!this.isInitialized) return;
    
    // Stop animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Remove event listener
    window.removeEventListener('resize', this.handleResize);
    
    // Dispose of Three.js resources
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => this.disposeMaterial(material));
          } else {
            this.disposeMaterial(object.material);
          }
        }
      }
    });
    
    // Dispose of the renderer
    this.renderer.dispose();
    
    // Remove canvas from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    
    this.isInitialized = false;
  }
  
  /**
   * Helper to dispose of Three.js materials properly
   * @param material - Material to dispose
   */
  private disposeMaterial(material: THREE.Material): void {
    material.dispose();
    
    // Dispose textures
    for (const key in material) {
      const value = (material as any)[key];
      if (value instanceof THREE.Texture) {
        value.dispose();
      }
    }
  }
  
  /**
   * Handle window resize events
   */
  private handleResize = (): void => {
    if (!this.isInitialized || !this.renderer.domElement.parentNode) return;
    
    const container = this.renderer.domElement.parentNode as HTMLElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.containerWidth = width;
    this.containerHeight = height;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  };
  
  /**
   * Setup the basic tavern scene with floor, walls, etc.
   */
  private setupBasicScene(): void {
    // Add lights to the scene
    this.scene.add(this.lights.ambient);
    
    // Setup directional light
    this.lights.mainLight.position.set(5, 10, 7.5);
    this.lights.mainLight.castShadow = true;
    this.lights.mainLight.shadow.mapSize.width = 2048;
    this.lights.mainLight.shadow.mapSize.height = 2048;
    this.scene.add(this.lights.mainLight);
    
    // Setup fireplace light
    this.lights.fireplace.position.set(-3, 1, -2);
    this.scene.add(this.lights.fireplace);
    
    // Create a simple floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.tavernObjects['floor'] = floor;
    
    // Add basic walls
    this.createWalls();
    
    // Add the bar counter
    this.createBarCounter();
    
    // Add some tables and chairs
    this.createFurniture();
    
    // Add fireplace
    this.createFireplace();
    
    // Add a skybox (simple color gradient background)
    this.createSkybox();
    
    // Add some particle systems (dust, smoke)
    this.createParticles();
  }
  
  /**
   * Create basic walls for the tavern
   */
  private createWalls(): void {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(20, 5, 0.2);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 2.5, -10);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.scene.add(backWall);
    this.tavernObjects['backWall'] = backWall;
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(0.2, 5, 20);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-10, 2.5, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);
    this.tavernObjects['leftWall'] = leftWall;
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(0.2, 5, 20);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(10, 2.5, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);
    this.tavernObjects['rightWall'] = rightWall;
  }
  
  /**
   * Create the bar counter
   */
  private createBarCounter(): void {
    const counterMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.7,
      metalness: 0.2
    });
    
    // Counter top
    const counterTopGeometry = new THREE.BoxGeometry(6, 0.2, 1.5);
    const counterTop = new THREE.Mesh(counterTopGeometry, counterMaterial);
    counterTop.position.set(0, 1, -7);
    counterTop.castShadow = true;
    counterTop.receiveShadow = true;
    this.scene.add(counterTop);
    this.tavernObjects['counterTop'] = counterTop;
    
    // Counter front
    const counterFrontGeometry = new THREE.BoxGeometry(6, 1, 0.2);
    const counterFront = new THREE.Mesh(counterFrontGeometry, counterMaterial);
    counterFront.position.set(0, 0.5, -6.25);
    counterFront.castShadow = true;
    counterFront.receiveShadow = true;
    this.scene.add(counterFront);
    this.tavernObjects['counterFront'] = counterFront;
  }
  
  /**
   * Create tables and chairs
   */
  private createFurniture(): void {
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const chairMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Create a few tables
    const tablePositions = [
      { x: -3, z: 0 },
      { x: 3, z: 0 },
      { x: 0, z: 3 }
    ];
    
    tablePositions.forEach((pos, index) => {
      // Table
      const tableGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 16);
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(pos.x, 0.8, pos.z);
      table.castShadow = true;
      table.receiveShadow = true;
      this.scene.add(table);
      this.tavernObjects[`table_${index}`] = table;
      
      // Table leg
      const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
      const leg = new THREE.Mesh(legGeometry, tableMaterial);
      leg.position.set(pos.x, 0.4, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.scene.add(leg);
      this.tavernObjects[`table_leg_${index}`] = leg;
      
      // Add chairs around each table
      for (let c = 0; c < 4; c++) {
        const angle = (c * Math.PI / 2);
        const chairX = pos.x + Math.cos(angle) * 1.5;
        const chairZ = pos.z + Math.sin(angle) * 1.5;
        
        // Chair seat
        const chairSeatGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
        const chairSeat = new THREE.Mesh(chairSeatGeometry, chairMaterial);
        chairSeat.position.set(chairX, 0.5, chairZ);
        chairSeat.castShadow = true;
        chairSeat.receiveShadow = true;
        this.scene.add(chairSeat);
        this.tavernObjects[`chair_seat_${index}_${c}`] = chairSeat;
        
        // Chair leg
        const chairLegGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const chairLeg = new THREE.Mesh(chairLegGeometry, chairMaterial);
        chairLeg.position.set(chairX, 0.25, chairZ);
        chairLeg.castShadow = true;
        chairLeg.receiveShadow = true;
        this.scene.add(chairLeg);
        this.tavernObjects[`chair_leg_${index}_${c}`] = chairLeg;
        
        // Chair back (except for bar stools)
        if (index !== 2) { // Skip for the table near the bar
          const chairBackGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
          const chairBack = new THREE.Mesh(chairBackGeometry, chairMaterial);
          chairBack.position.set(
            chairX + Math.cos(angle) * 0.4,
            0.8,
            chairZ + Math.sin(angle) * 0.4
          );
          chairBack.rotation.y = angle;
          chairBack.castShadow = true;
          chairBack.receiveShadow = true;
          this.scene.add(chairBack);
          this.tavernObjects[`chair_back_${index}_${c}`] = chairBack;
        }
      }
    });
  }
  
  /**
   * Create the fireplace
   */
  private createFireplace(): void {
    const fireplaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.2
    });
    
    // Fireplace base
    const baseGeometry = new THREE.BoxGeometry(3, 1, 1);
    const base = new THREE.Mesh(baseGeometry, fireplaceMaterial);
    base.position.set(-7, 0.5, -9);
    base.castShadow = true;
    base.receiveShadow = true;
    this.scene.add(base);
    this.tavernObjects['fireplace_base'] = base;
    
    // Fireplace sides
    const sideGeometry = new THREE.BoxGeometry(0.5, 2, 1);
    const leftSide = new THREE.Mesh(sideGeometry, fireplaceMaterial);
    leftSide.position.set(-8.25, 1.5, -9);
    leftSide.castShadow = true;
    leftSide.receiveShadow = true;
    this.scene.add(leftSide);
    this.tavernObjects['fireplace_left'] = leftSide;
    
    const rightSide = new THREE.Mesh(sideGeometry, fireplaceMaterial);
    rightSide.position.set(-5.75, 1.5, -9);
    rightSide.castShadow = true;
    rightSide.receiveShadow = true;
    this.scene.add(rightSide);
    this.tavernObjects['fireplace_right'] = rightSide;
    
    // Fireplace top
    const topGeometry = new THREE.BoxGeometry(3, 0.5, 1);
    const top = new THREE.Mesh(topGeometry, fireplaceMaterial);
    top.position.set(-7, 2.75, -9);
    top.castShadow = true;
    top.receiveShadow = true;
    this.scene.add(top);
    this.tavernObjects['fireplace_top'] = top;
    
    // Add the flickering light
    this.lights.fireplace.position.set(-7, 1, -8.5);
    
    // Add logs
    const logMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 1.0,
      metalness: 0.0
    });
    
    const logGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    
    const log1 = new THREE.Mesh(logGeometry, logMaterial);
    log1.position.set(-7.2, 0.7, -9);
    log1.rotation.z = Math.PI / 8;
    log1.rotation.x = Math.PI / 2;
    log1.castShadow = true;
    log1.receiveShadow = true;
    this.scene.add(log1);
    this.tavernObjects['fireplace_log1'] = log1;
    
    const log2 = new THREE.Mesh(logGeometry, logMaterial);
    log2.position.set(-6.8, 0.7, -9);
    log2.rotation.z = -Math.PI / 7;
    log2.rotation.x = Math.PI / 2;
    log2.castShadow = true;
    log2.receiveShadow = true;
    this.scene.add(log2);
    this.tavernObjects['fireplace_log2'] = log2;
  }
  
  /**
   * Create a simple skybox
   */
  private createSkybox(): void {
    // Create a large sphere to act as the sky
    const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
    const skyMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      side: THREE.BackSide
    });
    
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
    this.tavernObjects['sky'] = sky;
  }
  
  /**
   * Create particle systems for atmospheric effects
   */
  private createParticles(): void {
    // Create dust particles
    const particleCount = 500;
    const particles = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 15;
      particlePositions[i3 + 1] = Math.random() * 4 + 0.1;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 15;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xCCCCCC,
      size: 0.03,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    this.scene.add(particleSystem);
    this.particleSystems.push(particleSystem);
    this.tavernObjects['dust_particles'] = particleSystem;
  }
  
  /**
   * Start the animation loop
   */
  private startAnimationLoop(): void {
    const animate = (): void => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      // Calculate time delta
      const delta = this.clock.getDelta();
      
      // Update animation mixers
      this.animationMixers.forEach(mixer => mixer.update(delta));
      
      // Update fireplace light (flicker effect)
      const flickerIntensity = 1.5 + Math.sin(Date.now() * 0.01) * 0.3 + Math.random() * 0.2;
      this.lights.fireplace.intensity = flickerIntensity;
      
      // Update particle systems
      this.updateParticles(delta);
      
      // Update debug controls if enabled
      if (this.controls) {
        this.controls.update();
      }
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
  }
  
  /**
   * Update particle systems
   * @param delta - Time delta from the clock
   */
  private updateParticles(delta: number): void {
    // Make dust particles move slightly
    if (this.tavernObjects['dust_particles']) {
      const dustParticles = this.tavernObjects['dust_particles'] as THREE.Points;
      const positions = dustParticles.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin((Date.now() + i) * 0.001) * 0.001;
        
        // Wrap particles that go too high or too low
        if (positions[i + 1] > 5) positions[i + 1] = 0.1;
        if (positions[i + 1] < 0) positions[i + 1] = 5;
      }
      
      dustParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  /**
   * Set the time of day to change lighting
   * @param hour - Hour of the day (0-24)
   */
  setTimeOfDay(hour: number): void {
    this.time = Math.max(0, Math.min(24, hour));
    
    // Calculate normalized time (0-1)
    const normalizedTime = this.time / 24;
    
    // Update sky colors based on time
    if (this.tavernObjects['sky']) {
      const skyMaterial = this.tavernObjects['sky'].material as THREE.ShaderMaterial;
      
      if (this.time >= 6 && this.time <= 18) {
        // Daytime
        const dayProgress = (this.time - 6) / 12; // 0 at sunrise, 1 at sunset
        const sunColor = new THREE.Color().setHSL(0.1, 0.5, 0.8 - dayProgress * 0.3);
        
        skyMaterial.uniforms.topColor.value = new THREE.Color().setHSL(0.6, 0.8, 0.7 - dayProgress * 0.2);
        skyMaterial.uniforms.bottomColor.value = sunColor;
      } else {
        // Nighttime
        skyMaterial.uniforms.topColor.value = new THREE.Color(0x000022);
        skyMaterial.uniforms.bottomColor.value = new THREE.Color(0x110022);
      }
    }
    
    // Update ambient light intensity based on time
    const ambientIntensity = this.time >= 6 && this.time <= 18 
      ? 1.5 - Math.abs((this.time - 12) / 12) * 0.7 // Higher at noon, lower at sunrise/sunset
      : 0.3; // Low at night
    this.lights.ambient.intensity = ambientIntensity;
    
    // Update main directional light (sun/moon)
    const angle = normalizedTime * Math.PI * 2 - Math.PI / 2;
    this.lights.mainLight.position.set(
      Math.cos(angle) * 10,
      Math.sin(angle) * 10 + 5,
      7.5
    );
    
    // Adjust main light intensity and color based on time
    if (this.time >= 6 && this.time <= 18) {
      // Daytime - brighter sun
      this.lights.mainLight.intensity = 0.8 - Math.abs((this.time - 12) / 12) * 0.3;
      this.lights.mainLight.color.set(0xffffff);
    } else {
      // Nighttime - dimmer, bluer moonlight
      this.lights.mainLight.intensity = 0.1;
      this.lights.mainLight.color.set(0x8888ff);
    }
  }
  
  /**
   * Set weather conditions
   * @param type - Type of weather
   * @param intensity - Intensity from 0 (none) to 1 (extreme)
   */
  setWeather(type: 'clear' | 'rain' | 'storm', intensity: number = 0.5): void {
    intensity = Math.max(0, Math.min(1, intensity));
    this.weather = type;
    this.weatherIntensity = intensity;
    
    // Adjust skybox based on weather
    if (this.tavernObjects['sky']) {
      const skyMaterial = this.tavernObjects['sky'].material as THREE.ShaderMaterial;
      
      if (type === 'clear') {
        // No changes for clear weather
      } else if (type === 'rain') {
        // Darker, grayer sky for rain
        skyMaterial.uniforms.topColor.value = new THREE.Color().lerpColors(
          skyMaterial.uniforms.topColor.value,
          new THREE.Color(0x444466),
          intensity * 0.7
        );
        skyMaterial.uniforms.bottomColor.value = new THREE.Color().lerpColors(
          skyMaterial.uniforms.bottomColor.value,
          new THREE.Color(0x333344),
          intensity * 0.7
        );
      } else if (type === 'storm') {
        // Dark, threatening sky for storms
        skyMaterial.uniforms.topColor.value = new THREE.Color().lerpColors(
          skyMaterial.uniforms.topColor.value,
          new THREE.Color(0x222233),
          intensity * 0.8
        );
        skyMaterial.uniforms.bottomColor.value = new THREE.Color().lerpColors(
          skyMaterial.uniforms.bottomColor.value,
          new THREE.Color(0x111122),
          intensity * 0.8
        );
      }
    }
    
    // Adjust ambient light based on weather
    if (type === 'clear') {
      // No additional changes
    } else if (type === 'rain') {
      // Reduce ambient light for rainy weather
      this.lights.ambient.intensity *= (1 - intensity * 0.3);
    } else if (type === 'storm') {
      // Further reduce ambient light for storms
      this.lights.ambient.intensity *= (1 - intensity * 0.5);
    }
  }
  
  /**
   * Add a flickering candle light at the specified position
   * @param position - 3D position for the candle
   * @returns The index of the created candle light
   */
  addCandleLight(position: THREE.Vector3): number {
    const candleLight = new THREE.PointLight(0xff9900, 0.8, 3, 2);
    candleLight.position.copy(position);
    this.scene.add(candleLight);
    
    // Create simple candle model
    const candleGroup = new THREE.Group();
    
    // Candle base (cylinder)
    const candleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
    const candleMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0e0 });
    const candle = new THREE.Mesh(candleGeometry, candleMaterial);
    candle.position.copy(position);
    candle.position.y -= 0.1; // Center the candle height
    candle.castShadow = true;
    candleGroup.add(candle);
    
    // Flame (small glowing sphere)
    const flameGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff9900 });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.copy(position);
    flame.position.y += 0.12;
    candleGroup.add(flame);
    
    this.scene.add(candleGroup);
    
    // Store references
    const candleIndex = this.lights.candles.length;
    this.lights.candles.push(candleLight);
    this.tavernObjects[`candle_${candleIndex}`] = candleGroup;
    
    return candleIndex;
  }
  
  /**
   * Get a reference to the scene
   * @returns The Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }
  
  /**
   * Get a reference to the camera
   * @returns The Three.js camera
   */
  getCamera(): THREE.Camera {
    return this.camera;
  }
  
  /**
   * Get a reference to the renderer
   * @returns The Three.js renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}

// Create and export a singleton instance
export const tavernScene = new TavernScene();