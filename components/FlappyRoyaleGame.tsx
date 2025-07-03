// components/FlappyRoyaleGame.tsx
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // Import the router

// --- Type Interfaces ---
interface Bird {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  flapFrame: number;
  rotation: number;
}

interface Pipe {
  x: number;
  y: number;
  width: number;
  gap: number;
  passed: boolean;
}

// --- Asset Paths ---
const assetSources = {
  backgroundDay: "/sprites/background-day.png",
  base: "/sprites/base.png",
  pipeGreen: "/sprites/pipe-green.png",
  yellowBird: [
    "/sprites/yellowbird-downflap.png",
    "/sprites/yellowbird-midflap.png",
    "/sprites/yellowbird-upflap.png",
  ],
  gameOver: "/sprites/gameover.png",
  message: "/sprites/message.png",
};

// --- Fully-Typed Image Loader Utility ---
interface LoadedAsset {
  key: string;
  value: HTMLImageElement | HTMLImageElement[];
}

const loadImages = (sources: typeof assetSources): Promise<Record<string, any>> => {
  const promises = Object.entries(sources).map(([key, value]) => {
    return new Promise<LoadedAsset>((resolve) => {
      if (Array.isArray(value)) {
        const imageArrayPromises = value.map((src) => {
          return new Promise<HTMLImageElement>((resolveImg) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolveImg(img);
          });
        });
        Promise.all(imageArrayPromises).then((images) => resolve({ key, value: images }));
      } else {
        const img = new Image();
        img.src = value;
        img.onload = () => resolve({ key, value: img });
      }
    });
  });

  return Promise.all(promises).then((results) => {
    return results.reduce((acc: Record<string, any>, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});
  });
};


export default function FlappyRoyaleGame({ userId, onGameOver }: { userId: string; onGameOver: () => void; }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const assetsRef = useRef<Record<string, any>>({});
  
  const birdRef = useRef<Bird | null>(null);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const gameStateRef = useRef<"getReady" | "playing" | "over">("getReady");

  const currentPipeSpeedRef = useRef<number>(0);
  const currentPipeGapRef = useRef<number>(0);

  const lastTimeRef = useRef<number>(0);

//   const [isGameOver, setIsGameOver] = useState(false);

  // --- RE-TUNED CONSTANTS FOR NOTICEABLE DIFFICULTY ---
  const GRAVITY = 1200; 
  const FLAP_STRENGTH = -370; 
  const INITIAL_PIPE_SPEED = 120; 
  const MAX_PIPE_SPEED = 150;
  const SPEED_INCREMENT = 8;

  const INITIAL_PIPE_GAP = 105;
  const MIN_PIPE_GAP = 90;
  const PIPE_SPAWN_INTERVAL = 200; 
  const DIFFICULTY_INCREASE_INTERVAL = 5; 
  // UPDATED: Increased the gap decrement to make the change noticeable
  const GAP_DECREMENT = 8; // Was 4, now it's a more significant change

  const BASE_HEIGHT = 112;
  const BIRD_WIDTH = 34;
  const BIRD_HEIGHT = 24;
  const PIPE_WIDTH = 52;
  const PIPE_HEIGHT = 320;
  
  const submitScore = async (finalScore: number) => {
    try {
      await fetch("/api/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: finalScore }),
      });
      console.log(`Score of ${finalScore} submitted for user ${userId}`);
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  };

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    birdRef.current = {
      x: 60,
      y: canvas.height / 2 - 50,
      width: BIRD_WIDTH,
      height: BIRD_HEIGHT,
      velocity: 0,
      flapFrame: 0,
      rotation: 0,
    };
    
    currentPipeSpeedRef.current = INITIAL_PIPE_SPEED;
    currentPipeGapRef.current = INITIAL_PIPE_GAP;

    pipesRef.current = [];
    scoreRef.current = 0;
    
    gameStateRef.current = "getReady";
   //  setIsGameOver(false);
  }, []);
  
  const gameLoop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !birdRef.current) return;
    
    const bird = birdRef.current;

	//  // --- UPDATED: Game Over Logic ---
	//  const handleGameOver = () => {
   //      if (gameStateRef.current === "playing") {
   //          submitScore(scoreRef.current).then(() => {
   //              // Redirect to home page with a retry marker
   //              router.push('/?retry=true');
   //          });
   //      }
   //      gameStateRef.current = "over";
   //  };

    // --- State Updates with Delta Time ---
    if (gameStateRef.current === "playing") {
        bird.velocity += GRAVITY * deltaTime;
        bird.rotation = Math.min(Math.max(-0.5, bird.velocity / 500), Math.PI / 6);
        bird.y += bird.velocity * deltaTime;
      
        if (frameCountRef.current % 5 === 0) {
            bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
        }

        const lastPipe = pipesRef.current.length > 0 ? pipesRef.current[pipesRef.current.length - 1] : { x: 0 };
        if (pipesRef.current.length === 0 || lastPipe.x < canvas.width - PIPE_SPAWN_INTERVAL) {
             const newPipe: Pipe = {
              x: canvas.width,
              y: Math.floor(Math.random() * (canvas.height - BASE_HEIGHT - currentPipeGapRef.current - 200)) + 100,
              width: PIPE_WIDTH,
              gap: currentPipeGapRef.current,
              passed: false,
            };
            pipesRef.current.push(newPipe);
        }
        pipesRef.current.forEach(pipe => pipe.x -= currentPipeSpeedRef.current * deltaTime);
        pipesRef.current = pipesRef.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

		  // --- UPDATED: Game Over logic ---
        const handleGameOver = () => {
            if (gameStateRef.current === "playing") {
                submitScore(scoreRef.current).then(() => {
                    onGameOver(); // Call the redirect function
                });
            }
            gameStateRef.current = "over";
        };

        if (bird.y + bird.height > canvas.height - BASE_HEIGHT || bird.y < 0) {
            // if (gameStateRef.current === "playing") submitScore(scoreRef.current);
            // gameStateRef.current = "over";
            // setIsGameOver(true);
				handleGameOver();
        }
        for (const pipe of pipesRef.current) {
          if (
            bird.x < pipe.x + pipe.width &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipe.gap)
          ) {
            // if (gameStateRef.current === "playing") submitScore(scoreRef.current);
            // gameStateRef.current = "over";
            // setIsGameOver(true);
				handleGameOver();
          }
        }
      
        pipesRef.current.forEach(pipe => {
          if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            pipe.passed = true;
            scoreRef.current++;
            
            if (scoreRef.current > 0 && scoreRef.current % DIFFICULTY_INCREASE_INTERVAL === 0) {
              if (currentPipeSpeedRef.current < MAX_PIPE_SPEED) currentPipeSpeedRef.current += SPEED_INCREMENT;
              if (currentPipeGapRef.current > MIN_PIPE_GAP) currentPipeGapRef.current -= GAP_DECREMENT;
            }
          }
        });

    } else if (gameStateRef.current === "getReady") {
        bird.y = (canvas.height / 2 - 50) + Math.sin(timestamp / 200) * 5;
        bird.rotation = 0;
        if (frameCountRef.current % 5 === 0) {
            bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
        }
    }

    // --- Drawing Logic ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const bg = assetsRef.current.backgroundDay;
    if(bg) {
        const bgWidth = 288;
        const count = Math.ceil(canvas.width / bgWidth) + 1;
        const bgX = -((timestamp * 0.05) % bgWidth);
        for (let i = 0; i < count; i++) {
             ctx.drawImage(bg, bgX + i * bgWidth, 0);
        }
    }

    const pipeImg = assetsRef.current.pipeGreen;
    if (pipeImg) {
      pipesRef.current.forEach(pipe => {
        ctx.drawImage(pipeImg, pipe.x, pipe.y - PIPE_HEIGHT);
        ctx.drawImage(pipeImg, pipe.x, pipe.y + pipe.gap);
      });
    }

    const base = assetsRef.current.base;
    if (base) {
      const baseWidth = 336;
      const count = Math.ceil(canvas.width / baseWidth) + 1;
      const speed = gameStateRef.current === "playing" ? currentPipeSpeedRef.current : 120;
      const baseX = -((timestamp * (speed/baseWidth)) % baseWidth);
      for (let i = 0; i < count; i++) {
          ctx.drawImage(base, baseX + i * baseWidth, canvas.height - BASE_HEIGHT);
      }
    }

    const birdImg = assetsRef.current.yellowBird[bird.flapFrame];
    if (birdImg) {
      ctx.save();
      ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
      ctx.rotate(bird.rotation);
      ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
      ctx.restore();
    }
    
    if (gameStateRef.current === 'playing' || gameStateRef.current === 'over') {
        ctx.fillStyle = "white";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeText(String(scoreRef.current), canvas.width / 2, 80);
        ctx.fillText(String(scoreRef.current), canvas.width / 2, 80);
    }

    if(gameStateRef.current === 'getReady'){
        const msgImg = assetsRef.current.message;
        if (msgImg) ctx.drawImage(msgImg, canvas.width / 2 - msgImg.width / 2, canvas.height / 2 - 150);
    } else if(gameStateRef.current === 'over'){
        const goImg = assetsRef.current.gameOver;
        if (goImg) ctx.drawImage(goImg, canvas.width / 2 - goImg.width / 2, canvas.height / 2 - 100);
    }
    
    frameCountRef.current++;
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, []);

  const handleFlap = useCallback(() => {
    if (gameStateRef.current === "playing" && birdRef.current) {
        birdRef.current.velocity = FLAP_STRENGTH;
    } else if (gameStateRef.current === "getReady" && birdRef.current) {
        gameStateRef.current = "playing";
        birdRef.current.velocity = FLAP_STRENGTH;
    } 
	//  else if (gameStateRef.current === "over") {
   //      resetGame();
   //  }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 384;
    canvas.height = 512;

    loadImages(assetSources).then(loadedAssets => {
      assetsRef.current = loadedAssets;
      resetGame(); 
      lastTimeRef.current = 0; // Reset time for the first frame
      animationFrameId.current = requestAnimationFrame(gameLoop);
    });

    const spacebarHandler = (e: KeyboardEvent) => { if (e.code === 'Space') e.preventDefault(); }
    const flapHandler = (e: KeyboardEvent) => { if (e.code === 'Space') handleFlap(); }

    window.addEventListener("keydown", spacebarHandler);
    window.addEventListener("keyup", flapHandler);
    canvas.addEventListener("mousedown", handleFlap);
    canvas.addEventListener("touchstart", handleFlap);

    return () => {
      if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("keydown", spacebarHandler);
      window.removeEventListener("keyup", flapHandler);
      canvas.removeEventListener("mousedown", handleFlap);
      canvas.removeEventListener("touchstart", handleFlap);
    };
  }, [gameLoop, handleFlap, resetGame]);

