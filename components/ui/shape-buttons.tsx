"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Play, Pause } from "lucide-react";

interface ShapeButtonsProps {
    marble: (event: React.MouseEvent) => void;
    plank: (event: React.MouseEvent) => void;
    cylinder: (event: React.MouseEvent) => void;
    curve: (event: React.MouseEvent) => void;
    spongebob: (event: React.MouseEvent) => void;
    onPlayPause: () => void;
    isPaused: boolean;
}

export default function ShapeButtons({ marble, plank, cylinder, curve, spongebob, onPlayPause, isPaused }: ShapeButtonsProps) {
    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-row gap-3 p-2 rounded-3xl pointer-events-auto">
            <Button 
                onClick={onPlayPause}
                variant="ghost"
                size="icon"
                className={`w-16 h-16 rounded-2xl hover:scale-120 transition-all ${
                    isPaused 
                        ? 'bg-green-500/70 hover:bg-green-500' 
                        : 'bg-blue-500/70 hover:bg-blue-500'
                }`}
            >
                {isPaused ? (
                    <Play style={{ width: '45px', height: '45px' }} className="text-white fill-white" />
                ) : (
                    <Pause style={{ width: '45px', height: '45px' }} className="text-white fill-white" />
                )}
                <span className="sr-only">{isPaused ? 'Play' : 'Pause'}</span>
            </Button>

            <Button 
                onClick={marble}
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
            >
                <Image 
                    src="/images/marble.png" 
                    alt="Marble" 
                    width={52} 
                    height={52}
                    className="object-contain"
                    unoptimized
                />
                <span className="sr-only">Marble</span>
            </Button>
            
            <Button 
                onClick={plank} 
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
            >
                <Image 
                    src="/images/plank.png" 
                    alt="Plank" 
                    width={52} 
                    height={52}
                    className="object-contain"
                    unoptimized
                />
                <span className="sr-only">Plank</span>
            </Button>

            <Button 
                onClick={cylinder}
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
            >
                <Image 
                    src="/images/cylinder.png" 
                    alt="Cylinder" 
                    width={52} 
                    height={52}
                    className="object-contain"
                    unoptimized
                />
                <span className="sr-only">Cylinder</span>
            </Button>

            <Button 
                onClick={curve}
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
            >
                <Image 
                    src="/images/curve.png" 
                    alt="Curve" 
                    width={54} 
                    height={54}
                    className="object-contain"
                    unoptimized
                />
                <span className="sr-only">Curve</span>
            </Button>

            <Button
                onClick={spongebob}
                variant="ghost"
                size="icon"
                className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
            >
                <Image
                    src="/images/spongebob.png"
                    alt="Spongebob"
                    width={54}
                    height={54}
                    className="object-contain"
                    unoptimized
                />
                <span className="sr-only">Spongebob</span>
            </Button>

        </div>
    );
}