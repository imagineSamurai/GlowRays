import * as vscode from 'vscode';
import { colorDetector } from './colorDetector';

// Keep track of decorations for each editor and each color
const decorationTypesMap = new Map<string, Map<string, vscode.TextEditorDecorationType>>();

// Timeout for debouncing updates
let timeout: NodeJS.Timeout | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
	console.log('GlowRays extension is now active');
	
	// Show a notification to confirm activation
	vscode.window.showInformationMessage('GlowRays extension is now active');

	// Register a command that can be invoked to toggle the extension
	const toggleCommand = vscode.commands.registerCommand('glowrays.toggle', () => {
		const config = vscode.workspace.getConfiguration('glowrays');
		const isEnabled = config.get<boolean>('enable');
		config.update('enable', !isEnabled, true);
		vscode.window.showInformationMessage(`GlowRays: ${!isEnabled ? 'Enabled' : 'Disabled'}`);
	});

	// Subscribe to configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(event => {
			if (event.affectsConfiguration('glowrays')) {
				updateDecorations();
			}
		})
	);

	// Subscribe to active editor changes
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				console.log(`Active editor changed to ${editor.document.languageId}, triggering update`);
				// Force immediate update for language changes
				clearTimeout(timeout);
				timeout = undefined;
				updateDecorations();
			}
		})
	);

	// Subscribe to document changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			const editor = vscode.window.activeTextEditor;
			if (editor && event.document === editor.document) {
				console.log('Document changed, triggering update');
				triggerUpdateDecorations();
			}
		})
	);

	// Initial update
	triggerUpdateDecorations();

	context.subscriptions.push(toggleCommand);
}

/**
 * Trigger an update of the decorations after a delay
 */
function triggerUpdateDecorations() {
	if (timeout) {
		clearTimeout(timeout);
		timeout = undefined;
	}
	timeout = setTimeout(updateDecorations, 300);
}

/**
 * Update decorations in the active editor
 */
function updateDecorations() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		console.log('No active editor found');
		return;
	}

	const config = vscode.workspace.getConfiguration('glowrays');
	const isEnabled = config.get<boolean>('enable');
	
	console.log(`GlowRays enabled: ${isEnabled}`);
	
	if (!isEnabled) {
		// Clear all decorations if disabled
		clearDecorations();
		return;
	}

	const intensity = config.get<number>('intensity') || 5;
	const includeLanguages = config.get<string[]>('includeLanguages') || ['*'];
	const excludeLanguages = config.get<string[]>('excludeLanguages') || [];

	// Check if the current language should be included
	const currentLanguage = editor.document.languageId;
	console.log(`Current language: ${currentLanguage}`);
	
	if (
		!(includeLanguages.includes('*') || includeLanguages.includes(currentLanguage)) ||
		excludeLanguages.includes(currentLanguage)
	) {
		// Clear decorations for excluded languages
		console.log('Language excluded, clearing decorations');
		clearDecorationsForEditor(editor);
		return;
	}

	// Apply decorations
	applyDecorations(editor, intensity);
}

/**
 * Clear all decorations from all editors
 */
function clearDecorations() {
	console.log('Clearing all decorations');
	decorationTypesMap.forEach(colorMap => {
		colorMap.forEach(decorationType => {
			decorationType.dispose();
		});
		colorMap.clear();
	});
	decorationTypesMap.clear();
}

/**
 * Clear decorations for a specific editor
 */
function clearDecorationsForEditor(editor: vscode.TextEditor) {
	const editorId = editor.document.uri.toString();
	console.log(`Clearing decorations for editor: ${editorId}`);
	const colorMap = decorationTypesMap.get(editorId);
	if (colorMap) {
		colorMap.forEach(decorationType => {
			decorationType.dispose();
		});
		decorationTypesMap.delete(editorId);
	}
}

/**
 * Apply decorations to an editor based on the document content
 */
async function applyDecorations(editor: vscode.TextEditor, intensity: number) {
	const document = editor.document;
	const editorId = document.uri.toString();
	
	console.log(`Applying decorations to editor: ${editorId} with base intensity: ${intensity}`);
	
	// Get configuration and check if GlowOnDefinitionNames is enabled
	const config = vscode.workspace.getConfiguration('glowrays');
	console.log('Checking GlowOnDefinitionNames setting in applyDecorations...');
	const glowOnDefinitionsEnabled = config.get<boolean>('GlowOnDefinitionNames');
	console.log(`GlowOnDefinitionNames in applyDecorations: ${glowOnDefinitionsEnabled}`);
	
	// Get colors for all words in the document
	const colorInfos = await colorDetector.getColors(document);
	console.log(`Found ${colorInfos.length} colored elements in the document`);
	
	// Group by color for efficient decoration
	const colorGroups = new Map<string, vscode.Range[]>();
	
	colorInfos.forEach(info => {
		if (!colorGroups.has(info.color)) {
			colorGroups.set(info.color, []);
		}
		colorGroups.get(info.color)!.push(info.range);
	});
	
	console.log(`Grouped into ${colorGroups.size} color groups`);
	
	// Clear old decorations
	clearDecorationsForEditor(editor);
	
	// Create a new color map for this editor
	const colorMap = new Map<string, vscode.TextEditorDecorationType>();
	decorationTypesMap.set(editorId, colorMap);
	
	// Apply decorations for each color
	colorGroups.forEach((ranges, color) => {
		// Create a decoration type with shadow for glow effect
		// Using a very subtle text-shadow to create a glow without changing the text appearance
		const decorationType = vscode.window.createTextEditorDecorationType({
			// Do NOT set the color property to preserve theme colors
			// Use a more subtle text-shadow that doesn't affect the perceived color
			textDecoration: `none; text-shadow: 0 0 ${intensity}px currentColor, 0 0 ${intensity*2}px currentColor`
		});
		
		console.log(`Applying glow effect to ${ranges.length} ranges`);
		
		// Store the decoration type
		colorMap.set(color, decorationType);
		
		// Apply decorations to editor
		editor.setDecorations(decorationType, ranges);
	});
}

export function deactivate() {
	console.log('GlowRays extension deactivated');
	clearDecorations();
} 