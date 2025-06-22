import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Avatar {
  id: number;
  url: string;
  angle: number;
  orbitRadius: number;
  yOffset: number; // Random y-offset for more natural distribution
  x: number; // Calculated x position
  y: number; // Calculated y position
  color: {
    border: string;
    glow: string;
  };
  isStatic: boolean; // Whether this avatar is always visible
  visible: boolean;  // Current visibility state
}

interface AvatarProps {
  avatar: Avatar;
  centerX: number;
  centerY: number;
  containerWidth: number;
  containerHeight: number;
}

// Calculate the visible arc of each orbit

// @ts-ignore
const getVisibleArcAngles = (
  radius: number, 
  containerWidth: number, 
  containerHeight: number
): { startAngle: number, endAngle: number } => {
  // Default to full circle
  const defaultArc = { startAngle: 0, endAngle: 2 * Math.PI };
  
  // Container dimensions might not be available initially
  if (!containerWidth || !containerHeight) return defaultArc;
  
  // Calculate half dimensions
  const halfWidth = containerWidth / 2;
  const halfHeight = containerHeight / 2;
  
  // If the orbit is fully contained within the viewport, return full circle
  if (radius <= Math.min(halfWidth, halfHeight)) {
    return defaultArc;
  }
  
  // Calculate visible arc based on container dimensions
  let startAngle, endAngle;
  
  // Handle horizontal bounds
  if (radius > halfWidth) {
    // Calculate the angle at which the orbit intersects the container edge
    const cosAngle = halfWidth / radius;
    // Clamp to valid range for arccos
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    const angle = Math.acos(clampedCos);
    
    startAngle = Math.PI - angle;
    endAngle = Math.PI + angle;
  } else {
    startAngle = 0;
    endAngle = 2 * Math.PI;
  }
  
  // Handle vertical bounds
  if (radius > halfHeight) {
    // Calculate the angle at which the orbit intersects the container edge
    const sinAngle = halfHeight / radius;
    // Clamp to valid range for arcsin
    const clampedSin = Math.max(-1, Math.min(1, sinAngle));
    const angle = Math.asin(clampedSin);
    
    // Restrict the arc if needed
    startAngle = Math.max(startAngle, Math.PI + angle);
    endAngle = Math.min(endAngle, 2 * Math.PI - angle);
  }
  
  return { startAngle, endAngle };
};

// Random number between min and max
const randomBetween = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

// Generate a random number with normal distribution
const normalRandom = (mean: number, stdDev: number): number => {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
};

// Check if two avatars are colliding
const checkCollision = (
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number, 
  minDistance: number
): boolean => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < minDistance;
};

