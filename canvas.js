/* =====================
   LUCA SYSTEM — Canvas Animations
   ===================== */

// ---- BG CANVAS: Floating dots / lines ----
(function initBgCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function makeParticles() {
        particles = [];
        const count = Math.floor((W * H) / 12000);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 2.5 + 0.5,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                alpha: Math.random() * 0.4 + 0.1,
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        // Connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(26,86,219,${0.06 * (1 - dist/120)})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        // Dots
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(26,86,219,${p.alpha})`;
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;
        });
        requestAnimationFrame(draw);
    }

    resize();
    makeParticles();
    draw();
    window.addEventListener('resize', () => { resize(); makeParticles(); });
})();

// ---- HEADER CANVAS: Wave + sparkle ----
(function initHeaderCanvas() {
    const canvas = document.getElementById('headerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, t = 0;

    function resize() {
        W = canvas.width  = canvas.parentElement.offsetWidth;
        H = canvas.height = canvas.parentElement.offsetHeight;
    }

    const stars = Array.from({length: 60}, () => ({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.8 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.005,
    }));

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Waves
        for (let w = 0; w < 3; w++) {
            ctx.beginPath();
            const amp   = 18 + w * 8;
            const freq  = 0.006 + w * 0.002;
            const phase = t * (0.4 + w * 0.15) + w * 1.5;
            const yBase = H * (0.35 + w * 0.22);
            ctx.moveTo(0, yBase);
            for (let x = 0; x <= W; x += 3) {
                ctx.lineTo(x, yBase + Math.sin(x * freq + phase) * amp);
            }
            ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
            ctx.fillStyle = `rgba(255,255,255,${0.025 - w * 0.006})`;
            ctx.fill();
        }

        // Stars
        stars.forEach(s => {
            const alpha = 0.3 + 0.4 * Math.sin(s.phase + t * s.speed * 60);
            ctx.beginPath();
            ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fill();
        });

        t += 0.016;
        requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener('resize', resize);
})();

// ---- ABOUT CANVAS: Rotating balance scale ----
(function initAboutCanvas() {
    const canvas = document.getElementById('aboutCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 220, H = 220;
    let t = 0;

    function draw() {
        ctx.clearRect(0, 0, W, H);

        const cx = W / 2, cy = 70;
        const tilt = Math.sin(t * 0.7) * 12;

        // Pole
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy + 90);
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Beam
        const beamLen = 70;
        const rad = tilt * Math.PI / 180;
        const bx1 = cx - beamLen * Math.cos(rad), by1 = cy + beamLen * Math.sin(rad);
        const bx2 = cx + beamLen * Math.cos(rad), by2 = cy - beamLen * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(bx1, by1);
        ctx.lineTo(bx2, by2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Left pan
        ctx.beginPath();
        ctx.arc(bx1, by1 + 22, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(219,234,254,0.9)';
        ctx.fill();
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#1a56db';
        ctx.font = 'bold 14px Sora, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('₱', bx1, by1 + 22);

        // Right pan
        ctx.beginPath();
        ctx.arc(bx2, by2 + 22, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(209,250,229,0.9)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.fillText('=', bx2, by2 + 22);

        // Knob
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1a56db';
        ctx.fill();

        // Base
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy + 90);
        ctx.lineTo(cx + 30, cy + 90);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Label
        ctx.fillStyle = '#475569';
        ctx.font = '11px Sora, sans-serif';
        ctx.fillText('Assets = Liabilities + Equity', cx, cy + 115);

        t += 0.03;
        requestAnimationFrame(draw);
    }
    draw();
})();

// ---- CONTACT CANVAS: Pulsing envelope ----
(function initContactCanvas() {
    const canvas = document.getElementById('contactCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 220, H = 220;
    let t = 0;

    function drawEnvelope(x, y, w, h, color) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 6);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Flap
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w/2, y + h * 0.55);
        ctx.lineTo(x + w, y);
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const pulse = 1 + 0.05 * Math.sin(t * 2);
        const cx = W/2, cy = H/2;

        // Rings
        for (let i = 3; i >= 1; i--) {
            ctx.beginPath();
            ctx.arc(cx, cy, 40 * i * pulse * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(26,86,219,${0.04 / i})`;
            ctx.fill();
        }

        ctx.save();
        ctx.translate(cx, cy - 5);
        ctx.scale(pulse, pulse);
        drawEnvelope(-38, -24, 76, 48, 'rgba(219,234,254,0.95)');
        ctx.restore();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Sora, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Reach out anytime', cx, cy + 60);

        t += 0.04;
        requestAnimationFrame(draw);
    }
    draw();
})();

// ---- LOGIN CANVAS: Shield icon spin ----
(function initLoginCanvas() {
    const canvas = document.getElementById('loginCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 120, H = 120;
    let t = 0;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const cx = W/2, cy = H/2;
        const pulse = 1 + 0.04 * Math.sin(t * 2.5);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);

        // Shield
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.bezierCurveTo(22, -32, 32, -12, 32, 0);
        ctx.bezierCurveTo(32, 22, 12, 36, 0, 42);
        ctx.bezierCurveTo(-12, 36, -32, 22, -32, 0);
        ctx.bezierCurveTo(-32, -12, -22, -32, 0, -32);
        ctx.fillStyle = 'rgba(219,234,254,0.95)';
        ctx.fill();
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Lock icon
        ctx.beginPath();
        ctx.roundRect(-9, -4, 18, 16, 3);
        ctx.fillStyle = '#1a56db';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -6, 7, Math.PI, 0);
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.restore();
        t += 0.04;
        requestAnimationFrame(draw);
    }
    draw();
})();

// ---- REGISTER CANVAS: User star burst ----
(function initRegisterCanvas() {
    const canvas = document.getElementById('registerCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 100, H = 100;
    let t = 0;

    function draw() {
        ctx.clearRect(0, 0, W, H);
        const cx = W/2, cy = H/2 - 5;

        // Rays
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + t;
            const r1 = 22, r2 = 34;
            ctx.beginPath();
            ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
            ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
            ctx.strokeStyle = `rgba(26,86,219,${0.25 + 0.1 * Math.sin(t * 3 + i)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Head
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#dbeafe';
        ctx.fill();
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.arc(cx, cy + 28, 18, Math.PI, 0);
        ctx.fillStyle = '#dbeafe';
        ctx.fill();
        ctx.strokeStyle = '#1a56db';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Plus badge
        ctx.beginPath();
        ctx.arc(cx + 16, cy - 12, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', cx + 16, cy - 12);

        t += 0.025;
        requestAnimationFrame(draw);
    }
    draw();
})();