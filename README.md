# GlowRays VSCode Extension

<a href="https://marketplace.visualstudio.com/items?itemName=imagineSamurai.glowrays">![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/imagineSamurai.glowrays)</a>
<a href="https://marketplace.visualstudio.com/items?itemName=imagineSamurai.glowrays">![VS Code Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/imagineSamurai.glowrays)</a>
<a href="https://marketplace.visualstudio.com/items?itemName=imagineSamurai.glowrays">![VS Code Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/imagineSamurai.glowrays)</a>
<a href="https://x.com/GlowRays_VSC">![Twitter Follow](https://img.shields.io/twitter/follow/GlowRays_VSC?style=social)</a>

> ## ⚠️ DYNAMIC FEATURES ALPHA NOTICE
> The core glow functionality of this extension works great! Only the **dynamic intensity feature** is currently in alpha development.
> Due to VS Code API limitations, the dynamic glow effect may cause performance issues on some systems.
> Dynamic features are disabled by default and can be manually enabled if desired.
> 
> **If you can fix it, fork it!** Contributions to improve the dynamic features are welcome.

A Visual Studio Code extension that makes text glow with the same color as the syntax highlighting, creating a beautiful neon effect in your editor.

## ✨ Features

- **Glowing Text**: Applies a customizable glow effect to text in the editor
- **Theme Compatible**: Preserves the original syntax highlighting colors from your theme
- **Error Highlighting**: Automatically disables glow effect on lines containing errors
- **Dynamic Intensity**: Makes the glow effect "breathe" by automatically varying the intensity over time
- **Configurable**: Adjust glow intensity to match your preferences
- **Language Control**: Enable or disable for specific programming languages
- **Performance Optimized**: Minimal impact on editor performance for most files


## 📋 Requirements

- Visual Studio Code v1.80.0 or higher

## 🔧 Installation

### VS Code Marketplace
#### First method 
1. Open **Extensions** sidebar panel in VS Code. (`Ctrl+Shift+X` or `Cmd+Shift+X`)
2. Search for `GlowRays`
3. Click **Install**
4. Reload VS Code
5. Enjoy the glow!

#### Second method
1. Visit [GlowRays on Marketplace](https://marketplace.visualstudio.com/items?itemName=imagineSamurai.glowrays).
2. Click **Install**.
3. Follow the installation instructions for VS Code.
4. Reload VS Code.
5. Enjoy the glow!

### Direct Download (VSIX)

1. Go to the [releases page](https://github.com/imagineSamurai/GlowRays/releases)
2. Download the latest `.vsix` file
3. In VS Code, go to Extensions view
4. Click on the "..." menu in the upper right
5. Select "Install from VSIX..."
6. Choose the downloaded file
7. Reload VS Code

### Manual Installation from Source

```bash
# Clone the repository
git clone https://github.com/imagineSamurai/GlowRays.git

# Navigate to the project directory
cd GlowRays

# Install dependencies
npm install


# Package the extension
npx vsce package

# Install the generated .vsix file in VS Code
code --install-extension glowrays-*.vsix
```

## ⚙️ Extension Settings

This extension contributes the following settings:

* `glowrays.enable`: Enable/disable the glow effect globally
* `glowrays.intensity`: Intensity of the glow effect (1-10)
* `glowrays.includeLanguages`: Languages to include for glow effect (e.g., `["javascript", "python"]`)
* `glowrays.excludeLanguages`: Languages to exclude from glow effect (e.g., `["markdown", "json"]`)
* `glowrays.disableOnErrors`: Enable/disable automatic disabling of glow effect on lines with errors (default: true)
* `glowrays.dynamic.config`: **(ALPHA)** Dynamic intensity configuration in format 'min max speed enabled' (e.g., '3 8 5 true'). **Disabled by default** - set the last parameter to 'true' to enable.
* `glowrays.pauseAnimationWhileTyping`: **(ALPHA)** Pause animation updates during typing to prevent flickering. Only relevant when dynamic features are enabled.
* `glowrays.GlowOnDefinitionNames`: Apply glow effect only to specific code elements like function names, class definitions, etc. **Disabled by default**.

## 🚀 Getting Started

After installation, the extension is enabled by default with medium intensity. You can customize the settings by:

1. Opening VS Code settings (`Ctrl+,` or `Cmd+,`)
2. Searching for "GlowRays"
3. Adjusting the settings to your preference

### Example JSON Settings

Add these to your `settings.json` file:

```json
{
    "glowrays.enable": true,
    "glowrays.intensity": 7,
    "glowrays.includeLanguages": ["javascript", "typescript", "python"],
    "glowrays.excludeLanguages": ["markdown", "plaintext"],
    "glowrays.disableOnErrors": true,
    "glowrays.dynamic.config": "3 8 5 false",
    "glowrays.pauseAnimationWhileTyping": false
}
```

If you want to enable the experimental dynamic features (may affect performance):

```json
{
    "glowrays.dynamic.config": "3 8 5 true",
    "glowrays.pauseAnimationWhileTyping": true
}
```

If you want to enable the focused definition glow feature:

```json
{
    "glowrays.GlowOnDefinitionNames": true
}
```

## 📸 Screenshots

[Quick comment]: <> (All the photos are in /assets. Images were not displaying in the marketplace. After several attempts, I found a solution: I uploaded the images to my website and linked them through the markdown file.)

### JavaScript with Glow Effect
<img src="https://hybridipa-blog.web.app/assets/images/GlowRays/javascript-example.png" width="700" alt="JavaScript Glow Effect">

### Python with Glow Effect
<img src="https://hybridipa-blog.web.app/assets/images/GlowRays/python-example.png" width="700" alt="Python Glow Effect">

### Different Intensity Levels
#### intensity = 1
<img src="https://hybridipa-blog.web.app/assets/images/GlowRays/1.png" width="700" alt="Intensity 1">

#### intensity = 10
<img src="https://hybridipa-blog.web.app/assets/images/GlowRays/10.png" width="700" alt="Intensity 10">

#### intensity = 20
<img src="https://hybridipa-blog.web.app/assets/images/GlowRays/20.png" width="700" alt="Intensity 20">

## 🔍 Troubleshooting

### Common Issues

- **Extension not working after installation**: Make sure to reload VS Code after installation
- **No glow effect visible**: Check if your theme has sufficient contrast for the glow to be visible
- **Performance issues with large files**: Try reducing the intensity level in settings
- **Flickering or flashing while typing**: Ensure that `glowrays.pauseAnimationWhileTyping` is set to `true` (the default). This will keep the glow static while you type, preventing any disruptions.

### Avoiding Editor Flashing/Flickering

If you experience any disruptions or flickering while typing:

1. Make sure `glowrays.pauseAnimationWhileTyping` is enabled (it is by default)
2. Use a moderate glow intensity (3-8 is recommended)
3. If using dynamic glow, use a narrower range in your `glowrays.dynamic.config` setting (e.g., "3 6 5 true")
4. Try disabling other extensions that modify text appearance to avoid conflicts

### Compatibility

GlowRays works with most popular VS Code themes. If you encounter issues with a specific theme, please report it in the [Issues](https://github.com/imagineSamurai/GlowRays/issues) section.

## ⚠️ Known Issues

- **Dynamic features limitations**: The dynamic intensity feature is still in alpha development and may cause performance issues, flickering, or editor lag on some systems.
- **Large files impact**: Performance may be impacted on large files, especially with dynamic features enabled.
- **Theme compatibility**: Some color themes may produce inconsistent glow effects.
- **Custom fonts**: Might not work properly with certain custom font settings.

**If you can fix it, fork it!** Pull requests to address these issues are greatly appreciated!

### Performance Recommendations

If you experience performance issues with dynamic features:

1. Keep `glowrays.dynamic.config` disabled by leaving the last parameter as "false"
2. Use a static intensity value instead (the default setting)
3. Consider disabling the extension for very large files

## 📝 Release Notes

### 1.2.0

- Added dynamic intensity feature (alpha) that makes the glow effect "breathe" by automatically varying intensity over time
- Added pause animation while typing feature (alpha) to reduce flickering during editing
- Added automatic error detection feature that disables glow on lines with errors
- Added configuration options for dynamic features
- Added GlowOnDefinitionNames feature to focus glow effect only on code definitions
- Performance improvements and bug fixes

### 1.0.0

Initial release of GlowRays Extension:
- Basic glow effect for text that preserves theme colors
- Configurable intensity
- Language filtering options

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/imagineSamurai/GlowRays.git

# Install dependencies
npm install

# Open in VS Code
code .

# Press F5 to start debugging
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

[imagineSamurai](https://github.com/imagineSamurai)

## 💖 Support

If you find this extension useful, please consider:

- ⭐ Star this repository on GitHub
- 🌟 Rate it on the VS Code Marketplace
- 📢 Share it with friends and colleagues
- 🐦 Follow us on X (Twitter): [@GlowRays_VSC](https://twitter.com/GlowRays_VSC)
- ☕ You can support me by using [Ko-fi](https://ko-fi.com/imaginesamurai)
