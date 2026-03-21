import { GameState, CatShapeId, SkinId } from "../types";
import { PhysicsWorld } from "./PhysicsWorld";
import { CatSpawner } from "./CatSpawner";
import { CollapseDetector } from "./CollapseDetector";
import { ScoreCalculator } from "./ScoreCalculator";
import { PHYSICS } from "../constants/physics";
import { SCREEN_WIDTH } from "../constants/layout";

export class GameLoop {
  private physics: PhysicsWorld;
  private spawner: CatSpawner;
  private collapse: CollapseDetector;
  scorer: ScoreCalculator;

  private horizontalDirection: number = 1;
  private slowMotionFrames: number = 0;
  private forceShapeId: CatShapeId | undefined;

  state: GameState;

  constructor(skinId: SkinId = "mike", forceShapeId?: CatShapeId) {
    this.physics = new PhysicsWorld();
    this.spawner = new CatSpawner();
    this.collapse = new CollapseDetector();
    this.scorer = new ScoreCalculator();
    this.forceShapeId = forceShapeId;
    this.state = this.createInitialState(skinId);
  }

  private createInitialState(skinId: SkinId): GameState {
    return {
      phase: "idle",
      score: 0,
      height: 0,
      heightPx: 0,
      combo: 0,
      maxCombo: 0,
      catCount: 0,
      currentCat: null,
      nextShapeId: this.spawner.selectNextShape(this.forceShapeId),
      stackedCats: [],
      fallenCats: [],
      cameraY: 0,
      isNewRecord: false,
      dailyChallengeId: null,
      activeSkinId: skinId,
    };
  }

  start(): void {
    this.spawnNextCat();
  }

  private spawnNextCat(): void {
    const shapeId = this.state.nextShapeId;
    const startX = SCREEN_WIDTH / 2;
    const body = this.spawner.createCatBody(shapeId, startX);
    this.physics.addBody(body);

    this.state.currentCat = {
      bodyId: body.id,
      shapeId,
      skinId: this.state.activeSkinId,
      expression: "normal",
      position: { x: startX, y: PHYSICS.SPAWN_Y },
      angle: 0,
      isStacked: false,
    };

    this.state.nextShapeId = this.spawner.selectNextShape(this.forceShapeId);
    this.state.phase = "idle";
    this.horizontalDirection = 1;
  }

  onTap(): void {
    if (this.state.phase !== "idle" || !this.state.currentCat) return;

    const body = this.getBodyById(this.state.currentCat.bodyId);
    if (!body) return;

    this.state.currentCat.expression = "scared";
    this.spawner.dropCat(body);
    this.state.phase = "dropping";
  }

  update(): GameState {
    switch (this.state.phase) {
      case "idle":
        this.updateIdle();
        break;
      case "dropping":
        this.updateDropping();
        break;
      case "settling":
        this.updateSettling();
        break;
      case "collapsing":
        this.updateCollapsing();
        break;
      case "gameover":
        break;
    }

    this.updateCamera();
    this.syncPositions();
    return { ...this.state };
  }

  private updateIdle(): void {
    if (!this.state.currentCat) return;
    const body = this.getBodyById(this.state.currentCat.bodyId);
    if (!body) return;

    this.spawner.moveCatHorizontal(body, this.horizontalDirection);

    if (body.position.x >= SCREEN_WIDTH - 40) this.horizontalDirection = -1;
    if (body.position.x <= 40) this.horizontalDirection = 1;
  }

  private updateDropping(): void {
    this.physics.step();

    if (!this.state.currentCat) return;
    const body = this.getBodyById(this.state.currentCat.bodyId);
    if (!body) return;

    if (
      body.position.y > PHYSICS.SPAWN_Y + 50 &&
      Math.abs(body.velocity.y) < 2.0 &&
      body.speed < 3.0
    ) {
      this.state.phase = "settling";
      this.collapse.resetStableCount();
      this.collapse.recordHeight(this.physics.getHighestY());
    }
  }

  private updateSettling(): void {
    this.physics.step();

    const dynamicBodies = this.physics.getDynamicBodies();
    const currentHighestY = this.physics.getHighestY();
    const allStable = this.physics.isAllStable();

    const result = this.collapse.check(dynamicBodies, currentHighestY, allStable);

    switch (result) {
      case "stable":
        this.onStable();
        break;
      case "collapsed":
        this.onCollapse();
        break;
      case "settling":
        break;
    }
  }

  private updateCollapsing(): void {
    if (this.slowMotionFrames > 0) {
      this.physics.stepSlow(PHYSICS.COLLAPSE_SLOW_FACTOR);
      this.slowMotionFrames--;
    } else {
      this.state.phase = "gameover";
    }
  }

  private onStable(): void {
    if (!this.state.currentCat) return;

    this.state.currentCat.isStacked = true;
    this.state.currentCat.expression = "sleeping";
    this.state.stackedCats.push({ ...this.state.currentCat });

    this.state.catCount++;
    this.state.combo++;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);

    const heightPx = PHYSICS.GROUND_Y - this.physics.getHighestY();
    this.state.heightPx = heightPx;
    this.state.height = heightPx / 100;
    this.state.score = this.scorer.calculate(
      this.state.catCount,
      this.state.height,
      this.state.combo
    );

    if (this.state.stackedCats.length >= 2) {
      const below = this.state.stackedCats[this.state.stackedCats.length - 2];
      below.expression = "angry";
    }

    this.spawnNextCat();
  }

  private onCollapse(): void {
    this.state.phase = "collapsing";
    this.state.combo = 0;
    this.slowMotionFrames = Math.round(
      (PHYSICS.COLLAPSE_SLOW_DURATION / PHYSICS.TIMESTEP) *
        (1 / PHYSICS.COLLAPSE_SLOW_FACTOR)
    );

    for (const cat of this.state.stackedCats) {
      cat.expression = "shocked";
    }
    if (this.state.currentCat) {
      this.state.currentCat.expression = "shocked";
    }
  }

  private updateCamera(): void {
    const targetY = Math.min(
      0,
      -(PHYSICS.GROUND_Y - this.physics.getHighestY() - 300)
    );
    this.state.cameraY +=
      (targetY - this.state.cameraY) * PHYSICS.CAMERA_LERP;
  }

  private syncPositions(): void {
    for (const cat of this.state.stackedCats) {
      const body = this.getBodyById(cat.bodyId);
      if (body) {
        cat.position = { x: body.position.x, y: body.position.y };
        cat.angle = body.angle;
      }
    }
    if (this.state.currentCat) {
      const body = this.getBodyById(this.state.currentCat.bodyId);
      if (body) {
        this.state.currentCat.position = {
          x: body.position.x,
          y: body.position.y,
        };
        this.state.currentCat.angle = body.angle;
      }
    }
  }

  private getBodyById(id: number): Matter.Body | undefined {
    return this.physics
      .getDynamicBodies()
      .concat([this.physics.ground])
      .find((b) => b.id === id);
  }

  continueFromReward(): void {
    const { fallenBodies, remainingBodies } =
      this.collapse.classifyBodies(this.physics.getDynamicBodies());

    for (const body of fallenBodies) {
      this.physics.removeBody(body);
    }

    this.state.stackedCats = this.state.stackedCats.filter((cat) => {
      return remainingBodies.some((b) => b.id === cat.bodyId);
    });

    this.state.fallenCats = [];
    this.spawnNextCat();
  }

  destroy(): void {
    this.physics.destroy();
  }
}
