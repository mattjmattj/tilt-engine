import GameObject from "../../../src/GameObject";
import RigidBody from "../../../src/RigidBody";
import TiltEngine from "../../../src/TiltEngine";

const xDegEl = document.getElementById('x-deg');
const yDegEl = document.getElementById('y-deg');

// some css vars that we will reuse in here
// --card-border-color
const mainLineColor = '#345';
// --primary-text-color
const accentLineColor = '#9ac';
// --button-bg-color
const green = '#0a7';
const orange = '#eb2';


const outerCircleRadius = 150;

// center coordinates
let cx, cy;

class Bubble extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.radius = 20; //to fit inside de 5° ring (see global onUpdate callback)
        this.maxDist = outerCircleRadius - 10; // pixel radius limit
        this.rigidBody = new RigidBody({
            gameObject: this,
            mass: 1,
            friction: 0.9, // high friction for kind of a viscous liquid feel
            bounciness: 0
        });
        this.sensitivity = 5000; // multiplier for tilt force
        this.threshold = 0.02

        // other variables needed to avoid making calculations twice
        //distance to center for each axis
        this.dx = 0;
        this.dy = 0;
        //distance to center
        this.distCenter = 0;
    }

    update(dt, input, screenSize) {
        // convert angles to degrees
        // my first thought was tilt * 90, but accelerometers are not linear (0.5g = 30°)
        const xAngle = Math.asin(input.tilt.x) * (180 / Math.PI);
        const yAngle = Math.asin(input.tilt.y) * (180 / Math.PI);

        xDegEl.innerText = xAngle.toFixed(1) + '°';
        yDegEl.innerText = yAngle.toFixed(1) + '°';
                
        this.dx = this.x - cx;
        this.dy = this.y - cy;
        this.distCenter = Math.hypot(this.dx, this.dy);
        
        // tilt force : pushing out of the circle, to the highest point of the virtual dome
        this.rigidBody.vx += -input.tilt.x * this.sensitivity * dt;
        this.rigidBody.vy += -input.tilt.y * this.sensitivity * dt;

        // centering force : the bubble must go to the center when there is no tilt
        // the calculation is a bit artificial, we divide the distance to the center
        // for each axis by the maximum distance, in order to obtain a value in [0,1],
        // and mimic input.tilt value range
        this.rigidBody.vx -= this.dx / this.maxDist * this.sensitivity * dt;
        this.rigidBody.vy -= this.dy / this.maxDist * this.sensitivity * dt;

        // circular boundary        
        if (this.distCenter > this.maxDist) {
            const angle = Math.atan2(this.dy, this.dx);
            this.x = cx + Math.cos(angle) * this.maxDist;
            this.y = cy + Math.sin(angle) * this.maxDist;
        }
    }

    draw(ctx) {
        const isCentered = this.distCenter < 25; // inside the inner circle

        ctx.fillStyle = isCentered ? green : orange;
        ctx.shadowColor = isCentered ? green : orange;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

const engine = new TiltEngine(document.getElementById('game-canvas'), {
    doubleBuffering: true,
    onUpdate: (dt, input, screenSize) => {
        cx = screenSize.width / 2;
        cy = screenSize.height / 2;
    },
    onDraw: (ctx) => {        
        // outer circle
        ctx.strokeStyle = mainLineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, outerCircleRadius, 0, Math.PI * 2); // ~45° range
        ctx.stroke();

        // ~5° ring
        ctx.strokeStyle = accentLineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.stroke();

        // crosshairs
        const crosshairLength = outerCircleRadius + 10;
        ctx.strokeStyle = mainLineColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        ctx.moveTo(cx - crosshairLength, cy);
        ctx.lineTo(cx + crosshairLength, cy);
        
        ctx.moveTo(cx, cy - crosshairLength);
        ctx.lineTo(cx, cy + crosshairLength);
        
        ctx.stroke();
    }
});

function startLevel() {
    engine.clearGameObjects();
    engine.addGameObject(
        new Bubble(window.innerWidth / 2, window.innerHeight / 2)
    );
}

document.getElementById('start-btn').addEventListener('click', async () => {
    try {
        await document.body.requestFullscreen();
        await screen.orientation.lock('portrait-primary');
    } catch (e) {
        console.error(e);
    }

    document.getElementById('start-screen').remove();

    startLevel();
    engine.start();
});