import * as PIXI from 'pixi.js';

interface MapBackgroundProps {
  key: number;
  SizeFactor: number;
  OffsetX: number;
  OffsetY: number;
}

export default class MapBackground extends PIXI.Sprite {
  constructor(mapProps: MapBackgroundProps, apiURL: string) {
    let { key, SizeFactor, OffsetX, OffsetY } = mapProps;

    const url = `${apiURL.replace('query', 'map')}/${key}`;
    const scaleFactor = SizeFactor / 100;
    const texture = PIXI.Texture.from(url);
    super(texture)

    const size = 2048/scaleFactor;
    this.anchor.x = 0.5;
    this.anchor.y = 0.5;
    this.height = size;
    this.width = size;
    this.position.x = -OffsetX;
    this.position.y = -OffsetY;
  }

  dispose() {
    this.destroy({children: true});
  }
}