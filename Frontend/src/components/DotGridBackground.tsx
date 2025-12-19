import { useEffect, useRef } from 'react';

interface DotGridBackgroundProps {
    dotSize?: number;
    gap?: number;
    className?: string;
}

export const DotGridBackground = ({
    dotSize = 3, // Slightly smaller dots for higher density
    gap = 30,    // Much tighter gap (was 35) to match the "dense" look
    className = '',
}: DotGridBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let dots: { x: number; y: number; originX: number; originY: number; color: string }[] = [];

        // Mouse state
        const mouse = { x: -1000, y: -1000 };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const isDarkMode = () => document.documentElement.classList.contains('dark');

        const init = () => {
            const dpr = window.devicePixelRatio || 1;
            // Get the parent's dimensions or window dimensions
            // Assuming fixed full screen background for now
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;

            ctx.scale(dpr, dpr);

            dots = [];
            const cols = Math.floor(window.innerWidth / gap);
            const rows = Math.floor(window.innerHeight / gap);

            // Center the grid
            const offsetX = (window.innerWidth - cols * gap) / 2;
            const offsetY = (window.innerHeight - rows * gap) / 2;

            for (let i = 0; i <= cols; i++) {
                for (let j = 0; j <= rows; j++) {
                    const x = offsetX + i * gap;
                    const y = offsetY + j * gap;
                    dots.push({
                        x,
                        y,
                        originX: x,
                        originY: y,
                        color: '' // Color is calculated in draw()
                    });
                }
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            const isDark = isDarkMode();

            // Base colors
            // Making them slightly more visible but still subtle
            const baseColor = isDark
                ? { r: 255, g: 255, b: 255, a: 0.15 }
                : { r: 0, g: 0, b: 0, a: 0.1 };

            // Highlight color (Rootstock Orange #FF6B35)
            // Increased alpha for stronger "pop"
            const highlightColor = isDark
                ? { r: 255, g: 107, b: 53, a: 1.0 } // Full opacity at center
                : { r: 255, g: 107, b: 53, a: 1.0 };

            dots.forEach((dot) => {
                // Calculate distance from mouse
                const dx = mouse.x - dot.x;
                const dy = mouse.y - dot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Interaction radius
                const radius = 350; // Increased radius (was 250) for wider spread
                const force = (radius - dist) / radius;

                if (dist < radius) {
                    const angle = Math.atan2(dy, dx);
                    // Increased repulsion power
                    const push = force * 80;

                    const targetX = dot.originX - Math.cos(angle) * push;
                    const targetY = dot.originY - Math.sin(angle) * push;

                    // Smoothly move towards target (easing)
                    dot.x += (targetX - dot.x) * 0.1;
                    dot.y += (targetY - dot.y) * 0.1;

                    // Color Mixing for Glow Effect
                    // t = force calculated with a power to control the gradient curve
                    // Power of 1.5 gives a nice spread that isn't too linear but also not too sharp
                    const t = Math.pow(force, 1.5);

                    const r = baseColor.r + (highlightColor.r - baseColor.r) * t;
                    const g = baseColor.g + (highlightColor.g - baseColor.g) * t;
                    const b = baseColor.b + (highlightColor.b - baseColor.b) * t;
                    const a = baseColor.a + (highlightColor.a - baseColor.a) * t;

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                } else {
                    // Return to origin
                    dot.x += (dot.originX - dot.x) * 0.1;
                    dot.y += (dot.originY - dot.y) * 0.1;

                    ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${baseColor.a})`;
                }

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        // Initial setup
        init();
        draw();

        // Event listeners
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', init);

        // Observer for dark mode changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Color updates handled in draw loop
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', init);
            observer.disconnect();
        };
    }, [dotSize, gap]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed top-0 left-0 w-full h-full pointer-events-none ${className}`}
            style={{ zIndex: 0 }}
        />
    );
};
