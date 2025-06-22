import { useEffect, useRef } from 'react';

interface MatrixDividerProps {
  height?: number;
}

export function MatrixDivider({ height = 50 }: MatrixDividerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to full width and custom height
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = height; // Use the prop value
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters and settings
    const chars = '0123456789ABCDEF';
    const fontSize = 12; // Slightly larger font for better visibility
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];

    // Initialize drops with random starting positions
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * 6) * -1; // Start closer to top
    }

    // Electric green variants
    const greenColors = [
      '#00ff00', // Standard matrix green
      '#00ff33', // Slightly lighter
      '#33ff66', // Lighter mint green
      '#66ff99', // Very light green
      '#00cc00', // Slightly darker green
    ];

    const drawRain = () => {
      // Semi-transparent black background for fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // More transparent for faster fade
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw matrix characters
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random green shade for each character
        ctx.fillStyle = greenColors[Math.floor(Math.random() * greenColors.length)];
        
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        // Update drop position
        drops[i] += 0.35; // Slower drop rate for more subtle effect
        
        // Reset drop with random delay when it reaches bottom
        if (y > canvas.height && Math.random() > 0.90) {
          drops[i] = 0;
        }
      }
    };

    // Main animation loop
    const interval = setInterval(drawRain, 33); // ~30fps

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [height]); // Add height to dependencies

  return (
    <div 
      style={{
        position: 'relative',
        display: 'block',
        width: '100vw',
        height: `${height}px`, // Use the prop value
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'black',
        overflow: 'hidden',
        boxShadow: '0 0 10px rgba(0, 255, 102, 0.3)', // Add subtle glow
        borderRadius: '2px' // Slight rounded edges
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
} 