//   return (
//     <div className="relative flex flex-col items-center justify-center bg-black rounded-lg shadow-2xl cursor-pointer">
//       <canvas ref={canvasRef} />
//       {isGameOver && (
//          <div className="absolute bottom-20 flex flex-col items-center">
//             <button 
//                 onClick={handleFlap}
//                 className="px-6 py-3 text-white bg-green-500 rounded-lg text-xl font-bold border-b-4 border-green-700 hover:bg-green-600 active:translate-y-1"
//             >
//                 Try Again
//             </button>
//          </div>
//       )}
//     </div>
//   );

// REMOVED: The Try Again button is no longer needed in the JSX
  return (
    <div className="relative flex flex-col items-center justify-center bg-black rounded-lg shadow-2xl cursor-pointer">
      <canvas ref={canvasRef} />
    </div>
  );
}





// // components/FlappyRoyaleGame.tsx
// "use client";

// import { useRef, useEffect, useState, useCallback } from "react"; // Import useCallback

// // --- Type Interfaces ---
// interface Bird {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   velocity: number;
//   flapFrame: number;
//   rotation: number;
// }

// interface Pipe {
//   x: number;
//   y: number;
//   width: number;
//   gap: number;
//   passed: boolean;
// }

// // --- Asset Paths ---
// const assetSources = {
//   backgroundDay: "/sprites/background-day.png",
//   base: "/sprites/base.png",
//   pipeGreen: "/sprites/pipe-green.png",
//   yellowBird: [
//     "/sprites/yellowbird-downflap.png",
//     "/sprites/yellowbird-midflap.png",
//     "/sprites/yellowbird-upflap.png",
//   ],
//   gameOver: "/sprites/gameover.png",
//   message: "/sprites/message.png",
// };

// // --- Fully-Typed Image Loader Utility ---
// interface LoadedAsset {
//   key: string;
//   value: HTMLImageElement | HTMLImageElement[];
// }

// const loadImages = (sources: typeof assetSources): Promise<Record<string, any>> => {
//   const promises = Object.entries(sources).map(([key, value]) => {
//     return new Promise<LoadedAsset>((resolve) => {
//       if (Array.isArray(value)) {
//         const imageArrayPromises = value.map((src) => {
//           return new Promise<HTMLImageElement>((resolveImg) => {
//             const img = new Image();
//             img.src = src;
//             img.onload = () => resolveImg(img);
//           });
//         });
//         Promise.all(imageArrayPromises).then((images) => resolve({ key, value: images }));
//       } else {
//         const img = new Image();
//         img.src = value;
//         img.onload = () => resolve({ key, value: img });
//       }
//     });
//   });

//   return Promise.all(promises).then((results) => {
//     return results.reduce((acc: Record<string, any>, { key, value }) => {
//       acc[key] = value;
//       return acc;
//     }, {});
//   });
// };


// export default function FlappyRoyaleGame({ userId }: { userId: string }) {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const animationFrameId = useRef<number | null>(null);
//   const assetsRef = useRef<Record<string, any>>({});
  
//   const birdRef = useRef<Bird | null>(null);
//   const pipesRef = useRef<Pipe[]>([]);
//   const scoreRef = useRef<number>(0);
//   const frameCountRef = useRef<number>(0);
//   const gameStateRef = useRef<"getReady" | "playing" | "over">("getReady");

//   const currentPipeSpeedRef = useRef<number>(0);
//   const currentPipeGapRef = useRef<number>(0);

//   const [isGameOver, setIsGameOver] = useState(false);

//   const GRAVITY = 0.05;
//   const FLAP_STRENGTH = -3.2;
//   const INITIAL_PIPE_SPEED = 0.6;
//   const MAX_PIPE_SPEED = 3;
//   const INITIAL_PIPE_GAP = 130;
//   const MIN_PIPE_GAP = 100;
//   const PIPE_SPAWN_INTERVAL = 250; 
//   const DIFFICULTY_INCREASE_INTERVAL = 5; 
//   const SPEED_INCREMENT = 0.1;
//   const GAP_DECREMENT = 1;

