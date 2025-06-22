import { useEffect, useRef } from 'react';

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters
    const chars = '0123456789ABCDEF';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / fontSize) * -1;
    }

    // Animation state
    let animationState = 'just_rain'; // 'just_rain', 'glitching', 'displaying_quote', 'dissolving'
    let stateTimer = 0;
    const quoteShowDelay = 3000; // When to first start glitching effect
    const glitchDuration = 3000; // How long the glitching effect lasts
    const quoteDisplayDuration = 7000; // How long to display the quote
    const dissolveDuration = 2000; // FASTER DISSOLVE: 2 seconds instead of 3

    // Electric green variants - more vibrant greens
    const greenColors = [
      '#00ff00', // Standard matrix green
      '#00ff33', // Slightly lighter
      '#33ff66', // Lighter mint green
      '#66ff99', // Very light green
      '#00cc00', // Slightly darker green
    ];

    // Enhanced collection of privacy quotes with new tagline
    const quotes = [
      {
        text: "\"Privacy is not something that I'm merely entitled to, it's an absolute prerequisite for a meaningful life.\"",
        attribution: "— Edward Snowden"
      },
      {
        text: "\"Privacy is the power to selectively reveal oneself to the world.\"",
        attribution: "— Eric Hughes, Cypherpunk Manifesto"
      },
      {
        text: "\"When privacy is criminalized, only criminals will have privacy.\"",
        attribution: "— Phil Zimmermann"
      },
      {
        text: "\"Privacy is necessary for an open society in the electronic age.\"",
        attribution: "— Eric Hughes"
      },
      {
        text: "\"The right to be let alone is the foundation of all freedom.\"",
        attribution: "— Justice William O. Douglas"
      },
      {
        text: "\"Privacy isn't about something to hide. It's about something to protect.\"",
        attribution: "— Bruce Schneier"
      },
      {
        text: "\"Cryptography shifts the balance of power toward those who understand it.\"",
        attribution: "— Jacob Appelbaum"
      },
      {
        text: "\"The more you give away, the less power you have.\"",
        attribution: "— Jaron Lanier"
      },
    ];

    // Current quote and prepared lines
    let currentQuote = quotes[0];
    let quoteLines: string[] = [];
    let quotePositions: {
      x: number, 
      y: number, 
      char: string, 
      originalChar: string, 
      state: number, 
      glitchIntensity: number,
      pixelSize: number,
      useWhite: boolean,
      greenVariant: string
    }[] = [];
    
    // Function to draw pixelated rectangle
    const drawPixelatedRect = (x: number, y: number, width: number, height: number, color: string) => {
      ctx.fillStyle = color;
      // Snap to pixel grid for more pixelated look
      const snapX = Math.floor(x);
      const snapY = Math.floor(y);
      const snapWidth = Math.ceil(width);
      const snapHeight = Math.ceil(height);
      
      ctx.fillRect(snapX, snapY, snapWidth, snapHeight);
    };
    
    // Improved quote preparation with better line breaking
    const prepareQuote = () => {
      // Select a random quote
      currentQuote = quotes[Math.floor(Math.random() * quotes.length)];
      
      // Parse quote into lines with improved line breaking
      quoteLines = [];
      const biggerFontSize = 24; // Slightly larger for better readability
      ctx.font = `bold ${biggerFontSize}px monospace`; // Bold for better visibility
      
      const maxLineLength = Math.min(Math.floor(canvas.width * 0.7 / biggerFontSize), 50); // Character-based limit
      
      // Split quote into words
      const words = currentQuote.text.split(' ');
      let currentLine = '';
      
      // Build lines based on word boundaries and max line length
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (testLine.length > maxLineLength && currentLine) {
          quoteLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) quoteLines.push(currentLine);
      quoteLines.push(''); // Space before attribution
      quoteLines.push(currentQuote.attribution);
      
      // Calculate positions with improved vertical centering
      quotePositions = [];
      const lineHeight = biggerFontSize * 1.5;
      const totalHeight = quoteLines.length * lineHeight;
      const startY = canvas.height / 2 - totalHeight / 2 + biggerFontSize;
      
      quoteLines.forEach((line, lineIndex) => {
        // Calculate line width for better centering
        const lineWidth = ctx.measureText(line).width;
        const startX = canvas.width / 2 - lineWidth / 2;
        
        for (let i = 0; i < line.length; i++) {
          const x = startX + ctx.measureText(line.substring(0, i)).width;
          const y = startY + lineIndex * lineHeight;
          
          // State: 0=not visible, 1=glitching, 2=fixed
          quotePositions.push({
            x,
            y,
            char: chars[Math.floor(Math.random() * chars.length)],
            originalChar: line[i],
            state: 0,
            glitchIntensity: 0.5 + Math.random() * 0.5,
            pixelSize: 1 + Math.floor(Math.random() * 3),
            useWhite: Math.random() < 0.2, // Reduced white frequency for more green
            greenVariant: greenColors[Math.floor(Math.random() * greenColors.length)]
          });
        }
      });
      
      // Randomize the activation order
      for (let i = quotePositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [quotePositions[i], quotePositions[j]] = [quotePositions[j], quotePositions[i]];
      }
    };

    const drawRain = () => {
      // Black BG with opacity for fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green text
      ctx.fillStyle = '#00ff00';
      ctx.font = `${fontSize}px monospace`;

      // Draw matrix characters
      for (let i = 0; i < drops.length; i++) {
        // Varying green shades for more electric look
        ctx.fillStyle = greenColors[Math.floor(Math.random() * 3)];
        
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        drops[i]++;
        
        // Reset when drops reach bottom with randomized delay
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
      }
    };

    const drawGlitchingQuote = (progress: number) => {
      // How many particles to activate based on progress
      const activationCount = Math.ceil(quotePositions.length * progress * 1.5);
      
      // Activate more particles as the animation progresses
      for (let i = 0; i < activationCount && i < quotePositions.length; i++) {
        if (quotePositions[i].state === 0) {
          quotePositions[i].state = 1;
        }
      }
      
      // Font setup
      const biggerFontSize = 24;
      ctx.font = `bold ${biggerFontSize}px monospace`;
      
      // Draw each character
      quotePositions.forEach(pos => {
        if (pos.state === 1) { // Glitching state
          // Random matrix character or original based on progress
          if (Math.random() < progress * 0.5) {
            pos.char = pos.originalChar;
          } else {
            pos.char = chars[Math.floor(Math.random() * chars.length)];
          }
          
          // Pixelated position jitter (more pronounced at beginning)
          const jitterAmount = 6 * (1 - Math.min(1, progress * 2));
          const offsetX = Math.floor((Math.random() - 0.5) * jitterAmount) * 2; // Snap to even pixels
          const offsetY = Math.floor((Math.random() - 0.5) * jitterAmount) * 2;
          
          // Color selection - more intense electric green variations
          if (pos.useWhite && Math.random() < 0.3) {
            ctx.fillStyle = '#ffffff'; // White glitch
          } else {
            // Random green variant with brightness boost
            const green = pos.greenVariant;
            // Occasionally boost brightness for electric effect
            if (Math.random() < 0.2) {
              ctx.fillStyle = '#7fff7f'; // Bright flash
            } else {
              ctx.fillStyle = green;
            }
          }
          
          // Draw the character
          ctx.fillText(pos.char, pos.x + offsetX, pos.y + offsetY);
          
          // Add pixel artifacts around the character
          if (Math.random() < 0.3) {
            const pixelCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < pixelCount; i++) {
              const pixelX = pos.x + (Math.random() - 0.5) * 15;
              const pixelY = pos.y + (Math.random() - 0.5) * 15;
              const pixelSize = 1 + Math.floor(Math.random() * pos.pixelSize);
              
              // More electric green for pixels
              const pixelColor = Math.random() < 0.2 ? '#ffffff' : greenColors[Math.floor(Math.random() * greenColors.length)];
              drawPixelatedRect(pixelX, pixelY, pixelSize, pixelSize, pixelColor);
            }
          }
          
          // Horizontal scan lines
          if (Math.random() < 0.1) {
            const scanY = pos.y - biggerFontSize/2 + Math.floor(Math.random() * biggerFontSize);
            const scanWidth = 10 + Math.floor(Math.random() * 20);
            const scanHeight = 1 + Math.floor(Math.random() * 2);
            
            // More electric green, less white
            const scanColor = Math.random() < 0.8 ? '#00ff33' : '#ffffff';
            drawPixelatedRect(pos.x - 5, scanY, scanWidth, scanHeight, scanColor);
          }
          
          // Fix character if we're far enough into the animation
          if (progress > 0.7 && Math.random() < progress * 0.3) {
            pos.state = 2;
            pos.char = pos.originalChar;
          }
        } 
        // Fixed final character
        else if (pos.state === 2) {
          // Bright electric green for final characters
          ctx.fillStyle = '#00ff66';
          ctx.fillText(pos.originalChar, pos.x, pos.y);
          
          // Occasionally add subtle pixel glitch even to fixed characters
          if (Math.random() < 0.05) {
            const pixX = pos.x + (Math.random() - 0.5) * 6;
            const pixY = pos.y - biggerFontSize/2 + (Math.random() - 0.5) * 6;
            const pixSize = 1 + Math.floor(Math.random() * 2);
            
            const pixColor = Math.random() < 0.3 ? '#ffffff' : '#33ff66';
            drawPixelatedRect(pixX, pixY, pixSize, pixSize, pixColor);
          }
        }
      });
    };

    // ENHANCED DISSOLVE: Much faster and more aggressive
    const drawDissolving = (progress: number) => {
      const biggerFontSize = 24;
      ctx.font = `bold ${biggerFontSize}px monospace`;
      
      // Accelerated progress for faster visual effect
      const acceleratedProgress = Math.min(1.0, progress * 1.5);
      
      quotePositions.forEach(pos => {
        // More aggressive dissolve - characters move to glitching state faster
        if (Math.random() < acceleratedProgress * 0.5) {
          pos.state = 1;
        }
        
        // More characters disappear completely
        if (Math.random() < acceleratedProgress * 0.7) {
          return; // Skip drawing this character
        }
        
        // Enhanced dissolve effects for visible characters
        if (pos.state === 1) {
          // Random characters change more rapidly
          pos.char = chars[Math.floor(Math.random() * chars.length)];
          
          // More extreme position jitter that increases rapidly
          const glitchOffsetX = Math.floor((Math.random() - 0.5) * 20 * acceleratedProgress);
          const glitchOffsetY = Math.floor((Math.random() - 0.5) * 20 * acceleratedProgress);
          
          // Rapidly decreasing opacity
          ctx.globalAlpha = Math.max(0, 1 - acceleratedProgress * 1.5 - Math.random() * 0.3);
          
          // More aggressive pixelation
          if (Math.random() < 0.8 * acceleratedProgress) {
            const numPixels = 3 + Math.floor(Math.random() * 6 * acceleratedProgress);
            for (let i = 0; i < numPixels; i++) {
              const pixX = pos.x + (Math.random() - 0.5) * 30 * acceleratedProgress;
              const pixY = pos.y - biggerFontSize/2 + (Math.random() - 0.5) * 30 * acceleratedProgress;
              const pixSize = pos.pixelSize * (1 + Math.random() * 4 * acceleratedProgress);
              
              // More electric green variants, less white
              const pixelColor = Math.random() < 0.15 ? '#ffffff' : greenColors[Math.floor(Math.random() * greenColors.length)];
              drawPixelatedRect(pixX, pixY, pixSize, pixSize, pixelColor);
            }
          }
          
          // Scattered pixels as character dissolves
          if (Math.random() < 0.5 * acceleratedProgress) {
            const scatterX = pos.x + (Math.random() - 0.5) * 40 * acceleratedProgress;
            const scatterY = pos.y + (Math.random() - 0.5) * 40 * acceleratedProgress;
            const scatterSize = 1 + Math.floor(Math.random() * 3);
            
            const scatterColor = Math.random() < 0.2 ? '#ffffff' : '#00ff33';
            drawPixelatedRect(scatterX, scatterY, scatterSize, scatterSize, scatterColor);
          }
          
          // Draw dissolving character with position snapping for pixelated effect
          ctx.fillStyle = Math.random() < 0.2 ? '#ffffff' : '#00ff33';
          const snapFactor = 2 + Math.floor(acceleratedProgress * 4);
          const snapX = Math.floor(pos.x / snapFactor) * snapFactor;
          const snapY = Math.floor(pos.y / snapFactor) * snapFactor;
          
          ctx.fillText(pos.char, snapX + glitchOffsetX, snapY + glitchOffsetY);
        } 
        // Fixed characters also dissolve
        else if (pos.state === 2) {
          ctx.globalAlpha = Math.max(0, 1 - acceleratedProgress * 1.2);
          ctx.fillStyle = '#00ff66';
          
          // Some position jitter even for fixed characters during dissolve
          const smallGlitch = Math.floor((Math.random() - 0.5) * 8 * acceleratedProgress);
          ctx.fillText(pos.originalChar, pos.x + smallGlitch, pos.y);
          
          // More pixel artifacts
          if (Math.random() < 0.3 * acceleratedProgress) {
            const pixX = pos.x + (Math.random() - 0.5) * 20 * acceleratedProgress;
            const pixY = pos.y - biggerFontSize/2 + (Math.random() - 0.5) * 20 * acceleratedProgress;
            
            const pixColor = Math.random() < 0.25 ? '#ffffff' : '#33ff66';
            drawPixelatedRect(pixX, pixY, 1 + Math.random() * 4, 1 + Math.random() * 4, pixColor);
          }
        }
      });
      
      // Reset global alpha
      ctx.globalAlpha = 1.0;
    };

    // Function to draw the title and tagline
    const drawTitle = () => {
      const titleFontSize = 48; // Larger title
      const subtitleFontSize = 20; // Smaller subtitle
      
      // Draw title
      ctx.font = `bold ${titleFontSize}px monospace`;
      const titleText = "Privasui";
      const titleWidth = ctx.measureText(titleText).width;
      const titleX = canvas.width / 2 - titleWidth / 2;
      const titleY = 80; // Position from top
      
      // Title glow effect
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fillText(titleText, titleX + 2, titleY + 2); // Glow shadow
      
      // Main title
      ctx.fillStyle = '#00ff66';
      ctx.fillText(titleText, titleX, titleY);
      
      // Draw subtitle
      ctx.font = `${subtitleFontSize}px monospace`;
      const subtitleText = "Whisper across the chain, not the cloud";
      const subtitleWidth = ctx.measureText(subtitleText).width;
      const subtitleX = canvas.width / 2 - subtitleWidth / 2;
      const subtitleY = titleY + 35; // Slightly closer to title
      
      // Subtitle with white color
      ctx.fillStyle = '#ffffff';
      ctx.fillText(subtitleText, subtitleX, subtitleY);
      
      // Add subtle pixel glitches to the title area
      for (let i = 0; i < 10; i++) {
        const glitchX = titleX - 10 + Math.random() * (titleWidth + 20);
        const glitchY = titleY - 30 + Math.random() * 70;
        const glitchSize = 1 + Math.floor(Math.random() * 3);
        
        const glitchColor = Math.random() < 0.3 ? '#ffffff' : greenColors[Math.floor(Math.random() * greenColors.length)];
        ctx.fillStyle = glitchColor;
        ctx.fillRect(glitchX, glitchY, glitchSize, glitchSize);
      }
    };

    const draw = () => {
      // Update state based on timer
      stateTimer += 33; // milliseconds per frame
      
      // State transitions
      if (animationState === 'just_rain' && stateTimer > quoteShowDelay) {
        animationState = 'glitching';
        stateTimer = 0;
        prepareQuote();
      } else if (animationState === 'glitching' && stateTimer > glitchDuration) {
        animationState = 'displaying_quote';
        stateTimer = 0;
        // Ensure all characters are in their final state
        quotePositions.forEach(pos => {
          pos.state = 2;
          pos.char = pos.originalChar;
        });
      } else if (animationState === 'displaying_quote' && stateTimer > quoteDisplayDuration) {
        animationState = 'dissolving';
        stateTimer = 0;
      } else if (animationState === 'dissolving' && stateTimer > dissolveDuration) {
        animationState = 'just_rain';
        stateTimer = 0;
      }

      // Always draw the rain
      drawRain();
      
      // Always draw the title and tagline
      drawTitle();
      
      // Draw quote based on state
      if (animationState === 'glitching') {
        const progress = Math.min(1.0, stateTimer / glitchDuration);
        drawGlitchingQuote(progress);
      } else if (animationState === 'displaying_quote') {
        drawGlitchingQuote(1.0); // Show fully formed quote
      } else if (animationState === 'dissolving') {
        const progress = Math.min(1.0, stateTimer / dissolveDuration);
        drawDissolving(progress);
      }
    };

    // Animation loop
    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1
        }}
      />
    </div>
  );
} 