const generateAvatars = (containerWidth = 1200, containerHeight = 380): Avatar[] => {
  const colors = [
    { border: '#00ff66', glow: 'rgba(0, 255, 102, 0.5)' },    // Green
    { border: '#9333ea', glow: 'rgba(147, 51, 234, 0.5)' },   // Purple
    { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },   // Blue
    { border: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' }    // Orange
  ];

  const avatars: Avatar[] = [];
  let idCounter = 0;
  
  // Center of container
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  
  // Avatar size for collision detection
  const avatarSize = 64;
  // Increase collision distance to prevent tight clustering
  const collisionDistance = avatarSize * 1.2; 

  // Define orbits with increasing avatar density
  const orbits = [
    { radius: 150, avatarCount: 3, staticCount: 1, yOffsetStdDev: 20 },    // Inner orbit - even fewer avatars
    { radius: 230, avatarCount: 4, staticCount: 1, yOffsetStdDev: 30 },    // Second orbit - fewer avatars
    { radius: 310, avatarCount: 8, staticCount: 2, yOffsetStdDev: 40 },    // Third orbit - moderate number
    { radius: 390, avatarCount: 12, staticCount: 2, yOffsetStdDev: 50 },   // Fourth orbit - more avatars
    { radius: 470, avatarCount: 16, staticCount: 2, yOffsetStdDev: 60 }    // Fifth orbit - most avatars
  ];

  // Special zone around Pi symbol where avatars are not allowed
  const piZoneRadius = 100;

  // Generate avatars for each orbit
  orbits.forEach((orbit, orbitIndex) => {
    // Use full 360° for avatar placement
    const startAngle = 0;
    const endAngle = 2 * Math.PI;
    const arcLength = endAngle - startAngle;
    
    // Distribute avatars evenly around the full orbit
    const angleStep = arcLength / orbit.avatarCount;
    
    for (let i = 0; i < orbit.avatarCount; i++) {
      // Calculate the angle within the full orbit
      const baseAngle = startAngle + (i * angleStep);
      
      // Try to place avatar without collisions
      let placed = false;
      let attempts = 0;
      let newAvatar: Avatar | null = null;
      
      while (!placed && attempts < 15) { // Increase max attempts to find better placement
        // Add some randomness to the angle (but keep it within its sector)
        const randomizedAngle = baseAngle + randomBetween(-0.2, 0.2) * angleStep;
        
        // Random radius variation
        const radiusVariation = randomBetween(-15, 15);
        const finalRadius = orbit.radius + radiusVariation;
        
        // Random y-offset with normal distribution
        // Reduce for inner orbits to prevent clustering near Pi
        const yOffsetMultiplier = orbitIndex < 2 ? 0.5 : 1.0;
        const yOffset = normalRandom(0, orbit.yOffsetStdDev * yOffsetMultiplier);
        
        // Calculate position
        const x = centerX + Math.cos(randomizedAngle) * finalRadius;
        const y = centerY + Math.sin(randomizedAngle) * finalRadius + yOffset;
        
        // Check if position is within container bounds
        const isWithinBounds = 
          x >= avatarSize/2 && 
          x <= containerWidth - avatarSize/2 && 
          y >= avatarSize/2 && 
          y <= containerHeight - avatarSize/2;
        
        // Check if too close to Pi symbol
        const distanceToPi = Math.sqrt(
          Math.pow(x - centerX, 2) + 
          Math.pow(y - centerY, 2)
        );
        const isTooCloseToCenter = distanceToPi < piZoneRadius;
        
        // Check for collisions with existing avatars
        const collides = avatars.some(avatar => 
          checkCollision(x, y, avatar.x, avatar.y, collisionDistance)
        );
        
        if (isWithinBounds && !isTooCloseToCenter && !collides) {
          // If no collision, create the avatar
          const seed = `avatar${idCounter + 1}`;
          const isStatic = i < orbit.staticCount;
          
          newAvatar = {
            id: idCounter++,
            url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=transparent`,
            angle: randomizedAngle,
            orbitRadius: finalRadius,
            yOffset,
            x,
            y,
            color: colors[idCounter % colors.length],
            isStatic: isStatic,
            visible: Math.random() > 0.4 || isStatic // 60% start visible, all static ones do
          };
          
          placed = true;
        }
        
        attempts++;
      }
      
      // If we couldn't place without collision after max attempts, just place it anyway
      // but ensure it's within bounds and not too close to Pi
      if (!placed) {
        // Try a different approach - place at angle but with adjusted radius to fit in container
        const randomizedAngle = baseAngle + randomBetween(-0.1, 0.1) * angleStep;
        
        // Calculate maximum radius that would keep avatar in bounds at this angle
        const cosAngle = Math.cos(randomizedAngle);
        const sinAngle = Math.sin(randomizedAngle);
        
        // Start with orbit radius, but ensure it's not too close to Pi
        let adjustedRadius = Math.max(orbit.radius, piZoneRadius + avatarSize/2);
        
        // Horizontal bounds
        if (cosAngle !== 0) {
          const horizontalLimit = cosAngle > 0 
            ? (containerWidth - avatarSize/2 - centerX) / cosAngle
            : (avatarSize/2 - centerX) / cosAngle;
          adjustedRadius = Math.min(adjustedRadius, Math.abs(horizontalLimit));
        }
        
        // Vertical bounds
        if (sinAngle !== 0) {
          const verticalLimit = sinAngle > 0
            ? (containerHeight - avatarSize/2 - centerY) / sinAngle
            : (avatarSize/2 - centerY) / sinAngle;
          adjustedRadius = Math.min(adjustedRadius, Math.abs(verticalLimit));
        }
        
        // Apply radius with some variation but within bounds
        const finalRadius = Math.min(orbit.radius, adjustedRadius * 0.9) + randomBetween(-10, 10);
        
        // Reduced y-offset for fallback placements to ensure better visibility
        const yOffset = normalRandom(0, orbit.yOffsetStdDev * 0.5);
        
        // Calculate final position
        const x = centerX + Math.cos(randomizedAngle) * finalRadius;
        const y = centerY + Math.sin(randomizedAngle) * finalRadius + yOffset;
        
        // Ensure coordinates are within bounds and far enough from Pi
        const distanceToPi = Math.sqrt(
          Math.pow(x - centerX, 2) + 
          Math.pow(y - centerY, 2)
        );
        
        // If too close to Pi, adjust radius outward
        const boundedX = distanceToPi < piZoneRadius 
          ? centerX + Math.cos(randomizedAngle) * (piZoneRadius + avatarSize/2)
          : Math.max(avatarSize/2, Math.min(containerWidth - avatarSize/2, x));
          
        const boundedY = distanceToPi < piZoneRadius
          ? centerY + Math.sin(randomizedAngle) * (piZoneRadius + avatarSize/2) + yOffset
          : Math.max(avatarSize/2, Math.min(containerHeight - avatarSize/2, y));
        
        const seed = `avatar${idCounter + 1}`;
        const isStatic = i < orbit.staticCount;
        
        // Check again for collisions with the final position
        const finalX = boundedX;
        const finalY = boundedY;
        const collides = avatars.some(avatar => 
          checkCollision(finalX, finalY, avatar.x, avatar.y, collisionDistance)
        );
        
        // Only add if it doesn't collide with existing avatars
        if (!collides) {
          newAvatar = {
            id: idCounter++,
            url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=transparent`,
            angle: randomizedAngle,
            orbitRadius: finalRadius,
            yOffset,
            x: finalX,
            y: finalY,
            color: colors[idCounter % colors.length],
            isStatic: isStatic,
            visible: Math.random() > 0.4 || isStatic
          };
        }
      }
      
      if (newAvatar) {
        avatars.push(newAvatar);
      }
    }
  });

  return avatars;
};

// @ts-ignore
const Avatar: React.FC<AvatarProps> = ({ avatar, centerX, centerY, containerWidth, containerHeight }) => {
  // Avatar size
  const avatarSize = 64;
  const avatarRadius = avatarSize / 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        left: avatar.x - avatarRadius,
        top: avatar.y - avatarRadius,
        width: `${avatarSize}px`,
        height: `${avatarSize}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: `2px solid ${avatar.color.border}`,
        boxShadow: `0 0 15px ${avatar.color.glow}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px',
        zIndex: 5
      }}
    >
      <img
        src={avatar.url}
        alt={`Avatar ${avatar.id}`}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          objectFit: 'contain'
        }}
      />
    </motion.div>
  );
};