//   const BASE_HEIGHT = 112;
//   const BIRD_WIDTH = 34;
//   const BIRD_HEIGHT = 24;
//   const PIPE_WIDTH = 52;
//   const PIPE_HEIGHT = 320;

//   // --- NEW: Function to submit the score ---
//   const submitScore = async (finalScore: number) => {
//     try {
//       await fetch("/api/submit-score", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ score: finalScore }),
//       });
//       console.log(`Score of ${finalScore} submitted for user ${userId}`);
//     } catch (error) {
//       console.error("Failed to submit score:", error);
//     }
//   };

//   const resetGame = useCallback(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     birdRef.current = {
//       x: 60,
//       y: canvas.height / 2 - 50,
//       width: BIRD_WIDTH,
//       height: BIRD_HEIGHT,
//       velocity: 0,
//       flapFrame: 0,
//       rotation: 0,
//     };
    
//     currentPipeSpeedRef.current = INITIAL_PIPE_SPEED;
//     currentPipeGapRef.current = INITIAL_PIPE_GAP;

//     pipesRef.current = [];
//     scoreRef.current = 0;
    
//     gameStateRef.current = "getReady";
//     setIsGameOver(false);
//   }, []); // Use useCallback for stable function reference
  
//   const gameLoop = useCallback(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas?.getContext("2d");
//     if (!ctx || !canvas || !birdRef.current) return;
    
//     const bird = birdRef.current;

//     // --- State Updates ---
//     if (gameStateRef.current === "playing") {
//         bird.velocity += GRAVITY;
//         bird.rotation = Math.min(Math.max(-0.3, bird.velocity / 10), Math.PI / 4);
//         bird.y += bird.velocity;
      
//         if (frameCountRef.current % 5 === 0) {
//             bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
//         }

//         const lastPipe = pipesRef.current.length > 0 ? pipesRef.current[pipesRef.current.length - 1] : { x: 0 };
//         if (pipesRef.current.length === 0 || lastPipe.x < canvas.width - PIPE_SPAWN_INTERVAL) {
//             const newPipe: Pipe = {
//               x: canvas.width,
//               y: Math.floor(Math.random() * (canvas.height - BASE_HEIGHT - currentPipeGapRef.current - 200)) + 100,
//               width: PIPE_WIDTH,
//               gap: currentPipeGapRef.current,
//               passed: false,
//             };
//             pipesRef.current.push(newPipe);
//         }
//         pipesRef.current.forEach(pipe => pipe.x -= currentPipeSpeedRef.current);
//         pipesRef.current = pipesRef.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

// 		  // --- UPDATED: Collision detection now calls submitScore ---
//         if (bird.y + bird.height > canvas.height - BASE_HEIGHT || bird.y < 0) {
//             if (gameStateRef.current === "playing") {
//                 submitScore(scoreRef.current);
//             }
//             gameStateRef.current = "over";
//             setIsGameOver(true);
//         }
//         for (const pipe of pipesRef.current) {
//           if (
//             bird.x < pipe.x + pipe.width &&
//             bird.x + bird.width > pipe.x &&
//             (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipe.gap)
//           ) {
//             if (gameStateRef.current === "playing") {
//                 submitScore(scoreRef.current);
//             }
//             gameStateRef.current = "over";
//             setIsGameOver(true);
//           }
//         }

//       //   if (bird.y + bird.height > canvas.height - BASE_HEIGHT || bird.y < 0) {
//       //     gameStateRef.current = "over";
//       //     setIsGameOver(true);
//       //   }
//       //   for (const pipe of pipesRef.current) {
//       //     if (
//       //       bird.x < pipe.x + pipe.width &&
//       //       bird.x + bird.width > pipe.x &&
//       //       (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipe.gap)
//       //     ) {
//       //       gameStateRef.current = "over";
//       //       setIsGameOver(true);
//       //     }
//       //   }
      
//         pipesRef.current.forEach(pipe => {
//           if (!pipe.passed && bird.x > pipe.x + pipe.width) {
//             pipe.passed = true;
//             scoreRef.current++;
            
//             if (scoreRef.current > 0 && scoreRef.current % DIFFICULTY_INCREASE_INTERVAL === 0) {
//               if (currentPipeSpeedRef.current < MAX_PIPE_SPEED) currentPipeSpeedRef.current += SPEED_INCREMENT;
//               if (currentPipeGapRef.current > MIN_PIPE_GAP) currentPipeGapRef.current -= GAP_DECREMENT;
//             }
//           }
//         });

//     } else if (gameStateRef.current === "getReady") {
//         bird.y = (canvas.height / 2 - 50) + Math.sin(frameCountRef.current / 10) * 5;
//         bird.rotation = 0;
//         if (frameCountRef.current % 5 === 0) {
//             bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
//         }
//     }


//     // --- Drawing Logic ---
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
    
//     const bg = assetsRef.current.backgroundDay;
//     if(bg) {
//         const bgWidth = 288;
//         const count = Math.ceil(canvas.width / bgWidth) + 1;
//         const bgX = -((frameCountRef.current * 0.5) % bgWidth);
//         for (let i = 0; i < count; i++) {
//              ctx.drawImage(bg, bgX + i * bgWidth, 0);
//         }
//     }

//     const pipeImg = assetsRef.current.pipeGreen;
//     if (pipeImg) {
//       pipesRef.current.forEach(pipe => {
//         ctx.drawImage(pipeImg, pipe.x, pipe.y - PIPE_HEIGHT);
//         ctx.drawImage(pipeImg, pipe.x, pipe.y + pipe.gap);
//       });
//     }

//     const base = assetsRef.current.base;
//     if (base) {
//       const baseWidth = 336;
//       const count = Math.ceil(canvas.width / baseWidth) + 1;
//       const speed = gameStateRef.current === "playing" ? currentPipeSpeedRef.current : 1;
//       const baseX = -((frameCountRef.current * speed) % baseWidth);
//       for (let i = 0; i < count; i++) {
//           ctx.drawImage(base, baseX + i * baseWidth, canvas.height - BASE_HEIGHT);
//       }
//     }

//     const birdImg = assetsRef.current.yellowBird[bird.flapFrame];
//     if (birdImg) {
//       ctx.save();
//       ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
//       ctx.rotate(bird.rotation);
//       ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
//       ctx.restore();
//     }
    
//     if (gameStateRef.current === 'playing' || gameStateRef.current === 'over') {
//         ctx.fillStyle = "white";
//         ctx.font = "bold 48px sans-serif";
//         ctx.textAlign = "center";
//         ctx.strokeStyle = "black";
//         ctx.lineWidth = 2;
//         ctx.strokeText(String(scoreRef.current), canvas.width / 2, 80);
//         ctx.fillText(String(scoreRef.current), canvas.width / 2, 80);
//     }

//     if(gameStateRef.current === 'getReady'){
//         const msgImg = assetsRef.current.message;
//         if (msgImg) {
//             ctx.drawImage(msgImg, canvas.width / 2 - msgImg.width / 2, canvas.height / 2 - 150);
//         }
//     } else if(gameStateRef.current === 'over'){
//         const goImg = assetsRef.current.gameOver;
//         if (goImg) {
//             ctx.drawImage(goImg, canvas.width / 2 - goImg.width / 2, canvas.height / 2 - 100);
//         }
//     }
    
