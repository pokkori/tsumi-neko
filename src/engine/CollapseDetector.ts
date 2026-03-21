import Matter from "matter-js";
import { PHYSICS } from "../constants/physics";

export interface CollapseResult {
  collapsed: boolean;
  fallenBodies: Matter.Body[];
  remainingBodies: Matter.Body[];
}

export class CollapseDetector {
  private previousHighestY: number = PHYSICS.GROUND_Y;
  private stableFrameCount: number = 0;

  recordHeight(highestY: number): void {
    this.previousHighestY = highestY;
  }

  resetStableCount(): void {
    this.stableFrameCount = 0;
  }

  check(
    dynamicBodies: Matter.Body[],
    currentHighestY: number,
    allStable: boolean
  ): "stable" | "settling" | "collapsed" {
    const outOfBounds = dynamicBodies.filter(
      (b) =>
        b.position.x < PHYSICS.OUT_OF_BOUNDS.left ||
        b.position.x > PHYSICS.OUT_OF_BOUNDS.right ||
        b.position.y > PHYSICS.OUT_OF_BOUNDS.bottom
    );

    if (outOfBounds.length >= 2) {
      return "collapsed";
    }

    const heightDrop = currentHighestY - this.previousHighestY;
    if (heightDrop > PHYSICS.COLLAPSE_THRESHOLD_PX && dynamicBodies.length > 1) {
      return "collapsed";
    }

    if (allStable) {
      this.stableFrameCount++;
      if (this.stableFrameCount >= PHYSICS.STABLE_FRAME_COUNT) {
        return "stable";
      }
    } else {
      this.stableFrameCount = 0;
    }

    return "settling";
  }

  classifyBodies(dynamicBodies: Matter.Body[]): CollapseResult {
    const fallen: Matter.Body[] = [];
    const remaining: Matter.Body[] = [];

    for (const body of dynamicBodies) {
      const isFallen =
        body.position.x < PHYSICS.OUT_OF_BOUNDS.left ||
        body.position.x > PHYSICS.OUT_OF_BOUNDS.right ||
        body.position.y > PHYSICS.OUT_OF_BOUNDS.bottom ||
        Math.abs(body.velocity.y) > 5;

      if (isFallen) {
        fallen.push(body);
      } else {
        remaining.push(body);
      }
    }

    return {
      collapsed: fallen.length > 0,
      fallenBodies: fallen,
      remainingBodies: remaining,
    };
  }

  getHeightDrop(currentHighestY: number): number {
    return currentHighestY - this.previousHighestY;
  }
}
