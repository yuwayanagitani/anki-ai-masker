# Image Masker – Configuration Guide

This add-on uses a **nested configuration structure**.
Settings are edited through Anki’s add-on config editor.

Internally, the add-on merges your settings with defaults and caches the result
for performance. The cache is safely invalidated when the config is saved.

---

## 01_general – General settings

- enabled  
  Enable or disable Image Masker globally.

- note_type_name  
  Name of the note type used by Image Masker  
  Default: `Image Masker`

- always_update_note_type_templates  
  If enabled, card templates and CSS are updated on every Anki startup.  
  Recommended: keep **false** after initial setup.

- auto_open_browser_after_create  
  Reserved option (currently not implemented).

---

## 02_editor – Editor integration

- add_editor_button  
  Adds an Image Masker button to the Anki editor toolbar.

- editor_button_label  
  Text or emoji displayed on the editor button.

- editor_button_tooltip  
  Tooltip shown when hovering over the button.

---

## 03_masks – Mask appearance

- default_fill_front  
  Fill color for the active (question) mask.

- default_fill_other  
  Fill color for inactive masks.

- default_stroke  
  Border color of masks.

- outline_width_px  
  Width of the mask border (in pixels).

---

## 04_ai – AI features (optional)

AI features are fully optional and disabled by default.

### Common options

- enable_ai  
  Enables AI-based mask suggestions.

- enable_metadata_ai  
  Enables AI-based title and explanation generation.

- provider  
  AI provider to use.  
  Allowed values: `openai`, `gemini`

- max_suggestions  
  Maximum number of AI-generated masks per image.

---

### OpenAI settings

- api_key_env  
  Name of the environment variable containing your OpenAI API key.

- base_url  
  OpenAI Responses API endpoint.

- model  
  Model used for both mask suggestions and metadata generation.

- max_output_tokens  
  Maximum number of tokens generated per request.

- timeout_sec  
  Network timeout (seconds).

---

### Gemini settings

- api_key_env  
  Name of the environment variable containing your Gemini API key.

- endpoint  
  Gemini API endpoint (model name is injected automatically).

- model  
  Gemini model name.

- max_output_tokens  
  Maximum number of tokens generated per request.

- timeout_sec  
  Network timeout (seconds).

---

## 05_image_processing – Image scaling and compression

Images are **never modified on disk**.
Scaling and compression are applied only when images are displayed
or sent to AI services.

---

### display – Image shown in the editor

- max_side_px  
  Maximum width or height of the image displayed in the editor.

- jpeg_quality  
  JPEG quality used when the image has no alpha channel.

---

### ai_suggest – Images sent for AI mask suggestions

- max_side_px  
  Maximum width or height of images sent to the AI for mask detection.

- jpeg_quality  
  JPEG quality for AI mask suggestion images.

---

### ai_metadata – Images sent for AI metadata generation

- max_side_px  
  Maximum width or height of images sent for title/explanation generation.

- jpeg_quality  
  JPEG quality for AI metadata images.

---

## Notes

- Flat (non-nested) config keys are **not supported**.
- Changes take effect immediately after saving the config.
- API keys must be set as **environment variables**; they are never stored in
  the config file.