//     frameCountRef.current++;
//     animationFrameId.current = requestAnimationFrame(gameLoop);
//   }, []); // Use useCallback for stable function reference

//   const handleFlap = useCallback(() => {
//     if (gameStateRef.current === "playing" && birdRef.current) {
//         birdRef.current.velocity = FLAP_STRENGTH;
//     } else if (gameStateRef.current === "getReady" && birdRef.current) {
//         gameStateRef.current = "playing";
//         birdRef.current.velocity = FLAP_STRENGTH;
//     } else if (gameStateRef.current === "over") {
//         resetGame();
//     }
//   }, [resetGame]); // Use useCallback for stable function reference

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
    
//     canvas.width = 384;
//     canvas.height = 512;

//     loadImages(assetSources).then(loadedAssets => {
//       assetsRef.current = loadedAssets;
//       resetGame(); 
//       animationFrameId.current = requestAnimationFrame(gameLoop);
//     });

//     const spacebarHandler = (e: KeyboardEvent) => {
//         if (e.code === 'Space') e.preventDefault();
//     }
//     const flapHandler = (e: KeyboardEvent) => {
//         if (e.code === 'Space') handleFlap();
//     }

//     window.addEventListener("keydown", spacebarHandler);
//     window.addEventListener("keyup", flapHandler);
//     canvas.addEventListener("mousedown", handleFlap);
//     canvas.addEventListener("touchstart", handleFlap);

//     return () => {
//       if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
//       window.removeEventListener("keydown", spacebarHandler);
//       window.removeEventListener("keyup", flapHandler);
//       canvas.removeEventListener("mousedown", handleFlap);
//       canvas.removeEventListener("touchstart", handleFlap);
//     };
//   }, [gameLoop, handleFlap, resetGame]); // Add dependencies to useEffect

//   return (
//     <div className="relative flex flex-col items-center justify-center bg-black rounded-lg shadow-2xl cursor-pointer">
//       <canvas ref={canvasRef} />
//       {isGameOver && (
//          <div 
//             className="absolute bottom-20 flex flex-col items-center"
//          >
//             <button 
//                 onClick={handleFlap}
//                 className="px-6 py-3 text-white bg-green-500 rounded-lg text-xl font-bold border-b-4 border-green-700 hover:bg-green-600 active:translate-y-1"
//             >
//                 Try Again
//             </button>
//          </div>
//       )}
//     </div>
//   );
// }

// // components/FlappyRoyaleGame.tsx
// "use client";

// import { useRef, useEffect, useState } from "react";

// // --- Type Interfaces ---
// interface Bird {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   velocity: number;
//   flapFrame: number;
//   rotation: number;
// }

// interface Pipe {
//   x: number;
//   y: number;
//   width: number;
//   gap: number;
//   passed: boolean;
// }

// // --- Asset Paths ---
// const assetSources = {
//   backgroundDay: "/sprites/background-day.png",
//   base: "/sprites/base.png",
//   pipeGreen: "/sprites/pipe-green.png",
//   yellowBird: [
//     "/sprites/yellowbird-downflap.png",
//     "/sprites/yellowbird-midflap.png",
//     "/sprites/yellowbird-upflap.png",
//   ],
//   gameOver: "/sprites/gameover.png",
//   message: "/sprites/message.png",
// };

// // --- Fully-Typed Image Loader Utility ---
// interface LoadedAsset {
//   key: string;
//   value: HTMLImageElement | HTMLImageElement[];
// }

// const loadImages = (sources: typeof assetSources): Promise<Record<string, any>> => {
//   const promises = Object.entries(sources).map(([key, value]) => {
//     return new Promise<LoadedAsset>((resolve) => {
//       if (Array.isArray(value)) {
//         const imageArrayPromises = value.map((src) => {
//           return new Promise<HTMLImageElement>((resolveImg) => {
//             const img = new Image();
//             img.src = src;
//             img.onload = () => resolveImg(img);
//           });
//         });
//         Promise.all(imageArrayPromises).then((images) => resolve({ key, value: images }));
//       } else {
//         const img = new Image();
//         img.src = value;
//         img.onload = () => resolve({ key, value: img });
//       }
//     });
//   });

//   return Promise.all(promises).then((results) => {
//     return results.reduce((acc: Record<string, any>, { key, value }) => {
//       acc[key] = value;
//       return acc;
//     }, {});
//   });
// };


// export default function FlappyRoyaleGame() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const animationFrameId = useRef<number | null>(null);
//   const assetsRef = useRef<Record<string, any>>({});
  
//   const birdRef = useRef<Bird | null>(null);
//   const pipesRef = useRef<Pipe[]>([]);
//   const scoreRef = useRef<number>(0);
//   const frameCountRef = useRef<number>(0);
//   const gameStateRef = useRef<"getReady" | "playing" | "over">("getReady");

//   const currentPipeSpeedRef = useRef<number>(0);
//   const currentPipeGapRef = useRef<number>(0);

//   // --- FIX: Removed the unreliable 'displayedScore' state ---
//   // const [displayedScore, setDisplayedScore] = useState(0); 
//   const [isGameOver, setIsGameOver] = useState(false);

//   // --- Your Tuned Gameplay Constants ---
//   const GRAVITY = 0.07;
//   const FLAP_STRENGTH = -3.4;
//   const INITIAL_PIPE_SPEED = 0.7;
//   const MAX_PIPE_SPEED = 3;
//   const INITIAL_PIPE_GAP = 130;
//   const MIN_PIPE_GAP = 100;
//   const PIPE_SPAWN_INTERVAL = 250; 
//   const DIFFICULTY_INCREASE_INTERVAL = 5; 
//   const SPEED_INCREMENT = 0.1;
//   const GAP_DECREMENT = 1;

//   const BASE_HEIGHT = 112;
//   const BIRD_WIDTH = 34;
//   const BIRD_HEIGHT = 24;
//   const PIPE_WIDTH = 52;
//   const PIPE_HEIGHT = 320;


//   const resetGame = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     birdRef.current = {
//       x: 60,
//       y: canvas.height / 2 - 50,
//       width: BIRD_WIDTH,
//       height: BIRD_HEIGHT,
//       velocity: 0,
//       flapFrame: 0,
//       rotation: 0,
//     };
    
//     currentPipeSpeedRef.current = INITIAL_PIPE_SPEED;
//     currentPipeGapRef.current = INITIAL_PIPE_GAP;

//     pipesRef.current = [];
//     scoreRef.current = 0;
    
//     gameStateRef.current = "getReady";
//     setIsGameOver(false);
//   };
  
//   const generatePipes = () => {
//       const canvas = canvasRef.current;
//       if(!canvas) return;

//       const newPipe: Pipe = {
//           x: canvas.width,
//           y: Math.floor(Math.random() * (canvas.height - BASE_HEIGHT - currentPipeGapRef.current - 200)) + 100,
//           width: PIPE_WIDTH,
//           gap: currentPipeGapRef.current,
//           passed: false,
//       };
//       pipesRef.current.push(newPipe);
//   }

//   const gameLoop = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas?.getContext("2d");
//     if (!ctx || !canvas || !birdRef.current) return;
    
//     const bird = birdRef.current;

//     // --- State Updates ---
//     if (gameStateRef.current === "playing") {
//         bird.velocity += GRAVITY;
//         bird.rotation = Math.min(Math.max(-0.3, bird.velocity / 10), Math.PI / 4);
//         bird.y += bird.velocity;
      
