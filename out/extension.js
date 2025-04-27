"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const colorDetector_1 = require("./colorDetector");
const settingsUI_1 = require("./settingsUI");
// Keep track of decorations for each editor and each color
const decorationTypesMap = new Map();
// Timeout for debouncing updates
let timeout = undefined;
// Dynamic glow animation timer
let dynamicGlowTimer = undefined;
let currentDynamicIntensity = 5;
let dynamicDirection = 'up';
let lastTypingTime = 0;
function activate(context) {
    console.log('GlowRays extension is now active');
    // Show a notification to confirm activation
    vscode.window.showInformationMessage('GlowRays extension is now active');
    // Make sure advancedMode is initialized
    const config = vscode.workspace.getConfiguration('glowrays');
    if (config.get('advancedMode') === undefined) {
        config.update('advancedMode', false, true);
    }
    // Register a command that can be invoked to toggle the extension
    const toggleCommand = vscode.commands.registerCommand('glowrays.toggle', () => {
        const config = vscode.workspace.getConfiguration('glowrays');
        const isEnabled = config.get('enable');
        config.update('enable', !isEnabled, true);
        vscode.window.showInformationMessage(`GlowRays: ${!isEnabled ? 'Enabled' : 'Disabled'}`);
    });
    // Register a command to open the settings UI
    const settingsCommand = vscode.commands.registerCommand('glowrays.openSettings', () => {
        settingsUI_1.SettingsUI.createOrShow(context.extensionUri);
    });
    // Subscribe to configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('glowrays')) {
            updateDecorations();
            // Check if we need to start or stop dynamic glow
            const dynamicConfig = config.get('dynamic.config', '3 8 5 false');
            const dynamicParts = dynamicConfig.split(' ');
            const isDynamicEnabled = dynamicParts.length >= 4 && dynamicParts[3] === 'true';
            if (isDynamicEnabled) {
                startDynamicGlow();
            }
            else {
                stopDynamicGlow();
            }
        }
    }));
    // Subscribe to active editor changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            console.log('Active editor changed, triggering update');
            triggerUpdateDecorations();
        }
    }));
    // Subscribe to document changes to track typing
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => {
        lastTypingTime = Date.now();
        triggerUpdateDecorations();
    }));
    // Check if dynamic glow should be enabled at startup
    const dynamicConfig = config.get('dynamic.config', '3 8 5 false');
    const dynamicParts = dynamicConfig.split(' ');
    const isDynamicEnabled = dynamicParts.length >= 4 && dynamicParts[3] === 'true';
    if (isDynamicEnabled) {
        startDynamicGlow();
    }
    // Add rest of the plugin registration
    context.subscriptions.push(toggleCommand, settingsCommand);
    // Initial update
    triggerUpdateDecorations();
}
function deactivate() {
    console.log('GlowRays extension deactivated');
    clearDecorations();
    stopDynamicGlow();
}
/**
 * Start the dynamic glow effect animation
 */
function startDynamicGlow() {
    // Stop any existing timer
    stopDynamicGlow();
    const config = vscode.workspace.getConfiguration('glowrays');
    const dynamicConfig = config.get('dynamic.config', '3 8 5 false');
    const dynamicParts = dynamicConfig.split(' ');
    // Get dynamic settings
    const minIntensity = parseFloat(dynamicParts[0] || '3');
    const maxIntensity = parseFloat(dynamicParts[1] || '8');
    const speedValue = parseInt(dynamicParts[2] || '5', 10);
    // Set initial intensity to min
    currentDynamicIntensity = minIntensity;
    dynamicDirection = 'up';
    // Calculate update interval based on speed (1-10)
    // Speed 1 = slow (500ms), Speed 10 = fast (50ms)
    const updateInterval = 550 - (speedValue * 50);
    console.log(`Starting dynamic glow with min: ${minIntensity}, max: ${maxIntensity}, speed: ${speedValue} (${updateInterval}ms)`);
    // Start the animation timer
    dynamicGlowTimer = setInterval(() => {
        // Check if we should pause while typing
        const pauseWhileTyping = config.get('pauseAnimationWhileTyping', false);
        if (pauseWhileTyping && (Date.now() - lastTypingTime < 1000)) {
            // User is typing, pause animation
            return;
        }
        // Update the intensity based on direction
        if (dynamicDirection === 'up') {
            currentDynamicIntensity += 0.1;
            if (currentDynamicIntensity >= maxIntensity) {
                currentDynamicIntensity = maxIntensity;
                dynamicDirection = 'down';
            }
        }
        else {
            currentDynamicIntensity -= 0.1;
            if (currentDynamicIntensity <= minIntensity) {
                currentDynamicIntensity = minIntensity;
                dynamicDirection = 'up';
            }
        }
        // Apply the new intensity
        updateDecorationsWithDynamicIntensity();
    }, updateInterval);
}
/**
 * Stop the dynamic glow animation
 */
