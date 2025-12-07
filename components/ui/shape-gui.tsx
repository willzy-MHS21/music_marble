import { GUI } from 'lil-gui';
import * as THREE from 'three';

export class ShapeGUI {
	private gui: GUI | null = null;
	private selectedObject: THREE.Object3D | null = null;
	private rotationInDegrees = { z: 0 };
	private noteData = { 
		note: 'C', 
		octave: 4,
		accidental: '' // '' or 'b'
	};
	private octaveController: any = null;
	private audioContext: AudioContext | null = null;

	// Checks if the object is a marble shape
	private isMarble(object: THREE.Object3D): boolean {
		const name = object.name.toLowerCase();
		return name.includes('marble') || 
			   (object.userData && object.userData.shapeType === 'marble');
	}

	/**
	 * Gets the valid octave range for a given note
	 * 88-key piano: A0 to C8
	 */
	private getValidOctaveRange(note: string, accidental: string): { min: number; max: number } {
		const fullNote = note + accidental;
		
		// Special cases based on 88-key piano range (A0 to C8)
		if (fullNote === 'A' || fullNote === 'Bb' || fullNote === 'B') {
			return { min: 0, max: 7 };
		} else if (fullNote === 'C') {
			return { min: 1, max: 8 }; // C1-C8
		} else if (fullNote === 'Db') {
			return { min: 1, max: 7 }; // Db1-Db7 
		} else {
			return { min: 1, max: 7 }; // Most notes: D1-D7, E1-E7, etc.
		}
	}

	/**
	 * Plays the sound for the current note
	 */
	private async playNoteSound(): Promise<void> {
		try {
			const fileName = `${this.noteData.note}${this.noteData.accidental}${this.noteData.octave}.mp3`;
			const soundPath = `/sounds/${fileName}`;

			// Create audio context if it doesn't exist
			if (!this.audioContext) {
				this.audioContext = new AudioContext();
			}

			// Fetch and play the audio
			const response = await fetch(soundPath);
			if (!response.ok) {
				console.error(`Sound file not found: ${soundPath}`);
				return;
			}

			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

			const source = this.audioContext.createBufferSource();
			source.buffer = audioBuffer;
			source.connect(this.audioContext.destination);
			source.start(0);

			console.log(`Playing note: ${this.getFullNoteName()} (file: ${fileName})`);
		} catch (error) {
			console.error('Error playing note sound:', error);
		}
	}