//         if (frameCountRef.current % 5 === 0) {
//             bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
//         }

//         const lastPipe = pipesRef.current.length > 0 ? pipesRef.current[pipesRef.current.length - 1] : { x: 0 };
//         if (pipesRef.current.length === 0 || lastPipe.x < canvas.width - PIPE_SPAWN_INTERVAL) {
//             generatePipes();
//         }
//         pipesRef.current.forEach(pipe => pipe.x -= currentPipeSpeedRef.current);
//         pipesRef.current = pipesRef.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

//         if (bird.y + bird.height > canvas.height - BASE_HEIGHT || bird.y < 0) {
//           gameStateRef.current = "over";
//           setIsGameOver(true);
//         }
//         for (const pipe of pipesRef.current) {
//           if (
//             bird.x < pipe.x + pipe.width &&
//             bird.x + bird.width > pipe.x &&
//             (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipe.gap)
//           ) {
//             gameStateRef.current = "over";
//             setIsGameOver(true);
//           }
//         }
      
//         pipesRef.current.forEach(pipe => {
//           if (!pipe.passed && bird.x > pipe.x + pipe.width) {
//             pipe.passed = true;
//             scoreRef.current++;
//             // --- FIX: Removed setDisplayedScore ---
//             // setDisplayedScore(scoreRef.current);
            
//             if (scoreRef.current > 0 && scoreRef.current % DIFFICULTY_INCREASE_INTERVAL === 0) {
//               if (currentPipeSpeedRef.current < MAX_PIPE_SPEED) currentPipeSpeedRef.current += SPEED_INCREMENT;
//               if (currentPipeGapRef.current > MIN_PIPE_GAP) currentPipeGapRef.current -= GAP_DECREMENT;
//             }
//           }
//         });

//     } else if (gameStateRef.current === "getReady") {
//         bird.y = (canvas.height / 2 - 50) + Math.sin(frameCountRef.current / 10) * 5;
//         bird.rotation = 0;
//         if (frameCountRef.current % 5 === 0) {
//             bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
//         }
//     }


//     // --- Drawing Logic ---
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
    
//     const bg = assetsRef.current.backgroundDay;
//     if(bg) {
//         const bgWidth = 288;
//         const count = Math.ceil(canvas.width / bgWidth) + 1;
//         const bgX = -((frameCountRef.current * 0.5) % bgWidth);
//         for (let i = 0; i < count; i++) {
//              ctx.drawImage(bg, bgX + i * bgWidth, 0);
//         }
//     }

//     const pipeImg = assetsRef.current.pipeGreen;
//     if (pipeImg) {
//       pipesRef.current.forEach(pipe => {
//         ctx.drawImage(pipeImg, pipe.x, pipe.y - PIPE_HEIGHT);
//         ctx.drawImage(pipeImg, pipe.x, pipe.y + pipe.gap);
//       });
//     }

//     const base = assetsRef.current.base;
//     if (base) {
//       const baseWidth = 336;
//       const count = Math.ceil(canvas.width / baseWidth) + 1;
//       const speed = gameStateRef.current === "playing" ? currentPipeSpeedRef.current : 1;
//       const baseX = -((frameCountRef.current * speed) % baseWidth);
//       for (let i = 0; i < count; i++) {
//           ctx.drawImage(base, baseX + i * baseWidth, canvas.height - BASE_HEIGHT);
//       }
//     }

//     const birdImg = assetsRef.current.yellowBird[bird.flapFrame];
//     if (birdImg) {
//       ctx.save();
//       ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
//       ctx.rotate(bird.rotation);
//       ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
//       ctx.restore();
//     }
    
//     // --- FIX: Draw the score directly from the ref ---
//     if (gameStateRef.current === 'playing' || gameStateRef.current === 'over') {
//         ctx.fillStyle = "white";
//         ctx.font = "bold 48px sans-serif";
//         ctx.textAlign = "center";
//         ctx.strokeStyle = "black";
//         ctx.lineWidth = 2;
//         ctx.strokeText(String(scoreRef.current), canvas.width / 2, 80);
//         ctx.fillText(String(scoreRef.current), canvas.width / 2, 80);
//     }

//     if(gameStateRef.current === 'getReady'){
//         const msgImg = assetsRef.current.message;
//         if (msgImg) {
//             ctx.drawImage(msgImg, canvas.width / 2 - msgImg.width / 2, canvas.height / 2 - 150);
//         }
//     } else if(gameStateRef.current === 'over'){
//         const goImg = assetsRef.current.gameOver;
//         if (goImg) {
//             ctx.drawImage(goImg, canvas.width / 2 - goImg.width / 2, canvas.height / 2 - 100);
//         }
//     }
    
//     frameCountRef.current++;
//     animationFrameId.current = requestAnimationFrame(gameLoop);
//   };
  
//   const handleFlap = () => {
//     if (gameStateRef.current === "playing" && birdRef.current) {
//         birdRef.current.velocity = FLAP_STRENGTH;
//     } else if (gameStateRef.current === "getReady" && birdRef.current) {
//         gameStateRef.current = "playing";
//         birdRef.current.velocity = FLAP_STRENGTH;
//     } else if (gameStateRef.current === "over") {
//         resetGame();
//     }
//   }

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
    
//     canvas.width = 384;
//     canvas.height = 512;

//     loadImages(assetSources).then(loadedAssets => {
//       assetsRef.current = loadedAssets;
//       resetGame(); 
//       animationFrameId.current = requestAnimationFrame(gameLoop);
//     });

//     const spacebarHandler = (e: KeyboardEvent) => {
//         if (e.code === 'Space') e.preventDefault();
//     }
//     const flapHandler = (e: KeyboardEvent) => {
//         if (e.code === 'Space') handleFlap();
//     }

//     window.addEventListener("keydown", spacebarHandler);
//     window.addEventListener("keyup", flapHandler);
//     canvas.addEventListener("mousedown", handleFlap);
//     canvas.addEventListener("touchstart", handleFlap);

//     return () => {
//       if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
//       window.removeEventListener("keydown", spacebarHandler);
//       window.removeEventListener("keyup", flapHandler);
//       canvas.removeEventListener("mousedown", handleFlap);
//       canvas.removeEventListener("touchstart", handleFlap);
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div className="relative flex flex-col items-center justify-center bg-black rounded-lg shadow-2xl cursor-pointer">
//       <canvas ref={canvasRef} />
//       {isGameOver && (
//          <div 
//             className="absolute bottom-20 flex flex-col items-center"
//          >
//             <button 
//                 onClick={handleFlap}
//                 className="px-6 py-3 text-white bg-green-500 rounded-lg text-xl font-bold border-b-4 border-green-700 hover:bg-green-600 active:translate-y-1"
//             >
//                 Try Again
//             </button>
//          </div>
//       )}
//     </div>
//   );
// }

// // components/FlappyRoyaleGame.tsx
// "use client";

// import { useRef, useEffect, useState } from "react";

// // --- Type Interfaces ---
// interface Bird {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   velocity: number;
//   flapFrame: number;
//   rotation: number;
// }

// interface Pipe {
//   x: number;
//   y: number;
//   width: number;
//   gap: number;
//   passed: boolean;
// }

