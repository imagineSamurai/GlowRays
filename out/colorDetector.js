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
}
exports.ColorDetector = ColorDetector;
// Singleton instance
exports.colorDetector = new ColorDetector();
//# sourceMappingURL=colorDetector.js.map