	/**
	 * Creates and displays a GUI for the selected object
	 * @param object - The Three.js object to control
	 * @param onDelete - Callback function when delete button is clicked
	 * @param onRotationChange - Optional callback function when rotation changes
	 */
	create(object: THREE.Object3D, onDelete: () => void, onRotationChange?: () => void): void {
		// Remove existing GUI if any
		this.destroy();

		// Create new GUI
		this.gui = new GUI();
		this.gui.title('Shape Properties');
		this.selectedObject = object;

		// Position GUI to the right edge
		this.gui.domElement.style.position = 'fixed';
		this.gui.domElement.style.top = '0';
		this.gui.domElement.style.right = '0';
		
		const isMarbleShape = this.isMarble(object);

		// Only show Piano Note Assignment Section if NOT a marble
		if (!isMarbleShape) {
			// Load existing note data if available, otherwise set defaults
			if ((object as any).userData.note) {
				this.noteData.note = (object as any).userData.note;
				this.noteData.octave = (object as any).userData.octave || 4;
				this.noteData.accidental = (object as any).userData.accidental || '';
			} else {
				// Set default note if none exists
				this.noteData.note = 'C';
				this.noteData.octave = 4;
				this.noteData.accidental = '';
				// Save the default to userData
				this.updateObjectNote();
			}

			// Piano Note Assignment Section
			const noteFolder = this.gui.addFolder('Piano Note');
			
			// Display current note at the top
			const displayNote = { currentNote: this.getFullNoteName() };
			const noteController = noteFolder.add(displayNote, 'currentNote')
				.name('Assigned Note')
				.disable();

			// Test sound button
			const testActions = {
				'Test Sound': () => {
					this.playNoteSound();
				}
			};
			noteFolder.add(testActions, 'Test Sound').name('Test Sound');

			// Step 1: Select note
			const noteSelectionFolder = noteFolder.addFolder('1. Select Note');
			
			// Natural notes
			const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
			const noteActions: any = {};
			
			naturalNotes.forEach(note => {
				noteActions[note] = () => {
					this.noteData.note = note;
					this.noteData.accidental = '';
					
					// Update octave range based on selected note
					this.updateOctaveRange();
					this.updateObjectNote();
					displayNote.currentNote = this.getFullNoteName();
					noteController.updateDisplay();
					console.log(`Selected note: ${this.getFullNoteName()}`);
				};
			});

			naturalNotes.forEach(note => {
				noteSelectionFolder.add(noteActions, note).name(note);
			});

			// Flat notes (Db, Eb, Gb, Ab, Bb)
			const flatNotes = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
			const flatActions: any = {};
			
			flatNotes.forEach(flatNote => {
				flatActions[flatNote] = () => {
					this.noteData.note = flatNote[0]; // First letter (C, D, F, G, A)
					this.noteData.accidental = 'b';
					
					// Update octave range based on selected note
					this.updateOctaveRange();
					this.updateObjectNote();
					displayNote.currentNote = this.getFullNoteName();
					noteController.updateDisplay();
					console.log(`Selected note: ${this.getFullNoteName()}`);
				};
			});

			flatNotes.forEach(flatNote => {
				noteSelectionFolder.add(flatActions, flatNote).name(flatNote);
			});
			
			noteSelectionFolder.open();

			// Step 2: Select octave
			const octaveFolder = noteFolder.addFolder('2. Select Octave');
			const range = this.getValidOctaveRange(this.noteData.note, this.noteData.accidental);
			
			this.octaveController = octaveFolder.add(this.noteData, 'octave', range.min, range.max, 1)
				.name('Octave')
				.onChange((value: number) => {
					this.updateObjectNote();
					displayNote.currentNote = this.getFullNoteName();
					noteController.updateDisplay();
					console.log(`Selected octave: ${this.getFullNoteName()}`);
				});
			
			octaveFolder.open();
			noteFolder.open();
		}

		// Rotation controls
		this.rotationInDegrees = {
			z: THREE.MathUtils.radToDeg(object.rotation.z)
		};

		const rotationFolder = this.gui.addFolder('Rotation');
		
		rotationFolder.add(this.rotationInDegrees, 'z', 0, 360, 1)
			.name('Rotate (°)')
			.onChange((value: number) => {
				object.rotation.z = THREE.MathUtils.degToRad(value);
				// Call the rotation change callback if provided
				if (onRotationChange) {
					onRotationChange();
				}
			});
		
		rotationFolder.open();

		// Delete button
		const actions = {
			deleteShape: () => {
				onDelete();
				this.destroy();
			}
		};
		
		this.gui.add(actions, 'deleteShape').name('Delete Shape');
	}

	/**
	 * Updates the octave slider range based on the current note
	 */
	private updateOctaveRange(): void {
		if (!this.octaveController) return;

		const range = this.getValidOctaveRange(this.noteData.note, this.noteData.accidental);
		
		// Adjust current octave if it's out of range
		if (this.noteData.octave < range.min) {
			this.noteData.octave = range.min;
		} else if (this.noteData.octave > range.max) {
			this.noteData.octave = range.max;
		}

		// Update the controller's min and max values
		this.octaveController.min(range.min);
		this.octaveController.max(range.max);
		this.octaveController.updateDisplay();
	}

	/**
	 * Updates the object's userData with the current note
	 */
	private updateObjectNote(): void {
		if (this.selectedObject) {
			(this.selectedObject as any).userData.note = this.noteData.note;
			(this.selectedObject as any).userData.octave = this.noteData.octave;
			(this.selectedObject as any).userData.accidental = this.noteData.accidental;
		}
	}

	/**
	 * Gets the full note name (e.g., "C4", "Bb3")
	 */
	private getFullNoteName(): string {
		return `${this.noteData.note}${this.noteData.accidental}${this.noteData.octave}`;
	}

	/**
	 * Gets the current note data
	 */
	getNoteData(): { note: string; octave: number; accidental: string; fullNote: string } {
		return {
			note: this.noteData.note,
			octave: this.noteData.octave,
			accidental: this.noteData.accidental,
			fullNote: this.getFullNoteName()
		};
	}

	// Destroys the GUI and cleans up
	destroy(): void {
		if (this.gui) {
			this.gui.destroy();
			this.gui = null;
		}
		this.selectedObject = null;
		this.octaveController = null;
		
		// Close audio context
		if (this.audioContext) {
			this.audioContext.close();
			this.audioContext = null;
		}
	}

	// Gets the currently selected object
	getSelectedObject(): THREE.Object3D | null {
		return this.selectedObject;
	}

	// Checks if GUI is currently active
	isActive(): boolean {
		return this.gui !== null;
	}
}