function stopDynamicGlow() {
    if (dynamicGlowTimer) {
        clearInterval(dynamicGlowTimer);
        dynamicGlowTimer = undefined;
        console.log('Dynamic glow animation stopped');
        // Restore normal decorations
        updateDecorations();
    }
}
/**
 * Update decorations with the current dynamic intensity
 */
function updateDecorationsWithDynamicIntensity() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    console.log(`Applying dynamic intensity: ${currentDynamicIntensity.toFixed(1)}`);
    applyDecorations(editor, currentDynamicIntensity);
}
/**
 * Trigger an update to the text decorations, debounced
 */
function triggerUpdateDecorations() {
    if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
    }
    timeout = setTimeout(updateDecorations, 500);
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
    const isEnabled = config.get('enable');
    console.log(`GlowRays enabled: ${isEnabled}`);
    if (!isEnabled) {
        // Clear all decorations if disabled
        clearDecorations();
        return;
    }
    // Check if dynamic mode is enabled
    const dynamicConfig = config.get('dynamic.config', '3 8 5 false');
    const dynamicParts = dynamicConfig.split(' ');
    const isDynamicEnabled = dynamicParts.length >= 4 && dynamicParts[3] === 'true';
    // Use static or dynamic intensity
    let intensity;
    if (isDynamicEnabled && dynamicGlowTimer) {
        intensity = currentDynamicIntensity;
        console.log(`Using dynamic intensity: ${intensity.toFixed(1)}`);
    }
    else {
        intensity = config.get('intensity') || 5;
    }
    const includeLanguages = config.get('includeLanguages') || ['*'];
    const excludeLanguages = config.get('excludeLanguages') || [];
    // Check if the current language should be included
    const currentLanguage = editor.document.languageId;
    console.log(`Current language: ${currentLanguage}`);
    if (!(includeLanguages.includes('*') || includeLanguages.includes(currentLanguage)) ||
        excludeLanguages.includes(currentLanguage)) {
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
function clearDecorationsForEditor(editor) {
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
async function applyDecorations(editor, intensity) {
    const document = editor.document;
    const editorId = document.uri.toString();
    console.log(`Applying decorations to editor: ${editorId} with intensity: ${intensity}`);
    // Get colors for all words in the document
    const colorInfos = await colorDetector_1.colorDetector.getColors(document);
    console.log(`Found ${colorInfos.length} colored elements in the document`);
    // Group by color for efficient decoration
    const colorGroups = new Map();
    colorInfos.forEach(info => {
        if (!colorGroups.has(info.color)) {
            colorGroups.set(info.color, []);
        }
        colorGroups.get(info.color).push(info.range);
    });
    console.log(`Grouped into ${colorGroups.size} color groups`);
    // Clear old decorations
    clearDecorationsForEditor(editor);
    // Create a new color map for this editor
    const colorMap = new Map();
    decorationTypesMap.set(editorId, colorMap);
    // Apply decorations for each color
    colorGroups.forEach((ranges, color) => {
        // Create a decoration type with shadow for glow effect
        // Using a very subtle text-shadow to create a glow without changing the text appearance
        const decorationType = vscode.window.createTextEditorDecorationType({
            // Do NOT set the color property to preserve theme colors
            // Use a more subtle text-shadow that doesn't affect the perceived color
            textDecoration: `none; text-shadow: 0 0 ${intensity}px currentColor, 0 0 ${intensity * 2}px currentColor`
        });
        console.log(`Applying glow effect to ${ranges.length} ranges`);
        // Store the decoration type
        colorMap.set(color, decorationType);
        // Apply decorations to editor
        editor.setDecorations(decorationType, ranges);
    });
}
//# sourceMappingURL=extension.js.map