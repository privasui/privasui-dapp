import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/collection';

export function generateAvatar(): string {
    const avatar = createAvatar(pixelArt, {
      seed: Math.random().toString(),
      radius: 0,
      backgroundColor: ["00FF00"],
      scale: 100,
      size: 128
    });
    
     return avatar.toString();
}