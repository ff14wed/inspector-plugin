import * as PIXI from 'pixi.js';

import { Colors } from '@blueprintjs/core';
import Entity, { CastingInfo } from '../store/entity';

function extractAngle(omen: string) {
  let re = /gl_fan(\d+)/;
  let match = re.exec(omen);
  if (!match || match.length < 2) {
    return 0;
  }
  return Number(match[1]);
}

const remapCast = (castingInfo: CastingInfo) => {
  switch (castingInfo.actionID) {
    case 6635:
    case 6665:
    case 6885:
      return Object.assign({ ...castingInfo }, {
        xAxisModifier: 16,
        effectRange: 100,
        castType: 11,
      });
    case 6637:
      return Object.assign({ ...castingInfo }, {
        castType: 10,
      });
    case 13061:
    case 13062:
    case 13063:
    case 13103:
    case 13104:
    case 13105:
    case 13059:
    case 13060:
    case 13106:
    case 13107:
      return Object.assign({ ...castingInfo }, {
        castType: 4,
      });
    case 13108:
      return Object.assign({ ...castingInfo }, {
        castType: 3,
      });
  }
  return castingInfo;
};

const knownFans: { [k: number]: number } = {
  12898: 210,
  12899: 210,
  12900: 210,
  12901: 210,
  12904: 210,
  12905: 210,
  13108: 330,
};

type TelegraphType = "" | "rectangle" | "cross" | "fan" | "circle" | "halo";

export default class Telegraph extends PIXI.Sprite {
  public telegraphTexture?: PIXI.RenderTexture;
  public telegraphType?: TelegraphType;

  constructor(castingEntity: Entity, renderer: PIXI.Renderer, rotationOffset: number) {
    if (!castingEntity.castingInfo) {
      super();
      return;
    }

    let {
      actionID, castType, effectRange, xAxisModifier, omen, target, location
    } = remapCast(castingEntity.castingInfo);

    let additionalRange = 0;
    if (target) {
      additionalRange = target.radius;
    }

    let graphics = new PIXI.Graphics();
    graphics.beginFill(0xffffff, 0.2);
    graphics.lineStyle(16, 0xffffff, 1, 0);

    effectRange += additionalRange;

    let telegraphType: TelegraphType = "";
    switch (castType) {
      case 4:
      case 8:
      case 12:
        telegraphType = "rectangle";
        graphics.drawRect(0, 0, 1024, 1024);
        break;
      case 3:
      case 13:
        let angle = extractAngle(omen)
        if (actionID in knownFans) {
          angle = knownFans[actionID];
        }
        if (angle === 0) {
          break;
        }
        let radAngle = (angle / 180) * Math.PI;
        telegraphType = "fan";
        graphics.moveTo(512, 512);
        graphics.arc(512, 512, 512, -radAngle / 2, radAngle / 2);
        graphics.closePath();
        break;
      case 2:
      case 5:
      case 6:
      case 7:
        telegraphType = "circle";
        graphics.drawCircle(512, 512, 512);
        graphics.closePath();
        break;
      case 10:
        telegraphType = "halo";
        graphics.drawCircle(512, 512, 512);
        graphics.closePath();

        // Size is not accurate, but enough to get the point across
        graphics.beginHole();
        graphics.drawCircle(512, 512, 128);
        graphics.closePath();
        graphics.endHole();
        break;
      case 11:
        telegraphType = "cross";
        graphics.drawRect(0, 0, 1024, 1024);
        break;
    }

    if (telegraphType === "") {
      super();
      return;
    }

    const baseRenderTex = new PIXI.BaseRenderTexture({
      width: 1024,
      height: 1024,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    });

    const telegraphTexture = new PIXI.RenderTexture(baseRenderTex);
    renderer.render(graphics, telegraphTexture, false);

    super(telegraphTexture);
    this.telegraphTexture = telegraphTexture;
    this.telegraphType = telegraphType;

    let color = Colors.COBALT5;
    if (castingEntity.isEnemy) {
      color = Colors.VERMILION3;
    }
    switch (telegraphType) {
      case "cross":
      case "rectangle":
        this.anchor.x = 0.5;
        this.anchor.y = 0;
        this.width = xAxisModifier;
        this.height = effectRange;
        this.rotation = - location.orientation + Math.PI;
        break;
      case "fan":
      case "halo":
      case "circle":
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.width = effectRange * 2;
        this.height = effectRange * 2;
        this.rotation = - location.orientation - Math.PI / 2;
    }

    if (rotationOffset) {
      this.rotation = this.rotation + rotationOffset;
    }

    this.position.x = location.x;
    this.position.y = location.z;
    this.tint = parseInt(color.substring(1), 16);
  }

  createCompositeTelegraph(castingEntity: Entity, renderer: PIXI.Renderer): PIXI.DisplayObject | undefined {
    if (this.telegraphTexture) {
      if (this.telegraphType === "cross") {
        let crossContainer = new PIXI.Container();
        let subSprite1 = new Telegraph(castingEntity, renderer, Math.PI / 2);
        let subSprite2 = new Telegraph(castingEntity, renderer, -Math.PI / 2);
        let subSprite3 = new Telegraph(castingEntity, renderer, Math.PI);
        crossContainer.addChild(this);
        crossContainer.addChild(subSprite1);
        crossContainer.addChild(subSprite2);
        crossContainer.addChild(subSprite3);
        return crossContainer;
      }
      return this;
    }
  }

  destroy() {
    if (this.telegraphTexture) { this.telegraphTexture.destroy(true); }
    super.destroy({ children: true, texture: true, baseTexture: true });
  }
}
