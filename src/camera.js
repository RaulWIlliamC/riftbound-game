export class Camera {
  constructor(player) { this.x = player.x; this.y = player.y; }
  setViewport(width, height, bounds) {
    this.viewport = { width, height, bounds };
    this.clampToImage();
  }
  clampToImage() {
    if (!this.viewport) return;
    const { width, height, bounds } = this.viewport;
    const clampAxis = (position, size, start, end) => {
      if (size >= Math.floor(end) - Math.ceil(start)) return (start + end) / 2;
      // Match pixel-rounded drawing and avoid revealing a fractional strip outside the image.
      return Math.max(Math.ceil(start) + size / 2, Math.min(Math.floor(end) - size / 2, position));
    };
    this.x = clampAxis(this.x, width, bounds.left, bounds.right);
    this.y = clampAxis(this.y, height, bounds.top, bounds.bottom);
  }
  update(dt, player) {
    const blend = 1 - Math.exp(-10 * dt);
    this.x += (player.x - this.x) * blend;
    this.y += (player.y - this.y) * blend;
    this.clampToImage();
  }
  screenToWorld(pointer, width, height) {
    // Match the exact pixel-rounded translation used to draw the arena.
    return {x:pointer.x-Math.round(width/2-this.x),y:pointer.y-Math.round(height/2-this.y)};
  }
}
