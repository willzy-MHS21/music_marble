"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Play, Pause, Plus } from "lucide-react";

import { useState } from "react";

interface ShapeButtonsProps {
    marble: (event: React.MouseEvent) => void;
    plank: (event: React.MouseEvent) => void;
    cylinder: (event: React.MouseEvent) => void;
    curve: (event: React.MouseEvent) => void;
    spongebob: (event: React.MouseEvent) => void;
    ginger: (event: React.MouseEvent) => void;
    steve: (event: React.MouseEvent) => void;
    creeper: (event: React.MouseEvent) => void;
    onPlayPause: () => void;
    isPaused: boolean;
}

export default function ShapeButtons({ marble, plank, cylinder, curve, spongebob, ginger, steve, creeper, onPlayPause, isPaused }: ShapeButtonsProps) {
    const [hoverDecoration, setHoverDecoration] = useState(false);

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-row gap-3 p-2 rounded-3xl pointer-events-auto">
            <Button
                onClick={onPlayPause}
                variant="ghost"
                size="icon"
                className={`w-16 h-16 rounded-2xl hover:scale-120 transition-all ${isPaused
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

            {/* Decoration Menu Container */}
            <div
                className="relative"
                onMouseEnter={() => setHoverDecoration(true)}
                onMouseLeave={() => setHoverDecoration(false)}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
                >
                    <Plus style={{ width: '52px', height: '52px' }} className="text-gray-600" />
                    <span className="sr-only">Decorations</span>
                </Button>
                
                {/* Hidden decoration buttons - Show on hover */}
                {hoverDecoration && (
                    <div className="absolute bottom-full mb-3 left-0 flex flex-col gap-3">
                        <Button
                            onClick={creeper}
                            variant="ghost"
                            size="icon"
                            className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
                            title="Creeper"
                        >
                            <Image
                                src="/images/creeper.png"
                                alt="Creeper"
                                width={42}
                                height={30}
                                className="object-contain"
                                unoptimized
                            />
                        </Button>
                        <Button
                            onClick={steve}
                            variant="ghost"
                            size="icon"
                            className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
                            title="Steve"
                        >
                            <Image
                                src="/images/steve.png"
                                alt="Steve"
                                width={42}
                                height={42}
                                className="object-contain max-h-16"
                                unoptimized
                            />
                        </Button>
                        <Button
                            onClick={ginger}
                            variant="ghost"
                            size="icon"
                            className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
                            title="Ginger"
                        >
                            <Image
                                src="/images/ginger.png"
                                alt="Ginger"
                                width={42}
                                height={42}
                                className="object-contain"
                                unoptimized
                            />
                        </Button>
                        <Button
                            onClick={spongebob}
                            variant="ghost"
                            size="icon"
                            className="w-16 h-16 rounded-2xl hover:scale-120 transition-all bg-white/60 hover:bg-white"
                            title="Spongebob"
                        >
                            <Image
                                src="/images/spongebob.png"
                                alt="Spongebob"
                                width={80}
                                height={80}
                                className="object-contain"
                                unoptimized
                            />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}