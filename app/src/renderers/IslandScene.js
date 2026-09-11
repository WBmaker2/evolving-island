const PHENOTYPE_STYLE = {
  A_B_: { color: 0x087f8c },
  A_bb: { color: 0x149b91 },
  aaB_: { color: 0xb8793f },
  aabb: { color: 0x9f6335 },
};
const WIDTH = 900;
const HEIGHT = 560;

export class IslandScene {
  constructor(root, imageUrl) {
    this.root = root;
    this.imageUrl = imageUrl;
    this.population = [];
    this.mode = "2D 대체 화면";
    this.view = "oblique";
    this.disposed = false;
    this.backgroundTexture = null;
    this.three = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.markerGroup = null;
    this.resizeObserver = null;
    this.image = new Image();
    this.image.addEventListener("load", () => {
      if (!this.disposed) this.render(this.population);
    });
    this.image.src = imageUrl;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "island-canvas";
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.fallbackCanvas = document.createElement("canvas");
    this.fallbackCanvas.className = "island-canvas";
    this.fallbackCanvas.width = WIDTH;
    this.fallbackCanvas.height = HEIGHT;
    this.fallbackContext = this.fallbackCanvas.getContext("2d");
    this.root.replaceChildren(this.fallbackCanvas);
    this.drawFallback();
    this.tryThree();
  }

