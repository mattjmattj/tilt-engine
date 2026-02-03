import CircleCollider from "../../../src/colliders/CircleCollider";
import RectCollider from "../../../src/colliders/RectCollider";
import GameObject from "../../../src/GameObject";
import RigidBody from "../../../src/RigidBody";
import TiltEngine from "../../../src/TiltEngine";

class StaticWall extends GameObject {
    constructor(x, y, w, h) {
        super(x, y);
        this.width = w;
        this.height = h;
        this.collider = new RectCollider(w, h);
        this.rigidBody = new RigidBody({ gameObject: this , isStatic: true, bounciness: 0.6 });
    }

    draw(ctx) {
        ctx.fillStyle = '#345';
        // engine uses center positioning, so we need to substract half width and height
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.strokeStyle = '#557';
        ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}

class DynamicBox extends GameObject {
    constructor(x, y, w, h, color) {
        super(x, y);
        this.width = w;
        this.height = h;
        this.color = color;
        this.collider = new RectCollider(w, h);
        this.rigidBody = new RigidBody({ gameObject: this, mass: 15, friction: 0.95, bounciness: 0.2 });
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.strokeStyle = '#557';
        ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}

class DynamicBall extends GameObject {
    constructor(x, y, r, color, bounciness = 0.7) {
        super(x, y);
        this.radius = r;
        this.color = color;
        this.collider = new CircleCollider(r);
        this.rigidBody = new RigidBody({ gameObject: this, mass: r * 0.5, friction: 0.99, bounciness: bounciness });
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();        
        ctx.strokeStyle = '#557';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class PlayerBall extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.collider = new CircleCollider(this.radius);
        this.rigidBody = new RigidBody({ gameObject: this, mass: 30, friction: 0.98, bounciness: 1 });
        this.speed = 3000;
    }

    update(dt, input, screenSize) {
        // converting tilt to force
        this.rigidBody.vx += (input.tilt.x * this.speed * dt);
        this.rigidBody.vy += (input.tilt.y * this.speed * dt);
    }

    draw(ctx) {
        ctx.fillStyle = '#f46';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d03';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

const engine = new TiltEngine(document.getElementById('game-canvas'), {
    doubleBuffering: true,
    onUpdate: (dt, input) => {
        document.getElementById("dialog").innerHTML = `Tilt: ${input.tilt.x.toFixed(2)}, ${input.tilt.y.toFixed(2)}`;
    }
});

function setupPlayground() {
    engine.clearGameObjects();
    const w = window.innerWidth;
    const h = window.innerHeight;

    // boundaries
    const wallThick = 40;
    engine.addGameObject(new StaticWall(w / 2, -wallThick / 2, w, wallThick)); // Top
    engine.addGameObject(new StaticWall(w / 2, h + wallThick / 2, w, wallThick)); // Bottom
    engine.addGameObject(new StaticWall(-wallThick / 2, h / 2, wallThick, h)); // Left
    engine.addGameObject(new StaticWall(w + wallThick / 2, h / 2, wallThick, h)); // Right

    // stack of boxes
    const boxSize = 50;
    const startX = w * 0.7;
    const startY = h * 0.8;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c <= r; c++) {
            const bx = startX + (c * (boxSize + 2)) - (r * boxSize / 2);
            const by = startY - (r * (boxSize + 2));
            engine.addGameObject(new DynamicBox(bx, by, boxSize, boxSize, '#48f'));
        }
    }

    // random balls
    for (let i = 0; i < 5; i++) {
        const r = 15 + Math.random() * 20;
        engine.addGameObject(new DynamicBall(
            w * 0.2 + Math.random() * w * 0.2,
            h * 0.2 + Math.random() * h * 0.5,
            r,
            '#b5f',
            0.8
        ));
    }

    // large static block in middle
    engine.addGameObject(new StaticWall(w / 2, h / 2, 100, 50));

    // player !
    engine.addGameObject(new PlayerBall(w * 0.2, h * 0.2));
}

// spawn random object on click / touch
document.addEventListener('pointerdown', (e) => {
    if (!engine.isRunning) {
        return;
    }
    const x = e.clientX;
    const y = e.clientY;

    if (Math.random() > 0.5) {
        engine.addGameObject(new DynamicBall(x, y, 15 + Math.random() * 20, '#eb1', 0.6));
    } else {
        engine.addGameObject(new DynamicBox(x, y, 40 + Math.random() * 20, 40 + Math.random() * 20, '#2c6'));
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    document.body.requestFullscreen()
        .then(screen.orientation.lock('portrait-primary'))
        .then(() => {
            setTimeout(() => {
                engine.start();
                setupPlayground();
            }, 100);
        })
        .catch((e) => alert(e));
})