// // --- Asset Paths ---
// const assetSources = {
//   backgroundDay: "/sprites/background-day.png",
//   base: "/sprites/base.png",
//   pipeGreen: "/sprites/pipe-green.png",
//   yellowBird: [
//     "/sprites/yellowbird-downflap.png",
//     "/sprites/yellowbird-midflap.png",
//     "/sprites/yellowbird-upflap.png",
//   ],
//   gameOver: "/sprites/gameover.png",
//   message: "/sprites/message.png",
// };

// // --- Fully-Typed Image Loader Utility ---
// interface LoadedAsset {
//   key: string;
//   value: HTMLImageElement | HTMLImageElement[];
// }

// const loadImages = (sources: typeof assetSources): Promise<Record<string, any>> => {
//   const promises = Object.entries(sources).map(([key, value]) => {
//     return new Promise<LoadedAsset>((resolve) => {
//       if (Array.isArray(value)) {
//         const imageArrayPromises = value.map((src) => {
//           return new Promise<HTMLImageElement>((resolveImg) => {
//             const img = new Image();
//             img.src = src;
//             img.onload = () => resolveImg(img);
//           });
//         });
//         Promise.all(imageArrayPromises).then((images) => resolve({ key, value: images }));
//       } else {
//         const img = new Image();
//         img.src = value;
//         img.onload = () => resolve({ key, value: img });
//       }
//     });
//   });

//   return Promise.all(promises).then((results) => {
//     return results.reduce((acc: Record<string, any>, { key, value }) => {
//       acc[key] = value;
//       return acc;
//     }, {});
//   });
// };


// export default function FlappyRoyaleGame() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const animationFrameId = useRef<number | null>(null);
//   const assetsRef = useRef<Record<string, any>>({});
  
//   const birdRef = useRef<Bird | null>(null);
//   const pipesRef = useRef<Pipe[]>([]);
//   const scoreRef = useRef<number>(0);
//   const frameCountRef = useRef<number>(0);
//   const gameStateRef = useRef<"getReady" | "playing" | "over">("getReady");

//   const currentPipeSpeedRef = useRef<number>(0);
//   const currentPipeGapRef = useRef<number>(0);

//   const [displayedScore, setDisplayedScore] = useState(0);
//   const [isGameOver, setIsGameOver] = useState(false);

//   // --- GAMEPLAY TUNING: Constants adjusted for a much easier start and smoother curve ---
//   const GRAVITY = 0.07;
//   const FLAP_STRENGTH = -3.4;
//   const INITIAL_PIPE_SPEED = 0.7;
//   const MAX_PIPE_SPEED = 3;
//   const INITIAL_PIPE_GAP = 130;
//   const MIN_PIPE_GAP = 100;
//   const PIPE_SPAWN_INTERVAL = 250; 
//   const DIFFICULTY_INCREASE_INTERVAL = 5; 
//   const SPEED_INCREMENT = 0.1;
//   const GAP_DECREMENT = 1;

//   const BASE_HEIGHT = 112;
//   const BIRD_WIDTH = 34;
//   const BIRD_HEIGHT = 24;
//   const PIPE_WIDTH = 52;
//   const PIPE_HEIGHT = 320;


//   const resetGame = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     birdRef.current = {
//       x: 60,
//       y: canvas.height / 2 - 50,
//       width: BIRD_WIDTH,
//       height: BIRD_HEIGHT,
//       velocity: 0,
//       flapFrame: 0,
//       rotation: 0,
//     };
    
//     currentPipeSpeedRef.current = INITIAL_PIPE_SPEED;
//     currentPipeGapRef.current = INITIAL_PIPE_GAP;

//     pipesRef.current = [];
//     scoreRef.current = 0;
//     setDisplayedScore(0);
    
//     gameStateRef.current = "getReady";
//     setIsGameOver(false);
//   };
  
//   const generatePipes = () => {
//       const canvas = canvasRef.current;
//       if(!canvas) return;

//       const newPipe: Pipe = {
//           x: canvas.width,
//           y: Math.floor(Math.random() * (canvas.height - BASE_HEIGHT - currentPipeGapRef.current - 200)) + 100,
//           width: PIPE_WIDTH,
//           gap: currentPipeGapRef.current,
//           passed: false,
//       };
//       pipesRef.current.push(newPipe);
//   }

//   const gameLoop = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas?.getContext("2d");
//     if (!ctx || !canvas || !birdRef.current) return;
    
//     const bird = birdRef.current;

//     // --- State Updates ---
//     if (gameStateRef.current === "playing") {
//         bird.velocity += GRAVITY;
//         bird.rotation = Math.min(Math.max(-0.3, bird.velocity / 10), Math.PI / 4);
//         bird.y += bird.velocity;
      
//         if (frameCountRef.current % 5 === 0) {
//             bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
//         }

//         const lastPipe = pipesRef.current.length > 0 ? pipesRef.current[pipesRef.current.length - 1] : { x: 0 };
//         if (pipesRef.current.length === 0 || lastPipe.x < canvas.width - PIPE_SPAWN_INTERVAL) {
//             generatePipes();
//         }
//         pipesRef.current.forEach(pipe => pipe.x -= currentPipeSpeedRef.current);
//         pipesRef.current = pipesRef.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

//         if (bird.y + bird.height > canvas.height - BASE_HEIGHT || bird.y < 0) {
//           gameStateRef.current = "over";
//           setIsGameOver(true);
//         }
//         for (const pipe of pipesRef.current) {
//           if (
//             bird.x < pipe.x + pipe.width &&
//             bird.x + bird.width > pipe.x &&
//             (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipe.gap)
//           ) {
//             gameStateRef.current = "over";
//             setIsGameOver(true);
//           }
//         }
      
//         pipesRef.current.forEach(pipe => {
//           if (!pipe.passed && bird.x > pipe.x + pipe.width) {
//             pipe.passed = true;
//             scoreRef.current++;
//             setDisplayedScore(scoreRef.current);
            
//             if (scoreRef.current > 0 && scoreRef.current % DIFFICULTY_INCREASE_INTERVAL === 0) {
//               if (currentPipeSpeedRef.current < MAX_PIPE_SPEED) currentPipeSpeedRef.current += SPEED_INCREMENT;
//               if (currentPipeGapRef.current > MIN_PIPE_GAP) currentPipeGapRef.current -= GAP_DECREMENT;
//             }
//           }
//         });

//     } else if (gameStateRef.current === "getReady") {
//         bird.y = (canvas.height / 2 - 50) + Math.sin(frameCountRef.current / 10) * 5;
//         bird.rotation = 0;
//         if (frameCountRef.current % 5 === 0) {
//             bird.flapFrame = (bird.flapFrame + 1) % assetsRef.current.yellowBird.length;
//         }
//     }


//     // --- Drawing Logic ---
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
    
//     const bg = assetsRef.current.backgroundDay;
//     if(bg) {
//         const bgWidth = 288;
//         const count = Math.ceil(canvas.width / bgWidth) + 1;
//         const bgX = -((frameCountRef.current * 0.5) % bgWidth);
//         for (let i = 0; i < count; i++) {
//              ctx.drawImage(bg, bgX + i * bgWidth, 0);
//         }
//     }

//     const pipeImg = assetsRef.current.pipeGreen;
//     if (pipeImg) {
//       pipesRef.current.forEach(pipe => {
//         ctx.drawImage(pipeImg, pipe.x, pipe.y - PIPE_HEIGHT);
//         ctx.drawImage(pipeImg, pipe.x, pipe.y + pipe.gap);
//       });
//     }

