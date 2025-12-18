import { Model } from '../objects/Model';

export class AudioSystem {
    private audioContext: AudioContext;
    private audioBuffers: Map<string, AudioBuffer>;

    constructor(audioContext: AudioContext, audioBuffers: Map<string, AudioBuffer>) {
        this.audioContext = audioContext;
        this.audioBuffers = audioBuffers;
    }

    public playNoteForModel(model: Model) {
        const noteData = model.getNoteData();
        if (!noteData) {
            return;
        }
        this.playNote(noteData.note, noteData.octave, noteData.accidental);
    }

    public playNote(note: string, octave: number, accidental: string = '') {
        const fileName = `${note}${accidental}${octave}`;
        this.playSound(fileName);
    }

    public playCollisionSound(model1: Model, model2: Model) {
        let targetModel: Model | null = null;

        if (model1.shapeType !== 'marble') {
            targetModel = model1;
        } else if (model2.shapeType !== 'marble') {
            targetModel = model2;
        }

        if (targetModel) {
            this.playNoteForModel(targetModel);
        }
    }

    private playSound(name: string) {
        const buffer = this.audioBuffers.get(name);
        if (!buffer) {
            console.warn(`Audio buffer not found for: ${name}`);
            return;
        }

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
        console.log(`Playing sound: ${name}`);
    }
}
