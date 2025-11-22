"use client";

interface  MarbleControl {
    onImport: () => void;
    onExport: () => void;
    onLoad: () => void;
    onClear: () => void;
    onDropBall: () => void;
    noteBlock: () => void;
    track: () => void;
}

export default function MarbleUI({onDropBall, onImport, onExport, onLoad, onClear, noteBlock, track} : MarbleControl) {
    const btnStyle = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded text-xs";
    const toolBtnStyle = "bg-white/90 hover:bg-white text-black w-16 h-16 rounded-2xl  hover:scale-110 transition-all";
    return (
        <div>
            <div className="absolute top-3 left-3 flex flex-row gap-1">
                <button onClick={onImport} className={btnStyle}>Import</button>
                <button onClick={onExport} className={btnStyle} >Save/Export</button>
                <button onClick={onLoad} className={btnStyle}>Load Demo</button>
                <button onClick={onClear} className={btnStyle}>Clear</button>
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto">
                <button
                    onClick={onDropBall}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow-xl hover:scale-105 transition-all"> Play</button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 p-2 rounded-3xl">
                <button onClick={noteBlock} className={toolBtnStyle}>Note Block</button>
                <button onClick={track} className={toolBtnStyle}>Curve Track</button>
            </div>
        </div>
    );
}