//     const base = assetsRef.current.base;
//     if (base) {
//       const baseWidth = 336;
//       const count = Math.ceil(canvas.width / baseWidth) + 1;
//       const speed = gameStateRef.current === "playing" ? currentPipeSpeedRef.current : 1;
//       const baseX = -((frameCountRef.current * speed) % baseWidth);
//       for (let i = 0; i < count; i++) {
//           ctx.drawImage(base, baseX + i * baseWidth, canvas.height - BASE_HEIGHT);
//       }
//     }

//     const birdImg = assetsRef.current.yellowBird[bird.flapFrame];
//     if (birdImg) {
//       ctx.save();
//       ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
//       ctx.rotate(bird.rotation);
//       ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
//       ctx.restore();
//     }
    
//     if (gameStateRef.current === 'playing' || gameStateRef.current === 'over') {
//         ctx.fillStyle = "white";
//         ctx.font = "bold 48px sans-serif";
//         ctx.textAlign = "center";
//         ctx.strokeStyle = "black";
//         ctx.lineWidth = 2;
//         ctx.strokeText(String(displayedScore), canvas.width / 2, 80);
//         ctx.fillText(String(displayedScore), canvas.width / 2, 80);
//     }

//     if(gameStateRef.current === 'getReady'){
//         const msgImg = assetsRef.current.message;
//         if (msgImg) {
//             ctx.drawImage(msgImg, canvas.width / 2 - msgImg.width / 2, canvas.height / 2 - 150);
//         }
//     } else if(gameStateRef.current === 'over'){
//         const goImg = assetsRef.current.gameOver;
//         if (goImg) {
//             ctx.drawImage(goImg, canvas.width / 2 - goImg.width / 2, canvas.height / 2 - 100);
//         }
//     }
    
//     frameCountRef.current++;
//     animationFrameId.current = requestAnimationFrame(gameLoop);
//   };
  
//   const handleFlap = () => {
//     if (gameStateRef.current === "playing" && birdRef.current) {
//         birdRef.current.velocity = FLAP_STRENGTH;
//     } else if (gameStateRef.current === "getReady" && birdRef.current) {
//         gameStateRef.current = "playing";
//         birdRef.current.velocity = FLAP_STRENGTH;
//     } else if (gameStateRef.current === "over") {
//         resetGame();
//     }
//   }

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
    
//     canvas.width = 384;
//     canvas.height = 512;

//     loadImages(assetSources).then(loadedAssets => {
//       assetsRef.current = loadedAssets;
//       resetGame(); 
//       animationFrameId.current = requestAnimationFrame(gameLoop);
//     });

//     const spacebarHandler = (e: KeyboardEvent) => {
//         if (e.code === 'Space') e.preventDefault();
//     }
//     const flapHandler = (e: KeyboardEvent) => {
//         if (e.code === 'Space') handleFlap();
//     }

//     window.addEventListener("keydown", spacebarHandler);
//     window.addEventListener("keyup", flapHandler);
//     canvas.addEventListener("mousedown", handleFlap);
//     canvas.addEventListener("touchstart", handleFlap);

//     return () => {
//       if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
//       window.removeEventListener("keydown", spacebarHandler);
//       window.removeEventListener("keyup", flapHandler);
//       canvas.removeEventListener("mousedown", handleFlap);
//       canvas.removeEventListener("touchstart", handleFlap);
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div className="relative flex flex-col items-center justify-center bg-black rounded-lg shadow-2xl cursor-pointer">
//       <canvas ref={canvasRef} />
//       {isGameOver && (
//          <div 
//             className="absolute bottom-20 flex flex-col items-center"
//          >
//             <button 
//                 onClick={handleFlap}
//                 className="px-6 py-3 text-white bg-green-500 rounded-lg text-xl font-bold border-b-4 border-green-700 hover:bg-green-600 active:translate-y-1"
//             >
//                 Try Again
//             </button>
//          </div>
//       )}
//     </div>
//   );
// }

// // components/FlappyRoyaleGame.tsx
// "use client";

// import { useRef, useEffect, useState } from "react";

// // --- Type Interfaces (no change) ---
// interface Bird {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
//   velocity: number;
//   flapFrame: number;
// }

// interface Pipe {
//   x: number;
//   y: number;
//   width: number;
//   gap: number;
//   passed: boolean;
// }

// // --- Asset Paths (no change) ---
// const assetSources = {
//   backgroundDay: "/sprites/background-day.png",
//   base: "/sprites/base.png",
//   pipeGreen: "/sprites/pipe-green.png",
//   yellowBird: [
//     "/sprites/yellowbird-downflap.png",
//     "/sprites/yellowbird-midflap.png",
//     "/sprites/yellowbird-upflap.png",
//   ],
//   gameOver: "/sprites/gameover.png",
// };

// // --- Image Loader Utility (no change) ---
// interface LoadedAsset {
//   key: string;
//   value: HTMLImageElement | HTMLImageElement[];
// }

// const loadImages = (sources: typeof assetSources): Promise<Record<string, any>> => {
//   const promises = Object.entries(sources).map(([key, value]) => {
//     return new Promise<LoadedAsset>((resolve) => {
//       if (Array.isArray(value)) {
//         const imageArrayPromises = value.map((src) => {
//           return new Promise<HTMLImageElement>((resolveImg) => {
//             const img = new Image();
//             img.src = src;
//             img.onload = () => resolveImg(img);
//           });
//         });
//         Promise.all(imageArrayPromises).then((images) => resolve({ key, value: images }));
//       } else {
//         const img = new Image();
//         img.src = value;
//         img.onload = () => resolve({ key, value: img });
//       }
//     });
//   });

//   return Promise.all(promises).then((results) => {
//     return results.reduce((acc: Record<string, any>, { key, value }) => {
//       acc[key] = value;
//       return acc;
//     }, {});
//   });
// };


// export default function FlappyRoyaleGame() {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
// //   const animationFrameId = useRef<number>();
//   const animationFrameId = useRef<number | null>(null);
//   const assetsRef = useRef<Record<string, any>>({});
  
// //   const birdRef = useRef<Bird>();
//   const birdRef = useRef<Bird | null>(null);
//   const pipesRef = useRef<Pipe[]>([]);
//   const scoreRef = useRef<number>(0);
//   const frameCountRef = useRef<number>(0);
//   const gameStateRef = useRef<"start" | "playing" | "over">("start");

//   // UPDATED: Provide an initial value of 0 to satisfy TypeScript.
//   const currentPipeSpeedRef = useRef<number>(0);
//   const currentPipeGapRef = useRef<number>(0);

//   const [displayedScore, setDisplayedScore] = useState(0);
//   const [isGameOver, setIsGameOver] = useState(false);

//   const GRAVITY = 0.3;
//   const FLAP_STRENGTH = -6;
//   const BASE_HEIGHT = 112;
//   const BIRD_WIDTH = 34;
//   const BIRD_HEIGHT = 24;
//   const PIPE_WIDTH = 52;
//   const PIPE_HEIGHT = 320;

//   const INITIAL_PIPE_SPEED = 2;
//   const MAX_PIPE_SPEED = 4;
//   const INITIAL_PIPE_GAP = 120;
//   const MIN_PIPE_GAP = 90;
//   const DIFFICULTY_INCREASE_INTERVAL = 5;