export const SectionPiOrbit = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 380 });
  const [avatars, setAvatars] = useState<Avatar[]>(() => generateAvatars());

  // Update avatar visibility
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setAvatars(prev => 
        prev.map(avatar => {
          // Don't change static avatars
          if (avatar.isStatic) return avatar;
          
          // For dynamic avatars: 
          // - 3% chance to appear if invisible
          // - 2% chance to disappear if visible
          if (!avatar.visible && Math.random() < 0.03) {
            return { ...avatar, visible: true };
          } else if (avatar.visible && Math.random() < 0.02) {
            return { ...avatar, visible: false };
          }
          return avatar;
        })
      );
    }, 500);

    return () => clearInterval(updateInterval);
  }, []);

  // Update dimensions and regenerate avatars on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        // Regenerate avatars with the new dimensions to redistribute them
        setAvatars(generateAvatars(width, height));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <>
      {/* Avatar Section */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100vw',
          height: '380px',
          margin: '0 auto',
          marginTop: '0', // Remove gap since we now have a matrix divider
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw'
        }}
      >
        {/* Orbit Rings - with green gradients */}
        {[150, 230, 310, 390, 470].map((radius, _index) => (
          <div
            key={radius}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: radius * 2,
              height: radius * 2,
              borderRadius: '50%',
              border: 'none',
              background: `
                radial-gradient(
                  circle at center,
                  transparent ${radius - 1}px,
                  rgba(0, 255, 102, 0.1) ${radius}px,
                  rgba(0, 255, 102, 0.05) ${radius + 1}px,
                  transparent ${radius + 2}px
                )
              `,
              boxShadow: `
                0 0 40px rgba(0, 255, 102, 0.05),
                inset 0 0 40px rgba(0, 255, 102, 0.05)
              `,
              zIndex: 1
            }}
          />
        ))}

        {/* Add a horizontal glow effect that extends across the full width */}
        <div
          style={{
            position: 'absolute',
            left: '0',
            right: '0',
            top: '50%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 102, 0.1) 30%, rgba(0, 255, 102, 0.2) 50%, rgba(0, 255, 102, 0.1) 70%, transparent 100%)',
            boxShadow: '0 0 20px 5px rgba(0, 255, 102, 0.2)',
            zIndex: 2
          }}
        />

        {/* Center Pi Symbol */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            margin: 'auto',
            width: '100px',
            height: '100px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            background: 'radial-gradient(circle at center, rgba(0, 255, 102, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        >
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '80px',
            fontFamily: 'VT323, monospace',
            color: '#00ff66',
            textShadow: `
              0 0 10px #00ff66,
              0 0 20px #00ff66,
              0 0 40px #00ff66
            `,
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            userSelect: 'none'
          }}>
            π
          </div>
        </motion.div>

        {/* Avatars with AnimatePresence for smooth enter/exit */}
        <AnimatePresence>
          {avatars.map((avatar) => avatar.visible && (
            <Avatar 
              key={avatar.id} 
              avatar={avatar} 
              centerX={dimensions.width / 2}
              centerY={dimensions.height / 2}
              containerWidth={dimensions.width}
              containerHeight={dimensions.height}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
