"use client";

interface MarbleControl {
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
                <button onClick={onDropBall} className={btnStyle}>Drop Marble</button>
            </div>

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-row gap-3 p-2 rounded-3xl pointer-events-auto">
                <button onClick={noteBlock} className={toolBtnStyle}>Note Block</button>
                <button onClick={track} className={toolBtnStyle}>Curve Track</button>
            </div>

        </div>
    );
}