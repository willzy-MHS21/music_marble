"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ShapeButtonsProps {
    marble: () => void;
    plank: () => void;
    cylinder: () => void;
}

export default function ShapeButtons({ marble, plank, cylinder }: ShapeButtonsProps) {
    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-row gap-3 p-2 rounded-3xl pointer-events-auto">
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
        </div>
    );
}