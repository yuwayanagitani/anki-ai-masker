# Anki AI Masker (Image Occlusion Helper)

AnkiWeb: https://ankiweb.net/shared/by-author/2117859718

Create image-occlusion style flashcards in Anki with a lightweight editor workflow. Optionally, enable AI-assisted mask suggestions and metadata generation.

## Features
- Lightweight image-occlusion editor
- Manual mask creation and auto-suggested masks using AI
- Export masks to your preferred occlusion workflow
- Optional metadata generation (captions, tags)

## Requirements
- For AI features: API key for OpenAI/Gemini or supported provider
- Anki with support for add-ons and images

## Installation
1. Tools → Add-ons → Open Add-ons Folder.
2. Drop the add-on folder into `addons21/`.
3. Restart Anki.

## Usage
- Tools → AI Masker → Open editor.
- Load image from `collection.media` and create masks manually or request AI suggestions.

## Configuration
`config.json`:
- enable_ai_suggestions (true/false)
- provider, api_key, model
- default mask color/shape

Example:
```json
{
  "enable_ai": true,
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

## Privacy & Safety
Images sent to AI providers may contain sensitive information. Enable AI only if you accept provider policies.

## Issues & Support
Include image examples and the expected masks when filing issues.

## License
See LICENSE.
