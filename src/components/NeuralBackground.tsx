"use client";

import { useEffect, useRef } from "react";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export default function NeuralBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMobile = useIsMobile();
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion || isMobile) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Configuration
        // Responsive particle count based on screen width
        const particleCount = Math.min(Math.floor(window.innerWidth / 15), 60);
        const connectionDistance = 180;
        const particles: Particle[] = [];

        // Colors - Exact Brand Cyan
        const colorCyan = "rgba(0, 230, 255, 0.6)"; // --mimi-cyan-primary

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                // Slow, gentle movement
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 2 + 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = colorCyan;
                ctx.fill();
            }
        }

        // Initialize
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Animation Loop
        let animationFrameId: number;
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and draw particles
            particles.forEach((p, index) => {
                p.update();
                p.draw();

                // Draw connections (squared distance avoids sqrt per pair)
                const connDistSq = connectionDistance * connectionDistance;
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connDistSq) {
                        const distance = Math.sqrt(distSq);
                        const opacity = (1 - distance / connectionDistance) * 0.2;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0, 230, 255, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Resize handler
        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [prefersReducedMotion, isMobile]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ background: 'transparent' }}
        />
    );
}
