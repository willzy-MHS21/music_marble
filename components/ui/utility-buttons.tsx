"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileDown, Trash2, Menu, Camera, CameraOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UtilityButtonsProps {
    onImport: () => void;
    onExport: () => void;
    onLoad: () => void;
    onClear: () => void;
    onCameraToggle: () => void;
    isCameraLocked?: boolean;
}

export default function UtilityButtons({ 
    onImport, 
    onExport, 
    onLoad, 
    onClear, 
    onCameraToggle,
    isCameraLocked = false 
}: UtilityButtonsProps) {
    const [showButtons, setShowButtons] = useState(false);

    return (
        <div 
            className="absolute top-3 left-3 flex flex-col gap-2"
            onMouseEnter={() => setShowButtons(true)}
            onMouseLeave={() => setShowButtons(false)}
        >
            {/* Menu Icon - Always visible */}
            <Button 
                size="icon" 
                className="w-10 h-10 rounded-full bg-white/60 hover:bg-white text-black"
            >
                <Menu style={{ width: '24px', height: '24px' }} />
                <span className="sr-only">Menu</span>
            </Button>
            
            {/* Hidden buttons - Show on menu hover */}
            {showButtons && (
                <div className="flex flex-col gap-2">
                    <Tooltip disableHoverableContent>
                        <TooltipTrigger asChild>
                            <Button onClick={onImport} size="icon" className="w-10 h-10 rounded-full bg-white/60 hover:bg-white text-black">
                                <Upload style={{ width: '24px', height: '24px' }} />
                                <span className="sr-only">Import</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white text-black border-white [&_svg]:!fill-white [&_svg]:!bg-white">
                            <p>Upload your scene</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip disableHoverableContent>
                        <TooltipTrigger asChild>
                            <Button onClick={onExport} size="icon" className="w-10 h-10 rounded-full bg-white/60 hover:bg-white text-black">
                                <Download style={{ width: '24px', height: '24px' }} />
                                <span className="sr-only">Save/Export</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white text-black border-white [&_svg]:!fill-white [&_svg]:!bg-white">
                            <p>Save your scene</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip disableHoverableContent>
                        <TooltipTrigger asChild>
                            <Button onClick={onLoad} size="icon" className="w-10 h-10 rounded-full bg-white/60 hover:bg-white text-black">
                                <FileDown style={{ width: '24px', height: '24px' }} />
                                <span className="sr-only">Load Demo</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white text-black border-white [&_svg]:!fill-white [&_svg]:!bg-white">
                            <p>Load a demo</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip disableHoverableContent>
                        <TooltipTrigger asChild>
                            <Button onClick={onClear} size="icon" className="w-10 h-10 rounded-full bg-white/60 hover:bg-white text-black">
                                <Trash2 style={{ width: '24px', height: '24px' }} />
                                <span className="sr-only">Clear</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white text-black border-white [&_svg]:!fill-white [&_svg]:!bg-white">
                            <p>Clear scene</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip disableHoverableContent>
                        <TooltipTrigger asChild>
                            <Button 
                                onClick={onCameraToggle} 
                                size="icon" 
                                className={`w-10 h-10 rounded-full text-black ${
                                    isCameraLocked 
                                        ? 'bg-blue-500/80 hover:bg-blue-600' 
                                        : 'bg-white/60 hover:bg-white'
                                }`}
                            >
                                {isCameraLocked ? (
                                    <CameraOff style={{ width: '24px', height: '24px' }} />
                                ) : (
                                    <Camera style={{ width: '24px', height: '24px' }} />
                                )}
                                <span className="sr-only">Camera</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-white text-black border-white [&_svg]:!fill-white [&_svg]:!bg-white">
                            <p>{isCameraLocked ? 'Unlock camera' : 'Lock camera'}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}
        </div>
    );
}