  async tryThree() {
    try {
      if (new URLSearchParams(window.location.search).has("force2d"))
        throw new Error("2D forced");
      const three = await import("./vendor/three.module.min.js");
      if (this.disposed) return;
      this.three = three;
      this.renderer = new three.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setClearColor(0xe7f2ec, 1);
      this.scene = new three.Scene();
      this.camera = new three.OrthographicCamera(
        -450,
        450,
        280,
        -280,
        0.1,
        1000,
      );
      this.setCameraPose();
      this.markerGroup = new three.Group();
      this.scene.add(this.markerGroup);
      this.addBackdrop(three);
      this.canvas.addEventListener("webglcontextlost", this.onContextLost, {
        once: true,
      });
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.root);
      this.mode = "Three.js 공간 모형";
      this.root.replaceChildren(this.canvas);
      this.resize();
      this.render(this.population);
    } catch (_) {
      this.useFallback();
    }
    if (!this.disposed)
      this.root.dispatchEvent(
        new CustomEvent("scene-ready", { detail: { mode: this.mode } }),
      );
  }

  addBackdrop(three) {
    const texture = new three.TextureLoader().load(
      this.imageUrl,
      () => {
        if (!this.disposed && this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      },
      undefined,
      () => this.useFallback(),
    );
    texture.colorSpace = three.SRGBColorSpace;
    this.backgroundTexture = texture;
    const backdrop = new three.Mesh(
      new three.PlaneGeometry(900, 560),
      new three.MeshBasicMaterial({ map: texture, transparent: true }),
    );
    backdrop.position.z = -1;
    this.scene.add(backdrop);
    const divider = new three.Line(
      new three.BufferGeometry().setFromPoints([
        new three.Vector3(0, -250, 0),
        new three.Vector3(0, 250, 0),
      ]),
      new three.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 10,
        gapSize: 8,
      }),
    );
    divider.computeLineDistances();
    this.scene.add(divider);
  }

  resize() {
    if (this.disposed || !this.renderer || !this.root.clientWidth) return;
    this.renderer.setSize(
      this.root.clientWidth,
      (this.root.clientWidth * HEIGHT) / WIDTH,
      false,
    );
    this.camera.updateProjectionMatrix();
    if (this.scene && this.camera) this.renderer.render(this.scene, this.camera);
  }
  setCameraPose() {
    if (!this.camera) return;
    if (this.view === "top") this.camera.position.set(0, 0, 520);
    else this.camera.position.set(0, 210, 430);
    this.camera.lookAt(0, 0, 0);
  }
  render(population = []) {
    if (this.disposed) return;
    this.population = Array.isArray(population) ? population : [];
    if (this.renderer) this.renderThree();
    else this.drawFallback();
  }

  renderThree() {
    const THREE = this.three;
    this.disposeMarkerResources();
    this.markerGroup.clear();
    this.population.slice(0, 200).forEach((individual, index) => {
      const phenotype = individual?.phenotype || "aabb";
      const style = PHENOTYPE_STYLE[phenotype] || PHENOTYPE_STYLE.aabb;
      const col = index % 20;
      const row = Math.floor(index / 20);
      const x = -330 + col * 34;
      const y = -210 + row * 46;
      const shape = phenotype.startsWith("A")
        ? new THREE.ConeGeometry(7, 14, 4)
        : new THREE.CylinderGeometry(6, 6, 4, 4);
      const marker = new THREE.Mesh(
        shape,
        new THREE.MeshBasicMaterial({ color: style.color }),
      );
      marker.position.set(x, y, 3 + (index % 4) * 0.1);
      if (!phenotype.startsWith("A")) marker.rotation.x = Math.PI / 2;
      this.markerGroup.add(marker);
      if (phenotype.includes("B")) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(3.5, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0xf8e7b8 }),
        );
        dot.position.set(x, y + 8, marker.position.z + 1);
        this.markerGroup.add(dot);
      }
    });
    this.renderer.render(this.scene, this.camera);
  }

  drawFallback() {
    const ctx = this.fallbackContext;
    if (!ctx || this.disposed) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (this.image.complete && this.image.naturalWidth)
      ctx.drawImage(this.image, 0, 0, WIDTH, HEIGHT);
    else {
      ctx.fillStyle = "#e7f2ec";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#c6ded2";
      ctx.beginPath();
      ctx.ellipse(450, 300, 335, 180, -0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(12,124,131,.16)";
    ctx.fillRect(40, 60, 260, 420);
    ctx.fillStyle = "rgba(31,107,79,.16)";
    ctx.fillRect(600, 60, 260, 420);
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = "rgba(255,255,255,.88)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(450, 48);
    ctx.lineTo(450, 510);
    ctx.stroke();
    ctx.setLineDash([]);
    this.population.slice(0, 200).forEach((individual, index) => {
      const phenotype = individual?.phenotype || "aabb";
      const style = PHENOTYPE_STYLE[phenotype] || PHENOTYPE_STYLE.aabb;
      const cx = (phenotype.startsWith("A") ? 560 : 170) + ((index * 67) % 240);
      const cy = (phenotype.includes("B") ? 320 : 170) + ((index * 31) % 120);
      ctx.fillStyle = `#${style.color.toString(16).padStart(6, "0")}`;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  onContextLost = () => {
    if (!this.disposed) this.useFallback();
  };
  disposeMarkerResources() {
    this.markerGroup?.children.forEach((object) => {
      object.geometry?.dispose();
      object.material?.dispose?.();
    });
  }
  disposeSceneResources() {
    this.disposeMarkerResources();
    this.scene?.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose?.();
    });
  }
  useFallback() {
    this.mode = "2D 대체 화면";
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.disposeSceneResources();
    this.renderer?.dispose();
    this.backgroundTexture?.dispose();
    this.backgroundTexture = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    if (!this.disposed) {
      this.root.replaceChildren(this.fallbackCanvas);
      this.drawFallback();
      this.root.dispatchEvent(
        new CustomEvent("scene-ready", { detail: { mode: this.mode } }),
      );
    }
  }
  setView(view) {
    if (view !== "top" && view !== "oblique") return;
    this.view = view;
    if (this.camera) {
      this.setCameraPose();
      this.render(this.population);
    }
  }
  dispose() {
    this.disposed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.disposeSceneResources();
    this.renderer?.dispose();
    this.backgroundTexture?.dispose();
    this.backgroundTexture = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.markerGroup = null;
  }
}