//   const resetGame = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     birdRef.current = {
//       x: 50,
//       y: canvas.height / 2 - BIRD_HEIGHT / 2,
//       width: BIRD_WIDTH,
//       height: BIRD_HEIGHT,
//       velocity: 0,
//       flapFrame: 0,
//     };
    
//     currentPipeSpeedRef.current = INITIAL_PIPE_SPEED;
//     currentPipeGapRef.current = INITIAL_PIPE_GAP;

//     pipesRef.current = [];
//     generatePipes();

//     scoreRef.current = 0;
//     setDisplayedScore(0);
//     gameStateRef.current = "playing";
//     setIsGameOver(false);
//   };
  
//   const generatePipes = () => {
//       const canvas = canvasRef.current;
//       if(!canvas) return;

//       const newPipe: Pipe = {
//           x: canvas.width,
//           y: Math.floor(Math.random() * (canvas.height - BASE_HEIGHT - currentPipeGapRef.current - 150)) + 75,
//           width: PIPE_WIDTH,
//           gap: currentPipeGapRef.current,
//           passed: false,
//       };
//       pipesRef.current.push(newPipe);
//   }

//   const gameLoop = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas?.getContext("2d");
//     if (!ctx || !canvas) return;

//     if (gameStateRef.current === "playing") {
//       if (birdRef.current) {
//         birdRef.current.velocity += GRAVITY;
//         birdRef.current.y += birdRef.current.velocity;
//       }
      
//       if (frameCountRef.current % 5 === 0 && birdRef.current) {
//           birdRef.current.flapFrame = (birdRef.current.flapFrame + 1) % assetsRef.current.yellowBird.length;
//       }

//       pipesRef.current.forEach(pipe => pipe.x -= currentPipeSpeedRef.current);

//       const lastPipe = pipesRef.current[pipesRef.current.length - 1];
//       if (lastPipe.x < canvas.width - 200) {
//           generatePipes();
//       }
      
//       pipesRef.current = pipesRef.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);

//       const bird = birdRef.current;
//       if (bird) {
//         if (bird.y + bird.height > canvas.height - BASE_HEIGHT || bird.y < 0) {
//           gameStateRef.current = "over";
//           setIsGameOver(true);
//         }

//         for (const pipe of pipesRef.current) {
//           if (
//             bird.x < pipe.x + pipe.width &&
//             bird.x + bird.width > pipe.x &&
//             (bird.y < pipe.y || bird.y + bird.height > pipe.y + pipe.gap)
//           ) {
//             gameStateRef.current = "over";
//             setIsGameOver(true);
//           }
//         }
//       }
      
//       const birdCenterX = bird ? bird.x + bird.width / 2 : 0;
//       pipesRef.current.forEach(pipe => {
//         if (!pipe.passed && birdCenterX > pipe.x + pipe.width / 2) {
//           pipe.passed = true;
//           scoreRef.current++;
//           setDisplayedScore(scoreRef.current);
          
//           if (scoreRef.current % DIFFICULTY_INCREASE_INTERVAL === 0) {
//             if (currentPipeSpeedRef.current < MAX_PIPE_SPEED) {
//               currentPipeSpeedRef.current += 0.1;
//             }
//             if (currentPipeGapRef.current > MIN_PIPE_GAP) {
//               currentPipeGapRef.current -= 2;
//             }
//           }
//         }
//       });
//     }

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     const bg = assetsRef.current.backgroundDay;
//     if(bg) {
//         const bgWidth = 288;
//         const bgHeight = 512;
//         const bgLoop = Math.ceil(canvas.width / bgWidth) + 1;
//         for (let i = 0; i < bgLoop; i++) {
//              ctx.drawImage(bg, -((frameCountRef.current * 0.5) % bgWidth) + i * bgWidth, 0, bgWidth, bgHeight);
//         }
//     }

//     const pipeImg = assetsRef.current.pipeGreen;
//     if (pipeImg) {
//       pipesRef.current.forEach(pipe => {
//         ctx.drawImage(pipeImg, pipe.x, pipe.y - PIPE_HEIGHT);
//         ctx.drawImage(pipeImg, pipe.x, pipe.y + pipe.gap);
//       });
//     }

//     const base = assetsRef.current.base;
//     if (base) {
//       const baseWidth = 336;
//       const baseLoop = Math.ceil(canvas.width / baseWidth) + 1;
//       for (let i = 0; i < baseLoop; i++) {
//           ctx.drawImage(base, -((frameCountRef.current * currentPipeSpeedRef.current) % baseWidth) + i * baseWidth, canvas.height - BASE_HEIGHT);
//       }
//     }

//     const bird = birdRef.current;
//     if (bird) {
//       const birdImg = assetsRef.current.yellowBird[bird.flapFrame];
//       if (birdImg) {
//         ctx.save();
//         ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
//         ctx.rotate(Math.min(Math.max(-Math.PI / 4, bird.velocity / 15), Math.PI / 4)); 
//         ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
//         ctx.restore();
//       }
//     }
    
//      if (gameStateRef.current === 'playing' || gameStateRef.current === 'over') {
//         ctx.fillStyle = "white";
//         ctx.font = "bold 48px sans-serif";
//         ctx.textAlign = "center";
//         ctx.strokeStyle = "black";
//         ctx.lineWidth = 2;
//         ctx.strokeText(String(displayedScore), canvas.width / 2, 80);
//         ctx.fillText(String(displayedScore), canvas.width / 2, 80);
//     }

//     if(gameStateRef.current === 'over'){
//         const goImg = assetsRef.current.gameOver;
//         if(goImg) {
//             ctx.drawImage(goImg, canvas.width / 2 - goImg.width / 2, canvas.height / 2 - 100);
//         }
//     }
    
//     frameCountRef.current++;
//     animationFrameId.current = requestAnimationFrame(gameLoop);
//   };
  
//   const handleFlap = () => {
//     if (gameStateRef.current === 'playing' && birdRef.current) {
//       birdRef.current.velocity = FLAP_STRENGTH;
//     } else if (gameStateRef.current !== 'playing') {
//       resetGame();
//     }
//   }

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
    
//     canvas.width = 384;
//     canvas.height = 512;

//     loadImages(assetSources).then(loadedAssets => {
//       assetsRef.current = loadedAssets;
//       resetGame(); 
//       gameStateRef.current = "start"; 
//       animationFrameId.current = requestAnimationFrame(gameLoop);
//     });

//     const spacebarHandler = (e: KeyboardEvent) => {
//         if (e.code === 'Space') {
//             e.preventDefault();
//             handleFlap();
//         }
//     }
//     window.addEventListener("keydown", spacebarHandler);
//     window.addEventListener("mousedown", handleFlap);
//     window.addEventListener("touchstart", handleFlap);

//     return () => {
//       if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
//       window.removeEventListener("keydown", spacebarHandler);
//       window.removeEventListener("mousedown", handleFlap);
//       window.removeEventListener("touchstart", handleFlap);
//     };
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div className="relative flex flex-col items-center justify-center bg-black rounded-lg shadow-2xl">
//       <canvas ref={canvasRef} />
//       {isGameOver && (
//          <button 
//             onClick={resetGame} 
//             className="absolute bottom-20 px-6 py-3 text-white bg-green-500 rounded-lg text-xl font-bold border-b-4 border-green-700 hover:bg-green-600 active:translate-y-1"
//          >
//             Try Again
//          </button>
//       )}
//     </div>
//   );
// }