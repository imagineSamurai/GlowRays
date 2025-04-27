import * as vscode from 'vscode';

export class SettingsUI {
    public static currentPanel: SettingsUI | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            _ => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'saveSettings':
                        await this._saveSettings(message.settings);
                        // Show a subtle notification
                        vscode.window.setStatusBarMessage('GlowRays settings updated', 3000);
                        return;
                    case 'autoSave':
                        await this._saveSettings(message.settings);
                        return;
                    case 'error':
                        vscode.window.showErrorMessage(message.message);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (SettingsUI.currentPanel) {
            SettingsUI.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'glowraysSettings',
            'GlowRays Settings',
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,
                // Restrict the webview to only loading content from our extension's directory
                localResourceRoots: [extensionUri],
                // Retain content when hidden for faster reshow
                retainContextWhenHidden: true
            }
        );

        SettingsUI.currentPanel = new SettingsUI(panel, extensionUri);
    }

    public dispose() {
        SettingsUI.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private async _saveSettings(settings: any) {
        const config = vscode.workspace.getConfiguration('glowrays');
        
        // Log the settings being saved for debugging
        console.log('Saving settings:', JSON.stringify({
            advancedMode: settings.advancedMode,
            // other key settings if needed...
        }));
        
        // Update each setting
        await config.update('enable', settings.enable, true);
        await config.update('intensity', settings.intensity, true);
        await config.update('includeLanguages', settings.includeLanguages, true);
        await config.update('excludeLanguages', settings.excludeLanguages, true);
        await config.update('disableOnErrors', settings.disableOnErrors, true);
        await config.update('dynamic.config', settings.dynamicConfig, true);
        await config.update('pauseAnimationWhileTyping', settings.pauseAnimationWhileTyping, true);
        await config.update('GlowOnDefinitionNames', settings.glowOnDefinitionNames, true);
        
        // Always save advanced mode, don't check if it's undefined
        await config.update('advancedMode', settings.advancedMode, true);
        
        // Verify the settings were saved
        setTimeout(() => {
            const updatedConfig = vscode.workspace.getConfiguration('glowrays');
            console.log('Verified saved settings:', JSON.stringify({
                advancedMode: updatedConfig.get('advancedMode'),
                // other settings if needed...
            }));
        }, 100);
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = "GlowRays Settings";
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(_webview: vscode.Webview) {
        // Get version - hardcoded for simplicity to avoid TypeScript errors
        const version = '1.3.0';
        
        const config = vscode.workspace.getConfiguration('glowrays');
        // Add logging for debugging
        console.log('Loading settings from config:', JSON.stringify({
            advancedMode: config.get('advancedMode'),
            // other settings if needed...
        }));
        
        const enable = config.get('enable', true);
        const intensity = config.get('intensity', 5);
        const includeLanguages = config.get('includeLanguages', ['*']);
        const excludeLanguages = config.get('excludeLanguages', []);
        const disableOnErrors = config.get('disableOnErrors', true);
        const dynamicConfig = config.get('dynamic.config', '3 8 5 false');
        const pauseAnimationWhileTyping = config.get('pauseAnimationWhileTyping', false);
        const glowOnDefinitionNames = config.get('GlowOnDefinitionNames', false);

        // Parse dynamic config
        const dynamicParts = dynamicConfig.split(' ');
        const isDynamicEnabled = dynamicParts.length >= 4 && dynamicParts[3] === 'true';
        const dynamicMin = dynamicParts[0] || '3';
        const dynamicMax = dynamicParts[1] || '8';
        const dynamicSpeed = dynamicParts[2] || '5';

        // For simplicity, prepare the HTML string with all variables replaced
        // to avoid template literal issues with TypeScript
        const versionDisplay = version;
        const intensityValue = intensity.toString();
        const maxIntensity = Math.max(intensity, 10).toString();
        const includeLanguagesJSON = JSON.stringify(includeLanguages);
        const excludeLanguagesJSON = JSON.stringify(excludeLanguages);
        const enableChecked = enable ? 'checked' : '';
        const disableOnErrorsChecked = disableOnErrors ? 'checked' : '';
        const pauseAnimationChecked = pauseAnimationWhileTyping ? 'checked' : '';
        const glowOnDefinitionNamesChecked = glowOnDefinitionNames ? 'checked' : '';
        const dynamicEnabledChecked = isDynamicEnabled ? 'checked' : '';

        // Parse the advanced section state from configuration
        const advancedMode = config.get('advancedMode', false);
        const advancedModeChecked = advancedMode ? 'checked' : '';

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GlowRays Settings</title>
            <style>
                :root {
                    --primary-color: var(--vscode-button-background);
                    --primary-hover: var(--vscode-button-hoverBackground);
                    --card-background: var(--vscode-editor-inactiveSelectionBackground);
                    --border-color: var(--vscode-panel-border);
                    --text-color: var(--vscode-foreground);
                    --bg-color: var(--vscode-editor-background);
                    --input-bg: var(--vscode-input-background);
                    --input-fg: var(--vscode-input-foreground);
                    --input-border: var(--vscode-input-border);
                    --heading-color: var(--vscode-editor-foreground);
                    --disabled-bg: rgba(100, 100, 100, 0.2);
                    --disabled-fg: rgba(200, 200, 200, 0.5);
                    --save-indicator: rgba(75, 204, 80, 0.8);
                }
                
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 20px;
                    color: var(--text-color);
                    background-color: var(--bg-color);
                    line-height: 1.5;
                    transition: background-color 0.3s ease;
                }
                
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    position: relative;
                }
                
                .logo h1 {
                    margin: 0 0 0 10px;
                    color: var(--heading-color);
                    font-weight: 500;
                }
                
                .glow-title {
                    background: linear-gradient(
                        90deg,
                        #ff0000, #ff9900, #33cc33, #3399ff, #cc33ff, #ff3399
                    );
                    background-size: 600% 600%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    animation: rainbow 10s ease infinite, pulse 3s infinite alternate;
                }
                
                @keyframes rainbow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes pulse {
                    0% { text-shadow: 0 0 5px rgba(255,255,255,0.3), 0 0 10px rgba(255,255,255,0.2); }
                    100% { text-shadow: 0 0 7px rgba(255,255,255,0.4), 0 0 14px rgba(255,255,255,0.3); }
                }
                
                .version-badge {
                    position: relative;
                    display: inline-block;
                    background-color: rgba(104, 104, 241, 0.8);
                    color: white;
                    font-size: 12px;
                    padding: 3px 8px;
                    border-radius: 20px;
                    margin-left: 10px;
                    font-weight: normal;
                    overflow: hidden;
                    z-index: 1;
                }
                
                .version-badge::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        90deg,
                        rgba(255, 0, 128, 0.7),
                        rgba(255, 153, 0, 0.7),
                        rgba(51, 204, 51, 0.7),
                        rgba(51, 153, 255, 0.7),
                        rgba(204, 51, 255, 0.7),
                        rgba(255, 51, 153, 0.7)
                    );
                    background-size: 600% 600%;
                    mix-blend-mode: overlay;
                    animation: rainbow-bg 8s linear infinite;
                    z-index: -1;
                }
                
                @keyframes rainbow-bg {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                
                .new-badge {
                    background-color: rgba(75, 204, 80, 0.8);
                    color: white;
                    font-size: 11px;
                    font-weight: bold;
                    padding: 2px 6px;
                    border-radius: 12px;
                    margin-left: 6px;
                    text-transform: uppercase;
                    position: relative;
                    top: -1px;
                }
                
                .save-indicator {
                    display: none;
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: var(--save-indicator);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 1000;
                }
                
                .save-indicator.show {
                    display: block;
                    opacity: 1;
                }
                
                h1, h2 {
                    color: var(--heading-color);
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 10px;
                    font-weight: 400;
                }
                
                .card {
                    margin-bottom: 20px;
                    padding: 20px;
                    background-color: var(--card-background);
                    border-radius: 6px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }
                
                .card-title {
                    font-size: 16px;
                    font-weight: 500;
                    margin-top: 0;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                }
                
                .setting-row {
                    display: flex;
                    margin-bottom: 15px;
                    align-items: center;
                    transition: opacity 0.3s ease;
                }
                
                .setting-row.disabled {
                    opacity: 0.5;
                    pointer-events: none;
                }
                
                .setting-label {
                    flex: 0 0 200px;
                    margin-right: 20px;
                    font-size: 14px;
                }
                
                .setting-description {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-top: 3px;
                }
                
                .setting-control {
                    flex: 1;
                }
                
                input[type="number"],
                input[type="text"],
                textarea {
                    background-color: var(--input-bg);
                    color: var(--input-fg);
                    border: 1px solid var(--input-border);
                    padding: 8px 10px;
                    border-radius: 4px;
                    width: 100%;
                    font-size: 14px;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }

                input[type="number"]:focus,
                input[type="text"]:focus,
                textarea:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3);
                    outline: none;
                }
                
                input[type="range"] {
                    width: 100%;
                    margin: 0;
                    cursor: pointer;
                }
                
                input[type="range"]:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .checkbox-container {
                    display: flex;
                    align-items: center;
                }
                
                input[type="checkbox"] {
                    margin-right: 8px;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                
                button {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    transition: background-color 0.2s, transform 0.1s;
                }
                
                button:hover {
                    background-color: var(--primary-hover);
                }
                
                button:active {
                    transform: scale(0.98);
                }
                
                .range-value {
                    margin-left: 10px;
                    font-weight: 500;
                    min-width: 30px;
                    text-align: center;
                }
                
                .advanced-toggle {
                    margin: 20px 0;
                    padding: 10px 15px;
                    background-color: rgba(128, 128, 128, 0.1);
                    border-radius: 4px;
                    font-weight: 500;
                    cursor: pointer;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    transition: background-color 0.3s ease;
                }
                
                .advanced-toggle:hover {
                    background-color: rgba(128, 128, 128, 0.2);
                }
                
                .advanced-toggle input {
                    margin-right: 10px;
                }
                
                .advanced-section {
                    display: none;
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .tag-input {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 5px;
                    border: 1px solid var(--input-border);
                    border-radius: 4px;
                    background-color: var(--input-bg);
                    min-height: 38px;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                
                .tag-input:focus-within {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3);
                }
                
                .tag {
                    background-color: var(--primary-color);
                    color: white;
                    padding: 3px 8px;
                    border-radius: 100px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    animation: tagAppear 0.2s ease-in-out;
                }
                
                @keyframes tagAppear {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                
                .tag-input input {
                    background: transparent;
                    border: none;
                    flex: 1;
                    min-width: 60px;
                    outline: none;
                    color: var(--input-fg);
                    padding: 5px;
                }
                
                .tag button {
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 0 0 0 5px;
                    margin: 0;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                }
                
                .tag button:hover {
                    opacity: 1;
                    background: transparent;
                }
                
                .all-tag {
                    background-color: rgba(0, 120, 212, 0.8);
                }
                
                .pills-input {
                    margin-top: 5px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .footer {
                    text-align: center;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: 30px;
                }
                
                .hidden {
                    display: none;
                }
                
                /* Loading spinner for auto-save */
                .spinner {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s linear infinite;
                    margin-left: 5px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <h1>
                        <span class="glow-title">GlowRays</span> Settings
                        <span class="version-badge">v${versionDisplay}</span>
                    </h1>
                </div>
                
                <div id="saveIndicator" class="save-indicator">
                    Settings saved <div class="spinner"></div>
                </div>
                
                <div class="card">
                    <h3 class="card-title">Basic Settings</h3>
                    
                    <div class="setting-row">
                        <div class="setting-label">Enable GlowRays</div>
                        <div class="setting-control">
                            <div class="checkbox-container">
                                <input type="checkbox" id="enable" ${enableChecked}>
                                <label for="enable">Enable glow effect globally</label>
                            </div>
                        </div>
                    </div>
                    
                    <div id="basicIntensityRow" class="setting-row">
                        <div class="setting-label">
                            Glow Intensity
                            <div class="setting-description">Adjust the brightness of the glow effect</div>
                        </div>
                        <div class="setting-control">
                            <div style="display: flex; align-items: center;">
                                <input type="range" id="intensity" min="0.1" max="10" value="${intensityValue}" step="0.1">
                                <span class="range-value" id="intensityValue">${intensityValue}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Include Languages
                            <div class="setting-description">Languages where glow should be applied</div>
                        </div>
                        <div class="setting-control">
                            <div class="tag-input" id="includeLanguagesContainer">
                                <!-- Tags will be inserted here by JavaScript -->
                                <input type="hidden" id="includeLanguages" value='${includeLanguagesJSON}'>
                                <input type="text" id="includeLanguagesInput" placeholder="Type a language and press Enter">
                            </div>
                            <div class="pills-input">Type a language name (e.g., javascript, python) and press Enter</div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Exclude Languages
                            <div class="setting-description">Languages to exclude from glow effect</div>
                        </div>
                        <div class="setting-control">
                            <div class="tag-input" id="excludeLanguagesContainer">
                                <!-- Tags will be inserted here by JavaScript -->
                                <input type="hidden" id="excludeLanguages" value='${excludeLanguagesJSON}'>
                                <input type="text" id="excludeLanguagesInput" placeholder="Type a language and press Enter">
                            </div>
                            <div class="pills-input">Type a language name (e.g., markdown, json) and press Enter</div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Disable on Errors
                            <div class="setting-description">Automatically disable glow on lines with errors</div>
                        </div>
                        <div class="setting-control">
                            <div class="checkbox-container">
                                <input type="checkbox" id="disableOnErrors" ${disableOnErrorsChecked}>
                                <label for="disableOnErrors">Disable glow on error lines</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Glow on Definition Names Only
                            <div class="setting-description">Apply glow effect only to specific code elements</div>
                        </div>
                        <div class="setting-control">
                            <div class="checkbox-container">
                                <input type="checkbox" id="glowOnDefinitionNames" ${glowOnDefinitionNamesChecked}>
                                <label for="glowOnDefinitionNames">Glow only on function/class names</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="advanced-toggle">
                    <input type="checkbox" id="advancedModeToggle" ${advancedModeChecked}>
                    <label for="advancedModeToggle">Advanced Settings <span class="new-badge">New in 1.3.0</span></label>
                </div>
                
                <div id="advancedSection" class="advanced-section card">
                    <h3 class="card-title">Advanced Settings</h3>
                    
                    <div id="advancedIntensityRow" class="setting-row">
                        <div class="setting-label">
                            High Intensity Glow
                            <div class="setting-description">Increase glow intensity beyond standard limits</div>
                        </div>
                        <div class="setting-control">
                            <div style="display: flex; align-items: center;">
                                <input type="range" id="advancedIntensity" min="10" max="30" value="${maxIntensity}" step="0.1">
                                <span class="range-value" id="advancedIntensityValue">${maxIntensity}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Dynamic Glow
                            <div class="setting-description">Enable "breathing" glow effect</div>
                        </div>
                        <div class="setting-control">
                            <div class="checkbox-container">
                                <input type="checkbox" id="dynamicGlowEnabled" ${dynamicEnabledChecked}>
                                <label for="dynamicGlowEnabled">Enable dynamic glow effect</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Dynamic Glow Min
                            <div class="setting-description">Minimum intensity for dynamic glow</div>
                        </div>
                        <div class="setting-control">
                            <div style="display: flex; align-items: center;">
                                <input type="range" id="dynamicGlowMin" min="1" max="10" value="${dynamicMin}" step="1">
                                <span class="range-value" id="dynamicGlowMinValue">${dynamicMin}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Dynamic Glow Max
                            <div class="setting-description">Maximum intensity for dynamic glow</div>
                        </div>
                        <div class="setting-control">
                            <div style="display: flex; align-items: center;">
                                <input type="range" id="dynamicGlowMax" min="2" max="30" value="${dynamicMax}" step="1">
                                <span class="range-value" id="dynamicGlowMaxValue">${dynamicMax}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Dynamic Glow Speed
                            <div class="setting-description">Speed of intensity transitions (1-10)</div>
                        </div>
                        <div class="setting-control">
                            <div style="display: flex; align-items: center;">
                                <input type="range" id="dynamicGlowSpeed" min="1" max="10" value="${dynamicSpeed}" step="1">
                                <span class="range-value" id="dynamicGlowSpeedValue">${dynamicSpeed}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-row">
                        <div class="setting-label">
                            Pause Animation While Typing
                            <div class="setting-description">Reduce flickering during typing</div>
                        </div>
                        <div class="setting-control">
                            <div class="checkbox-container">
                                <input type="checkbox" id="pauseAnimationWhileTyping" ${pauseAnimationChecked}>
                                <label for="pauseAnimationWhileTyping">Pause animation during typing</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; text-align: center;" class="hidden">
                    <button id="saveButton">Save Settings</button>
                </div>
                
                <div class="footer">
                    GlowRays v${versionDisplay} - Settings UI added in v1.3.0 - © ImagineSamurai
                </div>
            </div>
            
            <script>
                (function() {
                    // Performance optimization - use requestIdleCallback to run non-essential setup
                    const runWhenIdle = (callback) => {
                        if ('requestIdleCallback' in window) {
                            window.requestIdleCallback(callback);
                        } else {
                            setTimeout(callback, 1);
                        }
                    };
                    
                    const vscode = acquireVsCodeApi();
                    
                    // Debounce function to limit how often a function can be called
                    function debounce(func, wait) {
                        let timeout;
                        return function executedFunction(...args) {
                            const later = () => {
                                clearTimeout(timeout);
                                func(...args);
                            };
                            clearTimeout(timeout);
                            timeout = setTimeout(later, wait);
                        };
                    }
                    
                    // Safely get element value with fallback
                    function safeGetElementValue(id, defaultValue) {
                        const element = document.getElementById(id);
                        return element ? element.value : defaultValue;
                    }
                    
                    // Safely get element checked state with fallback
                    function safeGetElementChecked(id, defaultValue) {
                        const element = document.getElementById(id);
                        return element ? element.checked : defaultValue;
                    }
                    
                    // Function to show a save indicator
                    function showSaveIndicator() {
                        const saveIndicator = document.getElementById('saveIndicator');
                        if (!saveIndicator) return;
                        
                        saveIndicator.classList.add('show');
                        setTimeout(() => {
                            saveIndicator.classList.remove('show');
                        }, 2000);
                    }
                    
                    // Updated function to update UI when Dynamic Glow is changed
                    function updateDynamicGlowUI() {
                        const dynamicEnabled = safeGetElementChecked('dynamicGlowEnabled', false);
                        const basicIntensityRow = document.getElementById('basicIntensityRow');
                        const intensityInput = document.getElementById('intensity');
                        const advancedIntensityRow = document.getElementById('advancedIntensityRow');
                        const advancedIntensityInput = document.getElementById('advancedIntensity');
                        
                        // Get dynamic glow controls
                        const dynamicMinRow = document.getElementById('dynamicGlowMin').closest('.setting-row');
                        const dynamicMaxRow = document.getElementById('dynamicGlowMax').closest('.setting-row');
                        const dynamicSpeedRow = document.getElementById('dynamicGlowSpeed').closest('.setting-row');
                        const dynamicMinInput = document.getElementById('dynamicGlowMin');
                        const dynamicMaxInput = document.getElementById('dynamicGlowMax');
                        const dynamicSpeedInput = document.getElementById('dynamicGlowSpeed');
                        
                        if (basicIntensityRow && intensityInput) {
                            if (dynamicEnabled) {
                                basicIntensityRow.classList.add('disabled');
                                intensityInput.disabled = true;
                            } else {
                                basicIntensityRow.classList.remove('disabled');
                                intensityInput.disabled = false;
                            }
                        }
                        
                        // Also disable the advanced intensity slider when dynamic glow is enabled
                        if (advancedIntensityRow && advancedIntensityInput) {
                            if (dynamicEnabled) {
                                advancedIntensityRow.classList.add('disabled');
                                advancedIntensityInput.disabled = true;
                            } else {
                                advancedIntensityRow.classList.remove('disabled');
                                advancedIntensityInput.disabled = false;
                            }
                        }
                        
                        // Grey out dynamic glow controls when dynamic glow is disabled
                        if (dynamicMinRow && dynamicMaxRow && dynamicSpeedRow && 
                            dynamicMinInput && dynamicMaxInput && dynamicSpeedInput) {
                            if (!dynamicEnabled) {
                                dynamicMinRow.classList.add('disabled');
                                dynamicMaxRow.classList.add('disabled');
                                dynamicSpeedRow.classList.add('disabled');
                                dynamicMinInput.disabled = true;
                                dynamicMaxInput.disabled = true;
                                dynamicSpeedInput.disabled = true;
                            } else {
                                dynamicMinRow.classList.remove('disabled');
                                dynamicMaxRow.classList.remove('disabled');
                                dynamicSpeedRow.classList.remove('disabled');
                                dynamicMinInput.disabled = false;
                                dynamicMaxInput.disabled = false;
                                dynamicSpeedInput.disabled = false;
                            }
                        }
                    }
                    
                    // Function to show a warning dialog
                    function showWarningDialog(title, message, callback) {
                        const overlay = document.createElement('div');
                        overlay.className = 'warning-overlay';
                        overlay.style.position = 'fixed';
                        overlay.style.top = '0';
                        overlay.style.left = '0';
                        overlay.style.width = '100%';
                        overlay.style.height = '100%';
                        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                        overlay.style.zIndex = '1000';
                        overlay.style.display = 'flex';
                        overlay.style.justifyContent = 'center';
                        overlay.style.alignItems = 'center';
                        
                        const dialog = document.createElement('div');
                        dialog.className = 'warning-dialog';
                        dialog.style.backgroundColor = 'var(--vscode-editor-background)';
                        dialog.style.color = 'var(--vscode-editor-foreground)';
                        dialog.style.borderRadius = '6px';
                        dialog.style.padding = '20px';
                        dialog.style.maxWidth = '500px';
                        dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                        
                        const titleEl = document.createElement('h3');
                        titleEl.textContent = title;
                        titleEl.style.margin = '0 0 15px 0';
                        titleEl.style.color = 'var(--vscode-editorWarning-foreground, #ff9800)';
                        
                        const messageEl = document.createElement('p');
                        messageEl.textContent = message;
                        messageEl.style.margin = '0 0 20px 0';
                        messageEl.style.lineHeight = '1.5';
                        
                        const buttonContainer = document.createElement('div');
                        buttonContainer.style.display = 'flex';
                        buttonContainer.style.justifyContent = 'flex-end';
                        buttonContainer.style.gap = '10px';
                        
                        const cancelBtn = document.createElement('button');
                        cancelBtn.textContent = 'Cancel';
                        cancelBtn.style.padding = '6px 12px';
                        cancelBtn.style.cursor = 'pointer';
                        
                        const confirmBtn = document.createElement('button');
                        confirmBtn.textContent = 'Continue';
                        confirmBtn.style.padding = '6px 12px';
                        confirmBtn.style.cursor = 'pointer';
                        confirmBtn.style.backgroundColor = 'var(--vscode-button-background)';
                        confirmBtn.style.color = 'var(--vscode-button-foreground)';
                        confirmBtn.style.border = 'none';
                        confirmBtn.style.borderRadius = '3px';
                        
                        cancelBtn.addEventListener('click', () => {
                            document.body.removeChild(overlay);
                            if (callback) callback(false);
                        });
                        
                        confirmBtn.addEventListener('click', () => {
                            document.body.removeChild(overlay);
                            if (callback) callback(true);
                        });
                        
                        buttonContainer.appendChild(cancelBtn);
                        buttonContainer.appendChild(confirmBtn);
                        
                        dialog.appendChild(titleEl);
                        dialog.appendChild(messageEl);
                        dialog.appendChild(buttonContainer);
                        overlay.appendChild(dialog);
                        
                        document.body.appendChild(overlay);
                    }
                    
                    // Auto-save function to collect all settings and save them
                    const autoSave = debounce(() => {
                        try {
                            const settings = collectSettings();
                            vscode.postMessage({
                                command: 'autoSave',
                                settings: settings
                            });
                            showSaveIndicator();
                        } catch (err) {
                            vscode.postMessage({
                                command: 'error',
                                message: 'Error saving settings: ' + err.message
                            });
                        }
                    }, 500);
                    
                    // Function to collect all settings from the form
                    function collectSettings() {
                        // Safe parsing of JSON values with fallbacks
                        let includeLanguagesValue = [];
                        let excludeLanguagesValue = [];
                        
                        try {
                            const includeValue = safeGetElementValue('includeLanguages', '["*"]');
                            includeLanguagesValue = JSON.parse(includeValue);
                        } catch (e) {
                            includeLanguagesValue = ["*"];
                        }
                        
                        try {
                            const excludeValue = safeGetElementValue('excludeLanguages', '[]');
                            excludeLanguagesValue = JSON.parse(excludeValue);
                        } catch (e) {
                            excludeLanguagesValue = [];
                        }
                        
                        // Choose intensity based on advanced mode
                        const useAdvancedMode = safeGetElementChecked('advancedModeToggle', false);
                        const dynamicEnabled = safeGetElementChecked('dynamicGlowEnabled', false);
                        
                        const intensityValue = useAdvancedMode ? 
                            parseFloat(safeGetElementValue('advancedIntensity', '10')) : 
                            parseFloat(safeGetElementValue('intensity', '5'));
                        
                        // Build dynamic config string
                        const dynamicMin = safeGetElementValue('dynamicGlowMin', '3');
                        const dynamicMax = safeGetElementValue('dynamicGlowMax', '8');
                        const dynamicSpeed = safeGetElementValue('dynamicGlowSpeed', '5');
                        const dynamicConfigStr = dynamicMin + ' ' + dynamicMax + ' ' + dynamicSpeed + ' ' + dynamicEnabled;
                        
                        // Return the collected settings including advancedMode
                        return {
                            enable: safeGetElementChecked('enable', true),
                            intensity: intensityValue,
                            includeLanguages: includeLanguagesValue,
                            excludeLanguages: excludeLanguagesValue,
                            disableOnErrors: safeGetElementChecked('disableOnErrors', true),
                            dynamicConfig: dynamicConfigStr,
                            pauseAnimationWhileTyping: safeGetElementChecked('pauseAnimationWhileTyping', false),
                            glowOnDefinitionNames: safeGetElementChecked('glowOnDefinitionNames', false),
                            advancedMode: useAdvancedMode
                        };
                    }
                    
                    // Set up advanced mode toggle with persistence and unchecking feature
                    function setupAdvancedMode() {
                        const advancedToggle = document.getElementById('advancedModeToggle');
                        const advancedSection = document.getElementById('advancedSection');
                        const basicIntensityRow = document.getElementById('basicIntensityRow');
                        const intensityInput = document.getElementById('intensity');
                        
                        // All checkbox inputs in the advanced section
                        const advancedCheckboxes = Array.from(
                            advancedSection?.querySelectorAll('input[type="checkbox"]') || []
                        );
                        
                        if (advancedToggle && advancedSection) {
                            // Initialize advanced section visibility - explicitly set display style
                            console.log('Advanced mode checked:', advancedToggle.checked);
                            advancedSection.style.display = advancedToggle.checked ? 'block' : 'none';
                            
                            // If advanced mode is enabled on load, ensure the UI is correctly set up
                            if (advancedToggle.checked) {
                                // Disable the basic intensity when advanced mode is on
                                if (basicIntensityRow && intensityInput) {
                                    basicIntensityRow.classList.add('disabled');
                                    intensityInput.disabled = true;
                                }
                            }
                            
                            advancedToggle.addEventListener('change', () => {
                                advancedSection.style.display = advancedToggle.checked ? 'block' : 'none';
                                
                                // When advanced mode is disabled, uncheck all advanced checkboxes
                                if (!advancedToggle.checked) {
                                    // Uncheck all checkboxes in advanced section
                                    advancedCheckboxes.forEach(checkbox => {
                                        if (checkbox.id !== 'advancedModeToggle') {
                                            checkbox.checked = false;
                                        }
                                    });
                                    
                                    // Make sure to disable dynamic glow since it's unchecked now
                                    updateDynamicGlowUI();
                                }
                                
                                // Disable basic intensity when advanced mode is enabled
                                if (advancedToggle.checked && basicIntensityRow && intensityInput) {
                                    basicIntensityRow.classList.add('disabled');
                                    intensityInput.disabled = true;
                                } else if (basicIntensityRow && intensityInput) {
                                    // Only enable if dynamic glow is not enabled
                                    const dynamicEnabled = safeGetElementChecked('dynamicGlowEnabled', false);
                                    if (!dynamicEnabled) {
                                        basicIntensityRow.classList.remove('disabled');
                                        intensityInput.disabled = false;
                                    }
                                }
                                
                                // Use collectSettings to get ALL settings including the updated advancedMode value
                                const allSettings = collectSettings();
                                
                                // Send the complete settings object to be saved
                                vscode.postMessage({
                                    command: 'autoSave',
                                    settings: allSettings
                                });
                                
                                showSaveIndicator();
                            });
                        }
                    }
                    
                    // Set up event listeners
                    function setupEventListeners() {
                        // Set up advanced mode toggle
                        setupAdvancedMode();
                        
                        // Set up dynamic glow toggle
                        const dynamicGlowToggle = document.getElementById('dynamicGlowEnabled');
                        if (dynamicGlowToggle) {
                            dynamicGlowToggle.addEventListener('change', () => {
                                updateDynamicGlowUI();
                                autoSave();
                            });
                            
                            // Initialize dynamic glow UI state
                            updateDynamicGlowUI();
                        }
                        
                        // Handle intensity sliders
                        const intensitySlider = document.getElementById('intensity');
                        const intensityValueDisplay = document.getElementById('intensityValue');
                        const advancedIntensitySlider = document.getElementById('advancedIntensity');
                        const advancedIntensityValueDisplay = document.getElementById('advancedIntensityValue');
                        const dynamicSpeedSlider = document.getElementById('dynamicGlowSpeed');
                        const dynamicSpeedValueDisplay = document.getElementById('dynamicGlowSpeedValue');
                        const dynamicMinSlider = document.getElementById('dynamicGlowMin');
                        const dynamicMinValueDisplay = document.getElementById('dynamicGlowMinValue');
                        const dynamicMaxSlider = document.getElementById('dynamicGlowMax');
                        const dynamicMaxValueDisplay = document.getElementById('dynamicGlowMaxValue');
                        
                        if (intensitySlider && intensityValueDisplay) {
                            intensitySlider.addEventListener('input', () => {
                                intensityValueDisplay.textContent = parseFloat(intensitySlider.value).toFixed(1);
                            });
                            
                            intensitySlider.addEventListener('change', autoSave);
                        }
                        
                        if (advancedIntensitySlider && advancedIntensityValueDisplay) {
                            advancedIntensitySlider.addEventListener('input', () => {
                                advancedIntensityValueDisplay.textContent = parseFloat(advancedIntensitySlider.value).toFixed(1);
                            });
                            
                            advancedIntensitySlider.addEventListener('change', autoSave);
                        }
                        
                        if (dynamicSpeedSlider && dynamicSpeedValueDisplay) {
                            dynamicSpeedSlider.addEventListener('input', () => {
                                dynamicSpeedValueDisplay.textContent = dynamicSpeedSlider.value;
                            });
                            
                            dynamicSpeedSlider.addEventListener('change', autoSave);
                        }
                        
                        if (dynamicMinSlider && dynamicMinValueDisplay) {
                            dynamicMinSlider.addEventListener('input', () => {
                                dynamicMinValueDisplay.textContent = dynamicMinSlider.value;
                            });
                            
                            dynamicMinSlider.addEventListener('change', autoSave);
                        }
                        
                        if (dynamicMaxSlider && dynamicMaxValueDisplay) {
                            dynamicMaxSlider.addEventListener('input', () => {
                                dynamicMaxValueDisplay.textContent = dynamicMaxSlider.value;
                            });
                            
                            dynamicMaxSlider.addEventListener('change', autoSave);
                        }
                        
                        // Set up auto-save for checkboxes and numbers
                        document.querySelectorAll('input[type="checkbox"], input[type="number"]').forEach(input => {
                            input.addEventListener('change', autoSave);
                        });
                    }
                    
                    // Set up language tag inputs
                    function setupTagInput(containerId, inputId, hiddenInputId) {
                        const container = document.getElementById(containerId);
                        const input = document.getElementById(inputId);
                        const hiddenInput = document.getElementById(hiddenInputId);
                        
                        if (!container || !input || !hiddenInput) {
                            console.error("Tag input setup failed: Missing elements for " + containerId);
                            return;
                        }
                        
                        // Initial value from hidden input
                        let tags = [];
                        try {
                            tags = JSON.parse(hiddenInput.value || '[]');
                        } catch (e) {
                            console.error('Error parsing tags:', e);
                            tags = [];
                        }
                        
                        // Render initial tags
                        function renderTags() {
                            // Clear existing tags (but keep the input)
                            while (container.firstChild && container.firstChild !== input) {
                                container.removeChild(container.firstChild);
                            }
                            
                            // Add tags
                            tags.forEach((tag, index) => {
                                const tagElement = document.createElement('div');
                                tagElement.className = 'tag' + (tag === '*' ? ' all-tag' : '');
                                
                                const tagText = tag === '*' ? 'All Languages' : tag;
                                tagElement.innerHTML = tagText + 
                                    '<button type="button" data-index="' + index + '">&times;</button>';
                                
                                // Insert before the input
                                container.insertBefore(tagElement, input);
                            });
                        }
                        
                        // Add a new tag
                        function addTag(tagValue) {
                            if (!tagValue) return;
                            
                            tagValue = tagValue.trim();
                            if (tagValue && !tags.includes(tagValue)) {
                                // Special case: if adding "All Languages", replace with '*' and clear other tags
                                if (tagValue.toLowerCase() === 'all languages') {
                                    tags = ['*'];
                                } else if (tagValue === '*') {
                                    tags = ['*'];
                                } else {
                                    // Remove "all languages" if it exists
                                    const allIndex = tags.indexOf('*');
                                    if (allIndex !== -1) {
                                        tags.splice(allIndex, 1);
                                    }
                                    tags.push(tagValue);
                                }
                                
                                hiddenInput.value = JSON.stringify(tags);
                                renderTags();
                                autoSave();
                            }
                        }
                        
                        // Remove a tag
                        container.addEventListener('click', (e) => {
                            if (e.target.tagName === 'BUTTON') {
                                const index = parseInt(e.target.getAttribute('data-index'), 10);
                                if (!isNaN(index) && index >= 0 && index < tags.length) {
                                    tags.splice(index, 1);
                                    hiddenInput.value = JSON.stringify(tags);
                                    renderTags();
                                    autoSave();
                                }
                            }
                        });
                        
                        // Handle input events
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                addTag(input.value);
                                input.value = '';
                            }
                        });
                        
                        input.addEventListener('blur', () => {
                            addTag(input.value);
                            input.value = '';
                        });
                        
                        // Initial render
                        renderTags();
                    }
                    
                    // Set up save button (hidden but kept for fallback)
                    function setupSaveButton() {
                        const saveButton = document.getElementById('saveButton');
                        if (saveButton) {
                            saveButton.addEventListener('click', () => {
                                try {
                                    const settings = collectSettings();
                                    vscode.postMessage({
                                        command: 'saveSettings',
                                        settings: settings
                                    });
                                } catch (err) {
                                    vscode.postMessage({
                                        command: 'error',
                                        message: 'Error saving settings: ' + err.message
                                    });
                                }
                            });
                        }
                    }
                    
                    // Function to update the visibility of advanced settings
                    function updateAdvancedVisibility() {
                        const advancedSection = document.getElementById('advancedSection');
                        const advancedToggle = document.getElementById('advancedModeToggle');
                        
                        if (advancedSection && advancedToggle) {
                            advancedSection.style.display = advancedToggle.checked ? 'block' : 'none';
                        }
                    }
                    
                    // Main initialization
                    document.addEventListener('DOMContentLoaded', () => {
                        console.log('DOM ready, initializing settings UI');
                        
                        // Handle intensity sliders
                        const intensitySlider = document.getElementById('intensity');
                        const intensityValueDisplay = document.getElementById('intensityValue');
                        const advancedIntensitySlider = document.getElementById('advancedIntensity');
                        const advancedIntensityValueDisplay = document.getElementById('advancedIntensityValue');
                        const dynamicSpeedSlider = document.getElementById('dynamicGlowSpeed');
                        const dynamicSpeedValueDisplay = document.getElementById('dynamicGlowSpeedValue');
                        const dynamicMinSlider = document.getElementById('dynamicGlowMin');
                        const dynamicMinValueDisplay = document.getElementById('dynamicGlowMinValue');
                        const dynamicMaxSlider = document.getElementById('dynamicGlowMax');
                        const dynamicMaxValueDisplay = document.getElementById('dynamicGlowMaxValue');
                        
                        if (intensitySlider && intensityValueDisplay) {
                            intensitySlider.addEventListener('input', () => {
                                intensityValueDisplay.textContent = parseFloat(intensitySlider.value).toFixed(1);
                            });
                            
                            intensitySlider.addEventListener('change', autoSave);
                        }
                        
                        if (advancedIntensitySlider && advancedIntensityValueDisplay) {
                            advancedIntensitySlider.addEventListener('input', () => {
                                advancedIntensityValueDisplay.textContent = parseFloat(advancedIntensitySlider.value).toFixed(1);
                            });
                            
                            advancedIntensitySlider.addEventListener('change', autoSave);
                        }
                        
                        if (dynamicSpeedSlider && dynamicSpeedValueDisplay) {
                            dynamicSpeedSlider.addEventListener('input', () => {
                                dynamicSpeedValueDisplay.textContent = dynamicSpeedSlider.value;
                            });
                            
                            dynamicSpeedSlider.addEventListener('change', autoSave);
                        }
                        
                        if (dynamicMinSlider && dynamicMinValueDisplay) {
                            dynamicMinSlider.addEventListener('input', () => {
                                dynamicMinValueDisplay.textContent = dynamicMinSlider.value;
                            });
                            
                            dynamicMinSlider.addEventListener('change', autoSave);
                        }
                        
                        if (dynamicMaxSlider && dynamicMaxValueDisplay) {
                            dynamicMaxSlider.addEventListener('input', () => {
                                dynamicMaxValueDisplay.textContent = dynamicMaxSlider.value;
                            });
                            
                            dynamicMaxSlider.addEventListener('change', autoSave);
                        }
                        
                        // Set up auto-save for checkboxes and numbers
                        const numberInputs = document.querySelectorAll('input[type="number"]');
                        numberInputs.forEach(input => {
                            input.addEventListener('change', autoSave);
                        });
                        
                        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(checkbox => {
                            if (checkbox.id !== 'advancedModeToggle' && checkbox.id !== 'dynamicGlowEnabled') {
                                checkbox.addEventListener('change', autoSave);
                            }
                        });
                        
                        // Special handler for advancedModeToggle with warning
                        const advancedModeToggle = document.getElementById('advancedModeToggle');
                        if (advancedModeToggle) {
                            advancedModeToggle.addEventListener('change', (e) => {
                                if (advancedModeToggle.checked) {
                                    showWarningDialog(
                                        "⚠️ Advanced Mode Warning", 
                                        "Advanced settings may impact performance on low-end devices. High intensity values or certain combinations of settings could cause lag, especially on older hardware. Are you sure you want to enable advanced mode?",
                                        (confirmed) => {
                                            if (!confirmed) {
                                                advancedModeToggle.checked = false;
                                            }
                                            // Always auto-save after dialog closes
                                            autoSave();
                                            updateAdvancedVisibility();
                                        }
                                    );
                                } else {
                                    autoSave();
                                    updateAdvancedVisibility();
                                }
                            });
                        }
                        
                        // Special handler for dynamicGlowEnabled with alpha warning
                        const dynamicGlowToggle = document.getElementById('dynamicGlowEnabled');
                        if (dynamicGlowToggle) {
                            dynamicGlowToggle.addEventListener('change', (e) => {
                                if (dynamicGlowToggle.checked) {
                                    showWarningDialog(
                                        "⚠️ Alpha Feature Warning", 
                                        "Dynamic Glow is currently in ALPHA state. This feature may cause performance issues on some systems and is still under development. It might lead to higher CPU usage and memory consumption. Do you want to continue?",
                                        (confirmed) => {
                                            if (!confirmed) {
                                                dynamicGlowToggle.checked = false;
                                            }
                                            updateDynamicGlowUI();
                                            autoSave();
                                        }
                                    );
                                } else {
                                    updateDynamicGlowUI();
                                    autoSave();
                                }
                            });
                        }
                        
                        // Initial UI updates
                        updateDynamicGlowUI();
                        updateAdvancedVisibility();
                        
                        // Add CSS for disabled rows
                        const styleElement = document.createElement('style');
                        styleElement.textContent = 
                            ".disabled { opacity: 0.5; }" +
                            ".disabled input, .disabled select { pointer-events: none; }";
                        document.head.appendChild(styleElement);
                    });
                })();
            </script>
        </body>
        </html>`;
    }
} 