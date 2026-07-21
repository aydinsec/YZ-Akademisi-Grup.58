import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function BoatScene({ isRunning, minutes, seconds }) {
  const containerRef = useRef(null);
  const guiRef = useRef(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSettings = useCallback(() => {
    setSettingsOpen((prev) => {
      const next = !prev;
      if (guiRef.current) guiRef.current.show(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

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
      function (gltf) {
        myModel = gltf.scene;
        myModel.scale.set(10, 10, 10);
        scene.add(myModel);
      },
      undefined,
      function (error) {
        console.error("Model yüklenirken bir hata oluştu:", error);
      },
    );

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.5,
      0.4,
      0.85,
    );
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
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
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

    const stats = new Stats();
    stats.dom.style.position = "absolute";
    stats.dom.style.bottom = "10px";
    stats.dom.style.left = "10px";
    stats.dom.style.top = "auto";
    container.appendChild(stats.dom);

    const gui = new GUI({ title: "Sahne Ayarları" });
    guiRef.current = gui;
    gui.hide();

    const folderSky = gui.addFolder("Gökyüzü");
    folderSky
      .add(parameters, "elevation", 0, 90, 0.1)
      .name("Yükseklik")
      .onChange(updateSun);
    folderSky
      .add(parameters, "azimuth", -180, 180, 0.1)
      .name("Yön (Azimut)")
      .onChange(updateSun);
    folderSky
      .add(parameters, "exposure", 0, 1, 0.0001)
      .name("Pozlama")
      .onChange(function (value) {
        renderer.toneMappingExposure = value;
      });
    folderSky.open();

    const waterUniforms = water.material.uniforms;
    const folderWater = gui.addFolder("Su");
    folderWater
      .add(waterUniforms.distortionScale, "value", 0, 8, 0.1)
      .name("Dalga Bozulması");
    folderWater
      .add(waterUniforms.size, "value", 0.1, 10, 0.1)
      .name("Dalga Boyutu");
    folderWater.open();

    let animationFrameId;

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      if (myModel) {
        const speed = isRunning ? 2.5 : 1.5;
        myModel.position.y = Math.sin(time * speed) * 0.5 - 7;
      }

      const delta = clock.getDelta();
      water.material.uniforms["time"].value += delta;
      composer.render();
      stats.update();
    }

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          // --- KRİTİK ÇÖZÜM 2: Burada da CSS genişliğine müdahaleyi engelliyoruz ---
          renderer.setSize(width, height, false);
          composer.setSize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      gui.destroy();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isRunning]);

  const containerStyle = isFullscreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        borderRadius: 0,
        overflow: "hidden",
        backgroundColor: "#000",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      }
    : {
        width: "100%",
        maxWidth: "100%", // Yatayda taşmayı tamamen engellemek için eklendi
        height: "260px",
        borderRadius: "16px",
        overflow: "hidden",
        backgroundColor: "#000",
        position: "relative",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        transition: "all 0.3s ease",
      };

  return (
    <div style={containerStyle}>
      {/* Container için absolute yapı kurarak esnemeyi durdurduk */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      />

      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        title={isFullscreen ? "Normal Boyuta Dön (ESC)" : "Tam Ekran Yap"}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 20,
          padding: "8px 14px",
          borderRadius: 12,
          border: isFullscreen
            ? "1px solid rgba(127,224,176,0.5)"
            : "1px solid rgba(232,183,109,0.35)",
          background: isFullscreen
            ? "rgba(127,224,176,0.15)"
            : "rgba(0, 20, 15, 0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: isFullscreen ? "#7FE0B0" : "#E8B76D",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          transition: "all 0.2s ease",
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {isFullscreen ? "🗗 Küçült" : "⛶ Tam Ekran"}
      </button>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 20,
          padding: "10px 16px",
          borderRadius: 12,
          background: "rgba(0, 20, 15, 0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(232, 183, 109, 0.35)",
          boxShadow:
            "0 8px 28px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
          color: "#F2EFE6",
          userSelect: "none",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#E8B76D",
            marginBottom: 4,
          }}
        >
          Canlı Rota
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.03em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 0 14px rgba(232,183,109,0.25)",
          }}
        >
          {minutes}:{seconds}
        </div>
      </div>

      <button
        onClick={toggleSettings}
        title="Sahne Ayarları"
        style={{
          position: "absolute",
          top: 16,
          right: 130,
          zIndex: 20,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: settingsOpen
            ? "1px solid rgba(127,224,176,0.5)"
            : "1px solid rgba(232,183,109,0.35)",
          background: settingsOpen
            ? "rgba(127,224,176,0.15)"
            : "rgba(0, 20, 15, 0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          color: settingsOpen ? "#7FE0B0" : "#E8B76D",
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          transition: "all 0.2s ease",
          userSelect: "none",
        }}
      >
        ⚙
      </button>
    </div>
  );
}
