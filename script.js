/* ============================================
   THREE.JS — MORPHING WIREFRAME GLOBE + AURORA
   ============================================ */
(function () {
    const canvas = document.getElementById('scene');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.012);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 0, 40);

    let mouseX = 0, mouseY = 0;

    // --- CENTRAL WIREFRAME SPHERE (morphing) ---
    const sphereGeo = new THREE.IcosahedronGeometry(12, 4);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x7c5cfc,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Store original positions for morphing
    const origPositions = sphereGeo.attributes.position.array.slice();

    // --- INNER GLOW SPHERE ---
    const glowGeo = new THREE.IcosahedronGeometry(11.5, 3);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        wireframe: true,
        transparent: true,
        opacity: 0.04
    });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glowSphere);

    // --- ORBITING RING ---
    const ringGeo = new THREE.TorusGeometry(18, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.15 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    scene.add(ring);

    const ring2Geo = new THREE.TorusGeometry(22, 0.05, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x7c5cfc, transparent: true, opacity: 0.08 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 6;
    scene.add(ring2);

    // --- FLOATING PARTICLES ---
    const pCount = 800;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = [];
    for (let i = 0; i < pCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 20 + Math.random() * 60;
        pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pPos[i * 3 + 2] = r * Math.cos(phi);
        pVel.push({ x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.01 });
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0xc084fc,
        size: 0.6,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // --- AURORA CURVES ---
    const auroras = [];
    for (let a = 0; a < 3; a++) {
        const curve = new THREE.CatmullRomCurve3([]);
        const auroraData = { points: [], offset: a * 2.1, speed: 0.3 + a * 0.15, color: [0x7c5cfc, 0x22d3ee, 0xc084fc][a] };
        for (let i = 0; i < 80; i++) {
            auroraData.points.push(new THREE.Vector3());
        }
        auroras.push(auroraData);
    }
    const auroraMeshes = auroras.map((a) => {
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.LineBasicMaterial({ color: a.color, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        return line;
    });

    // --- MOUSE ---
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // --- SCROLL ---
    let scrollProgress = 0;
    window.addEventListener('scroll', () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = window.scrollY / maxScroll;
    });

    // --- ANIMATE ---
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Morph sphere vertices
        const pos = sphereGeo.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
            const ox = origPositions[i], oy = origPositions[i + 1], oz = origPositions[i + 2];
            const dist = Math.sqrt(ox * ox + oy * oy + oz * oz);
            const noise = Math.sin(ox * 0.5 + t * 0.8) * Math.cos(oy * 0.5 + t * 0.6) * Math.sin(oz * 0.5 + t * 0.7);
            const scale = 1 + noise * 0.08;
            pos[i] = ox * scale;
            pos[i + 1] = oy * scale;
            pos[i + 2] = oz * scale;
        }
        sphereGeo.attributes.position.needsUpdate = true;

        // Rotate sphere
        sphere.rotation.y = t * 0.08 + mouseX * 0.3;
        sphere.rotation.x = mouseY * 0.2;
        glowSphere.rotation.y = -t * 0.06;
        glowSphere.rotation.z = t * 0.04;

        // Rings
        ring.rotation.z = t * 0.15;
        ring2.rotation.z = -t * 0.1;
        ring2.rotation.x = Math.PI / 3 + Math.sin(t * 0.2) * 0.1;

        // Scroll-based camera
        camera.position.z = 40 - scrollProgress * 15;
        camera.position.y = -scrollProgress * 8;
        camera.rotation.z = scrollProgress * 0.05;
        sphere.position.x = scrollProgress * 25;
        sphere.position.y = scrollProgress * 5;

        // Particles drift
        const pArr = particles.geometry.attributes.position.array;
        for (let i = 0; i < pCount; i++) {
            pArr[i * 3] += pVel[i].x;
            pArr[i * 3 + 1] += pVel[i].y;
            pArr[i * 3 + 2] += pVel[i].z;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = t * 0.02;

        // Aurora update
        auroras.forEach((a, idx) => {
            for (let i = 0; i < a.points.length; i++) {
                const frac = i / a.points.length;
                const x = (frac - 0.5) * 80;
                const y = Math.sin(frac * 4 + t * a.speed + a.offset) * 8 + Math.sin(frac * 7 + t * 0.5) * 3;
                const z = Math.cos(frac * 3 + t * a.speed * 0.7) * 5 - 20;
                a.points[i].set(x, y + (idx - 1) * 6, z);
            }
            const curve = new THREE.CatmullRomCurve3(a.points);
            const pts = curve.getPoints(79);
            auroraMeshes[idx].geometry.setFromPoints(pts);
        });

        // Pulse opacity
        sphereMat.opacity = 0.1 + Math.sin(t * 0.5) * 0.03;
        ringMat.opacity = 0.12 + Math.sin(t * 0.7) * 0.05;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

/* ========== LOADER ========== */
window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('loader').classList.add('done'), 1800);
});

/* ========== NAV ========== */
const burger = document.getElementById('burger');
const mobMenu = document.getElementById('mobMenu');

burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobMenu.classList.toggle('open');
});
document.querySelectorAll('.mob-menu a').forEach(a => {
    a.addEventListener('click', () => {
        burger.classList.remove('open');
        mobMenu.classList.remove('open');
    });
});

// Active link
const allSections = document.querySelectorAll('.sec');
const allNavItems = document.querySelectorAll('.nav-item');
window.addEventListener('scroll', () => {
    let cur = '';
    allSections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 250) cur = s.id;
    });
    allNavItems.forEach(n => {
        n.classList.remove('active');
        if (n.getAttribute('href') === '#' + cur) n.classList.add('active');
    });
});

/* ========== SCROLL REVEAL ========== */
const fadeEls = document.querySelectorAll('.fade-up, .sec-head');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
fadeEls.forEach(el => observer.observe(el));

/* ========== SMOOTH SCROLL ========== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
        e.preventDefault();
        const t = document.querySelector(this.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
});

/* ========== STAGGER DELAYS ========== */
document.querySelectorAll('.skill-group').forEach((g, i) => g.style.transitionDelay = i * 0.1 + 's');
document.querySelectorAll('.proj-item').forEach((p, i) => p.style.transitionDelay = i * 0.08 + 's');
document.querySelectorAll('.journey-card').forEach((c, i) => c.style.transitionDelay = i * 0.1 + 's');
document.querySelectorAll('.contact-item').forEach((c, i) => c.style.transitionDelay = i * 0.08 + 's');

/* ========== TILT ON PROJECT CARDS ========== */
document.querySelectorAll('.proj-item, .journey-card, .contact-item').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});
