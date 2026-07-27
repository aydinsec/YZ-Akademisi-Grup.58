/* 3D Deniz Sahnesi (Three.js) — odak sayacı ve kontroller sahnenin
   üzerine bindirilir (children). FPS göstergesi kaldırıldı. */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { useApp } from "../state/AppContext.jsx";

export default function BoatScene({ isRunning, minutes, seconds, children }) {
  const containerRef = useRef(null);
  const guiRef = useRef(null);
  const runningRef = useRef(isRunning);
  const { t } = useApp();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* koşu hızını sahneyi yeniden kurmadan güncelle */
  useEffect(() => { runningRef.current = isRunning; }, [isRunning]);

  const toggleSettings = useCallback(() => {
    setSettingsOpen((prev) => {
      const next = !prev;
      if (guiRef.current) guiRef.current.show(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") setIsFullscreen(false); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.142;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 20000);
    camera.position.set(300, 50, 100);
    const clock = new THREE.Clock();
    const sun = new THREE.Vector3();

    let myModel = null;
    const loader = new GLTFLoader();
    loader.load(
      "/low_poly_fishing_boat.glb",
      (gltf) => { myModel = gltf.scene; myModel.scale.set(10, 10, 10); scene.add(myModel); },
      undefined,
      (error) => console.error("Model yüklenirken bir hata oluştu:", error),
    );

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 0.1;
    bloomPass.radius = 0;
    const outputPass = new OutputPass();
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg",
        (texture) => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; },
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    water.material.uniforms["size"].value = 10;
    scene.add(water);

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const parameters = { elevation: 23.8, azimuth: -0.6, exposure: 0.142 };
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();
    let renderTarget;

    function updateSun() {
      const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
      const theta = THREE.MathUtils.degToRad(parameters.azimuth);
      sun.setFromSphericalCoords(1, phi, theta);
      sky.material.uniforms["sunPosition"].value.copy(sun);
      water.material.uniforms["sunDirection"].value.copy(sun).normalize();
      if (renderTarget !== undefined) renderTarget.dispose();
      sceneEnv.add(sky);
      renderTarget = pmremGenerator.fromScene(sceneEnv);
      scene.add(sky);
      scene.environment = renderTarget.texture;
    }
    updateSun();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 0, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();

    const gui = new GUI({ title: "Sahne Ayarları" });
    guiRef.current = gui;
    gui.hide();
    const folderSky = gui.addFolder("Gökyüzü");
    folderSky.add(parameters, "elevation", 0, 90, 0.1).name("Yükseklik").onChange(updateSun);
    folderSky.add(parameters, "azimuth", -180, 180, 0.1).name("Yön (Azimut)").onChange(updateSun);
    folderSky.add(parameters, "exposure", 0, 1, 0.0001).name("Pozlama").onChange((v) => { renderer.toneMappingExposure = v; });
    folderSky.open();
    const waterUniforms = water.material.uniforms;
    const folderWater = gui.addFolder("Su");
    folderWater.add(waterUniforms.distortionScale, "value", 0, 8, 0.1).name("Dalga Bozulması");
    folderWater.add(waterUniforms.size, "value", 0.1, 10, 0.1).name("Dalga Boyutu");
    folderWater.open();

    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;
      if (myModel) {
        const speed = runningRef.current ? 2.5 : 1.5;
        myModel.position.y = Math.sin(time * speed) * 0.5 - 7;
      }
      const delta = clock.getDelta();
      water.material.uniforms["time"].value += delta;
      composer.render();
    }
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
          composer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      gui.destroy();
      renderer.dispose();
      if (container && renderer.domElement && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={"scene-wrap" + (isFullscreen ? " scene-full" : "")}>
      <div ref={containerRef} className="scene-canvas" />

      {/* Üst kontrol şeridi — tasarıma uygun cam efektli butonlar */}
      <button className="scene-btn scene-tl" onClick={() => setIsFullscreen(!isFullscreen)}
        title={isFullscreen ? t("Küçült") + " (ESC)" : t("Tam Ekran")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {isFullscreen
            ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
        </svg>
        {isFullscreen ? t("Küçült") : t("Tam Ekran")}
      </button>

      <div className="scene-tr">
        <button className={"scene-btn scene-gear" + (settingsOpen ? " on" : "")} onClick={toggleSettings} title={t("Sahne Ayarları")}>
          <svg width="16" height="16"><use href="#i-gear" /></svg>
        </button>
        <div className="scene-chip">
          <div className="lbl">{t("Canlı Rota")}</div>
          <div className="time">{minutes}:{seconds}</div>
        </div>
      </div>

      {/* Sayaç ve odak kontrolleri (Focus sayfası bindirir) */}
      {children}
    </div>
  );
}
