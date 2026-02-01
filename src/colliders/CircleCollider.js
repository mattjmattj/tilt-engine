import Collider from "../Collider.js";
import RectCollider from "./RectCollider.js";

export default class CircleCollider extends Collider {
    constructor(radius) {
        super();
        this.radius = radius;
    }

    testCollision(otherCollider, selfPos, otherPos) {
        if (otherCollider instanceof CircleCollider) {
            const dx = otherPos.x - selfPos.x;
            const dy = otherPos.y - selfPos.y;
            const dist = Math.hypot(dx, dy);
            const radiusSum = this.radius + otherCollider.radius;
            if (dist < radiusSum) {
                let normal;
                if (dist === 0) {
                    // TODO this is not true, but I do not know what calculations to make
                    normal = { x: 1, y: 0 };
                } else {
                    normal = { x: dx / dist, y: dy / dist };
                }
                return {
                    collided: true,
                    normal,
                    // TODO should we return half the depth instead, to target the middle of the overlapping ?
                    depth: radiusSum - dist 
                };
            }
        } else if (otherCollider instanceof RectCollider) {
            // we delegate to RectCollider, but mest return the reverse vector
            const result = otherCollider.testCollision(this, otherPos, selfPos);
            if (result) {
                result.normal.x *= -1;
                result.normal.y *= -1;
                return result;
            }
        }
        return null;
    }
}
