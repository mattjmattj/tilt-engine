import Collider from "../Collider.js";
import { clamp } from "../utils.js";
import CircleCollider from "./CircleCollider.js";

export default class RectCollider extends Collider {
    constructor(width, height) {
        super();
        this.width = width;
        this.height = height;
    }

    testCollision(otherCollider, selfPos, otherPos) {
        if (otherCollider instanceof RectCollider) {
            return this._rectVsRect(this, selfPos, otherCollider, otherPos);
        } else if (otherCollider instanceof CircleCollider) {
            return this._rectVsCircle(this, selfPos, otherCollider, otherPos);
        }
    }

    _rectVsRect(rect, selfPos, otherCollider, otherPos) {
        // Axis-Aligned Bounding Box
        // overlapping check : comparing the combined half extends (the max distance when overlapping)
        // to the actual distance
        const combinedHalfW = 0.5 * (this.width + otherCollider.width);
        const combinedHalfH = 0.5 * (this.height + otherCollider.height);
        const dx = selfPos.x - otherPos.x;
        const dy = selfPos.y - otherPos.y;
        
        const overlapX = combinedHalfW - Math.abs(dx);
        const overlapY = combinedHalfH - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
            let normal, depth = 0;

            // we will say that to collision arrised along the minimum penetration axis
            if (overlapX < overlapY) {
                // collision along the X axis
                depth = overlapX;
                // dx < 0 means self is on the left of other, so the normal should point to the rights
                normal = { x: dx < 0 ? 1 : -1, y: 0 };
            } else {
                // collision along the Y axis
                depth = overlapY;
                normal = { x: 0, y: dy < 0 ? 1 : -1 };
            }
            return { collided: true, normal, depth };
        }

        return null

    }

    _rectVsCircle(rect, rPos, circle, cPos) {
        const rLeft = rPos.x - rect.width / 2;
        const rRight = rPos.x + rect.width / 2;
        const rTop = rPos.y - rect.height / 2;
        const rBottom = rPos.y + rect.height / 2;

        const closestX = clamp(cPos.x, rLeft, rRight);
        const closestY = clamp(cPos.y, rTop, rBottom);

        const dx = cPos.x - closestX;
        const dy = cPos.y - closestY;
        const dist = Math.hypot(dx, dy)

        if (dist < circle.radius) {
            let normal, depth;

            if (dist === 0) {
                const dLeft = cPos.x - rLeft;
                const dRight = rRight - cPos.x;
                const dTop = cPos.y - rTop;
                const dBottom = rBottom - cPos.y;
                const min = Math.min(dLeft, dRight, dTop, dBottom);
                switch(min) {
                    case dLeft:
                        normal = {x:-1, y:0};
                        break;
                    case dRight:
                        normal = {x:1, y:0};
                        break;
                    case dTop:
                        normal = {x:0, y:-1};
                        break;
                    case dBottom:
                        normal = {x:0, y:1};
                        break;
                }
                depth = circle.radius + min;
            } else {
                normal = { x: dx / dist, y: dy / dist };
                depth = circle.radius - dist;
            }
            return {
                collided: true,
                normal, depth
            };
        }
        return null;
    }
}
