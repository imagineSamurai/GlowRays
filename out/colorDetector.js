"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorDetector = exports.ColorDetector = void 0;
const vscode = require("vscode");
/**
 * Detects text ranges in the document to apply glow effect
 */
class ColorDetector {
    /**
     * Get text ranges in the document
     * @param document The text document
     */
    async getColors(document) {
        console.log(`Analyzing text ranges for document: ${document.uri.toString()}`);
        const text = document.getText();
        const colorInfos = [];
        // Get configuration - use the correct namespace for the setting
        const config = vscode.workspace.getConfiguration('glowrays');
        console.log('Checking GlowOnDefinitionNames setting...');
        const glowOnDefinitionsEnabled = config.get('GlowOnDefinitionNames');
        console.log(`GlowOnDefinitionNames setting value: ${glowOnDefinitionsEnabled}`);
        if (glowOnDefinitionsEnabled) {
            console.log('GlowOnDefinitionNames is enabled, using definition patterns only');
            // Default targets for definition highlighting
            const defaultTargets = ["function", "class", "method", "variable"];
            return this.getDefinitionColors(document, defaultTargets);
        }
        // Define patterns to match different token types
        // We're only using these to identify the ranges, not to set colors
        const patterns = [
            { pattern: /\b(function|class|const|let|var|import|export|return|if|else|for|while|switch|case|default|break|continue|do|in|instanceof|typeof|new|delete|throw|try|catch|finally|debugger|async|await)\b/g, tokenType: 'keyword' },
            { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, tokenType: 'constant' },
            { pattern: /"[^"]*"|'[^']*'|`[^`]*`/g, tokenType: 'string' },
            { pattern: /\b([0-9]+(\.[0-9]+)?)\b/g, tokenType: 'number' },
            { pattern: /\/\/.*$/gm, tokenType: 'comment' },
            { pattern: /\/\*[\s\S]*?\*\//g, tokenType: 'comment' },
            { pattern: /\b[A-Z][A-Za-z0-9_]*\b/g, tokenType: 'type' },
            { pattern: /\b[a-zA-Z_]\w*\b/g, tokenType: 'variable' }
        ];
        let totalMatches = 0;
        for (const { pattern, tokenType } of patterns) {
            let match;
            let matchCount = 0;
            // Reset the lastIndex for the regex to ensure it starts from the beginning
            pattern.lastIndex = 0;
            while ((match = pattern.exec(text)) !== null) {
                matchCount++;
                totalMatches++;
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                // Instead of assigning specific colors, we'll use 'currentColor'
                // This will inherit the current theme's color for each token
                colorInfos.push({
                    word: match[0],
                    range: new vscode.Range(startPos, endPos),
                    color: 'currentColor' // Use currentColor to inherit theme colors
                });
            }
            console.log(`Pattern matched ${matchCount} instances for token type '${tokenType}'`);
        }
        console.log(`Total matches found: ${totalMatches}`);
        return colorInfos;
    }
    /**
     * Get colors for definition names only (functions, classes, methods, variables)
     * @param document The text document
     * @param targets The target definition types to highlight
     */
    async getDefinitionColors(document, targets) {
        const colorInfos = [];
        const text = document.getText();
        // Get current language ID for language-specific patterns
        const languageId = document.languageId;
        console.log(`Detecting definitions for language: ${languageId}`);
        // Define patterns for each target type
        const patterns = {
            'function': /\bfunction\s+([a-zA-Z_]\w*)\s*\(/g,
            'class': /\bclass\s+([a-zA-Z_]\w*)\b/g,
            'method': /(?<=\b(get|set|async|static)?\s*)([a-zA-Z_]\w*)\s*\([^)]*\)\s*{/g,
            'variable': /\b(const|let|var)\s+([a-zA-Z_]\w*)\b/g
        };
        // Add Python-specific patterns
        if (languageId === 'python') {
            console.log('Using Python-specific patterns for definition detection');
            patterns['function'] = /\bdef\s+([a-zA-Z_]\w*)\s*\(/g;
            patterns['method'] = /\bdef\s+([a-zA-Z_]\w*)\s*\(/g;
            patterns['class'] = /\bclass\s+([a-zA-Z_]\w*)[:\(]/g;
            patterns['variable'] = /([a-zA-Z_]\w*)\s*=\s*[^=]/g;
        }
        let totalMatches = 0;
        for (const target of targets) {
            if (!patterns[target]) {
                console.log(`No pattern defined for target: ${target}`);
                continue;
            }
            const pattern = patterns[target];
            pattern.lastIndex = 0;
            let match;
            let matchCount = 0;
            while ((match = pattern.exec(text)) !== null) {
                matchCount++;
                totalMatches++;
                // Capture the identifier name, not the whole match
                let identifierName;
                let startIndex;
                if (target === 'variable' && languageId !== 'python') {
                    // For variables, the name is in capturing group 2
                    identifierName = match[2];
                    startIndex = match.index + match[0].indexOf(match[2]);
                }
                else {
                    // For functions, classes, etc. the name is in capturing group 1
                    identifierName = match[1] || match[0];
                    startIndex = match.index + match[0].indexOf(identifierName);
                }
                const startPos = document.positionAt(startIndex);
                const endPos = document.positionAt(startIndex + identifierName.length);
                // Add to results
                colorInfos.push({
                    word: identifierName,
                    range: new vscode.Range(startPos, endPos),
                    color: 'currentColor'
                });
            }
            console.log(`Target '${target}' matched ${matchCount} definitions`);
        }
        console.log(`Total definition matches found: ${totalMatches}`);
        return colorInfos;
    }
}
exports.ColorDetector = ColorDetector;
// Singleton instance
exports.colorDetector = new ColorDetector();
//# sourceMappingURL=colorDetector.js.map