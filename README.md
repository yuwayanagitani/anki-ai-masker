# Image Masker (Image-Occlusion Style Editor)

Create image-occlusion style flashcards in Anki with a lightweight editor workflow. Optionally, you can enable AI-assisted mask suggestions and metadata generation.

## Features
- Draw masks (occlusions) on images to create image-occlusion style cards.
- Lightweight editor integrated with Anki.
- Optional AI-assisted mask suggestion (requires API key) and auto metadata generation.
- Supports saving masks, exporting masked images, and creating notes/cards from masked images.

## Requirements
- Anki 2.1+
- For AI features: an API key for the supported provider (OpenAI/Gemini) or other configured model.
- Typical Python imaging libraries available in Anki’s environment (add-on bundles where necessary).

## Installation
1. Clone or download the repository.
2. Open Anki → Tools → Add-ons → Open Add-ons Folder.
3. Place the add-on folder in the add-ons directory.
4. Restart Anki.

## Usage
- In Anki, open the add-on from the Tools menu or the Browser to launch the Image Masker editor.
- Load an image from collection.media or your local files.
- Draw masks (boxes or shapes) over regions you want to hide.
- Save the masked image and create cards/notes using the add-on's create/export functions.

## AI Features (Optional)
- Enable AI mask suggestions in settings and provide an API key.
- The AI can suggest likely occlusion regions and generate descriptive metadata.
- Be aware of data privacy and API usage/costs when enabling cloud AI features.

## Configuration
- Settings include default mask shape/size, save-location, auto-naming, and AI provider/config options.
- If the add-on provides a `config.json`, edit it to change defaults.

## Troubleshooting
- If images fail to load, confirm path and presence in collection.media.
- If AI features fail, check API key and network connectivity.

## Development
- The add-on contains both Python and front-end (JS/CSS/HTML) code — see the repo for structure.
- Contributions and issues are welcome.

## License
MIT License — see LICENSE file.

## Contact
Author: yuwayanagitani
