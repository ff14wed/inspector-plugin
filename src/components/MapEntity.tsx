import * as PIXI from 'pixi.js';

import { Colors } from '@blueprintjs/core';

import { observe } from 'mobx';

import Entity from '../store/entity';
import { InspectorOptions } from '../store/stream';

function getColor(entity: Entity) {
  if (entity.isEnemy && entity.hasTarget) {
    return Colors.RED3;
  } else if (entity.isEnemy) {
    return Colors.VIOLET3;
  } else if (entity.isNPC) {
    return Colors.FOREST3;
  }
  return Colors.COBALT3;
}

const coneCanvas = (() => {
  var canvas = document.createElement('canvas')
  canvas.width = 512;
  canvas.height = 512;
  var ctx = canvas.getContext('2d')!;

  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.arc(0, 256, 256, -Math.PI / 6, Math.PI / 6);
  ctx.lineTo(0, 256);

  var gradient = ctx.createLinearGradient(0, 0, 230, 0);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fill();
  return canvas;
})();

const selectIndicatorCanvas = (() => {
  var canvas = document.createElement('canvas')
  canvas.width = 512;
  canvas.height = 512;
  var ctx = canvas.getContext('2d')!;
  ctx.arc(256, 256, 200, 0, 2 * Math.PI);
  ctx.lineWidth = 50;
  ctx.strokeStyle = "#FF0000";
  ctx.stroke();
  return canvas;
})();

const entityCircleCanvas = (() => {
  var canvas = document.createElement('canvas')
  canvas.width = 1024;
  canvas.height = 1024;

  var ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = 'round';

  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(512, 512, 512, 0, 2 * Math.PI);
  ctx.fill();

  ctx.globalAlpha = 1.0;
  ctx.lineWidth = 32;

  ctx.beginPath();
  ctx.arc(512, 512, 512 - (ctx.lineWidth / 2), 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(512, 512, 512 - (ctx.lineWidth / 2), 1.25 * Math.PI, 1.75 * Math.PI);
  ctx.stroke();

  ctx.lineWidth = 64;
  ctx.beginPath();
  ctx.arc(512, 512, 512 - (ctx.lineWidth / 2), 1.75 * Math.PI, 0.25 * Math.PI);
  ctx.stroke();

  ctx.lineWidth = 128;
  ctx.beginPath();
  ctx.arc(512, 512, 512 - (ctx.lineWidth / 2), 1.9 * Math.PI, 0.1 * Math.PI);
  ctx.stroke();

  return canvas;
})();

const createCone = () => {
  let cone = new PIXI.Sprite(new PIXI.Texture(new PIXI.BaseTexture(coneCanvas)));
  cone.height = 100 * 512;
  cone.width = 100 * 512;
  cone.anchor.x = 0;
  cone.anchor.y = 0.5;
  return cone;
};

const createSelectorIndicator = () => {
  let marker = new PIXI.Sprite(new PIXI.Texture(new PIXI.BaseTexture(selectIndicatorCanvas)));
  marker.height = 1.7 * 1024;
  marker.width = 1.7 * 1024;
  marker.anchor.x = 0.5;
  marker.anchor.y = 0.5;
  return marker;
};

export default class MapEntity extends PIXI.Sprite {
  private targetObserverDispose?: () => void;
  private locationObserverDispose?: () => void;
  private interpLocationObserverDispose?: () => void;
  private castingObserverDispose?: () => void;
  private hiddenObserverDispose?: () => void;

  private baseEntity: Entity;
  private options: InspectorOptions;

  private selector?: PIXI.Sprite;

  constructor(
    entity: Entity,
    telegraphUpdated: () => void,
    options: InspectorOptions,
  ) {
    super(new PIXI.Texture(new PIXI.BaseTexture(entityCircleCanvas)));
    this.baseEntity = entity;
    this.options = options;

    if (entity.index === 0) {
      this.addChild(createCone());
    }
    const radius = this.baseEntity.radius;
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.height = radius * 2;
    this.width = radius * 2;

    this.interactive = true;
    this.interactiveChildren = false;
    this.cursor = 'pointer';

    this.targetUpdated();
    this.locationUpdated();
    this.interpLocationUpdated();
    telegraphUpdated();

    this.targetObserverDispose = observe(this.baseEntity, "target", this.targetUpdated);
    this.locationObserverDispose = observe(this.baseEntity, "location", this.locationUpdated);
    this.interpLocationObserverDispose = observe(this.baseEntity, "interpLocation", this.interpLocationUpdated);
    this.castingObserverDispose = observe(this.baseEntity, "castingInfo", telegraphUpdated);
    this.hiddenObserverDispose = observe(this.baseEntity, "isHidden", this.hiddenUpdated);
  }

  locationUpdated = () => {
    let { x, z, orientation } = this.baseEntity.location;
    if (!this.options.locationInterpolation) {
      this.position.x = x;
      this.position.y = z;
    }
    this.rotation = -Math.PI / 2 - orientation;
  }

  interpLocationUpdated = () => {
    if (!this.options.locationInterpolation) {
      return;
    }
    let { x, z } = this.baseEntity.interpLocation;
    this.position.x = x;
    this.position.y = z;
  }

  targetUpdated = () => {
    const color = getColor(this.baseEntity);
    this.tint = parseInt(color.substring(1), 16);
  }

  hiddenUpdated = () => {
    this.visible = !this.baseEntity.isHidden;
  }

  select = () => {
    this.selector = createSelectorIndicator();
    this.addChild(this.selector);
  }

  unselect = () => {
    if (this.selector) {
      this.removeChild(this.selector);
      this.selector = undefined;
    }
  }

  dispose() {
    this.destroy({ children: true });

    if (this.targetObserverDispose) { this.targetObserverDispose(); }
    if (this.locationObserverDispose) { this.locationObserverDispose(); }
    if (this.interpLocationObserverDispose) { this.interpLocationObserverDispose(); }
    if (this.castingObserverDispose) { this.castingObserverDispose(); }
  }
}
