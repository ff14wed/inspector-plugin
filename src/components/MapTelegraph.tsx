import * as PIXI from 'pixi.js';

import { Colors } from '@blueprintjs/core';
import Entity from '../store/entity';

function extractAngle(omen: string) {
  let re = /gl_fan(\d+)/;
  let match = re.exec(omen);
  if (!match || match.length < 2) {
    return 0;
  }
  return Number(match[1]);
}

const knownCasts: { [k: number]: number } = {
  13061: 4,
  13062: 4,
  13063: 4,
  13103: 4,
  13104: 4,
  13105: 4,
  13059: 4,
  13060: 4,
  13106: 4,
  13107: 4,
  13108: 3,
};

const knownFans: { [k: number]: number }= {
  0x3262: 210,
  0x3263: 210,
  0x3264: 210,
  0x3265: 210,
  12904: 210,
  12905: 210,
  13108: 330,
};

export default class Telegraph extends PIXI.Sprite {
  public telegraphTexture?: PIXI.RenderTexture;

  constructor(castingEntity: Entity, renderer: PIXI.Renderer) {
    if (!castingEntity.castingInfo) {
      super();
      return;
    }

    let {
      actionID, castType, effectRange, xAxisModifier, omen, target, location
    } = castingEntity.castingInfo;

    let additionalRange = 0;
    if (target) {
      additionalRange = target.radius;
    }

    let graphics = new PIXI.Graphics();
    graphics.beginFill(0xffffff, 0.2);
    graphics.lineStyle(16, 0xffffff, 1, 0);

    effectRange += additionalRange;

    if (actionID in knownCasts) {
      castType = knownCasts[actionID];
    }
    let telegraphType = "";
    switch (castType) {
      case 4:
        telegraphType = "rectangle";
        graphics.drawRect(0, 0, 1024, 1024);
        break;
      case 3:
        let angle = extractAngle(omen)
        if (actionID in knownFans) {
          angle = knownFans[actionID];
        }
        if (angle === 0) {
          break;
        }
        let radAngle = (angle/180)*Math.PI;
        telegraphType = "fan";
        graphics.moveTo(512, 512);
        graphics.arc(512, 512, 512, -radAngle/2, radAngle/2);
        graphics.closePath();
        break;
      case 2:
      case 5:
      case 7:
        telegraphType = "circle";
        graphics.drawCircle(512, 512, 512);
        graphics.closePath();
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

    let color = Colors.COBALT5;
    if (castingEntity.isEnemy) {
      color = Colors.VERMILION3;
    }
    switch(telegraphType) {
      case "rectangle":
        this.anchor.x = 0.5;
        this.anchor.y = 0;
        this.width = xAxisModifier;
        this.height = effectRange;
        this.rotation = - location.orientation + Math.PI;
        break;
      case "fan":
      case "circle":
        this.anchor.x = 0.5;
        this.anchor.y = 0.5;
        this.width = effectRange * 2;
        this.height = effectRange * 2;
        this.rotation = - location.orientation - Math.PI/2;
    }

    this.position.x = location.x;
    this.position.y = location.z;
    this.tint =  parseInt(color.substring(1), 16);
  }

  dispose() {
    if (this.telegraphTexture) { this.telegraphTexture.destroy(true); }
    this.destroy({ children: true, texture: true, baseTexture: true });
  }
}