# AI Product Image Studio API Documentation

This document describes the Google Gemini generative AI image generation, multi-aspect ratio background transformation, e-commerce prompt enhancement, and multimodal product image analysis endpoints.

## Base URL

```text
https://server.decantrebd.com/api/v1
```

## Base Path

`/api/v1/studio`

## Notes

- All Studio processing endpoints require authentication (`Authorization: Bearer <accessToken>`).
- Supports up to 60MB JSON body payloads for high-resolution Base64 image uploads.

---

## 1. Studio Health Check

Checks if the server is equipped with a valid `GEMINI_API_KEY` and lists available image generation & vision models.

- **Method:** `GET`
- **URL:** `/api/v1/studio/health`
- **Authentication:** Not required

### Success Response (200 OK):
```json
{
  "status": "ok",
  "hasKey": true,
  "models": [
    { "id": "gemini-3.1-flash-lite-image", "name": "Gemini 3.1 Flash Lite Image", "default": true },
    { "id": "gemini-3.1-flash-image", "name": "Gemini 3.1 Flash Image (High Res / 2K)", "default": false },
    { "id": "gemini-3.7-flash", "name": "Gemini 3.7 Flash (Prompt & Vision Analysis)" }
  ]
}
```

---

## 2. Transform Product Image Background

Seamlessly places and composites the provided product image into a newly generated realistic commercial environment while maintaining original product fidelity and labels.

- **Method:** `POST`
- **URL:** `/api/v1/studio/transform`
- **Authentication:** Required

### Request Body:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg",
  "prompt": "Placed on an Italian travertine stone podium surrounded by gentle water ripples and morning sunlight",
  "aspectRatio": "1:1",
  "imageSize": "1K",
  "model": "gemini-3.1-flash-lite-image"
}
```

### Supported Parameters:
- `aspectRatio`: `"1:1"`, `"3:4"`, `"4:3"`, `"9:16"`, `"16:9"`, `"1:4"`, `"1:8"`, `"4:1"`, `"8:1"` (Default: `"1:1"`)
- `model`: `"gemini-3.1-flash-lite-image"`, `"gemini-3.1-flash-image"`
- `imageSize`: `"1K"`, `"2K"` (when using high-res model)

### Success Response (200 OK):
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "elapsedMs": 3412,
  "model": "gemini-3.1-flash-lite-image",
  "aspectRatio": "1:1"
}
```

---

## 3. Generate Bulk Product Images from Text Prompt

Generates commercial product photography from scratch based on high-impact prompt descriptions.

- **Method:** `POST`
- **URL:** `/api/v1/studio/generate-bulk`
- **Authentication:** Required

### Request Body:
```json
{
  "prompt": "Luxury amber glass perfume bottle with gold cap on dark marble surface with soft rim lighting",
  "aspectRatio": "1:1",
  "model": "gemini-3.1-flash-lite-image"
}
```

### Success Response (200 OK):
```json
{
  "success": true,
  "imageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "elapsedMs": 2890
}
```

---

## 4. Smart Prompt Enhancer

Expands a raw idea or minimal description into a professional, photorealistic commercial product photoshoot prompt using Gemini 3.7 Flash.

- **Method:** `POST`
- **URL:** `/api/v1/studio/enhance-prompt`
- **Authentication:** Required

### Request Body:
```json
{
  "basePrompt": "Wooden table with flowers",
  "styleCategory": "studio",
  "platform": "ecommerce"
}
```

### Success Response (200 OK):
```json
{
  "enhancedPrompt": "Polished rustic oak table bathed in warm diffused softbox light, delicate white jasmine blossoms framing clean negative space, sharp depth of field for luxury e-commerce showcase."
}
```

---

## 5. Multimodal Product Vision Analysis

Analyzes product photography using Gemini 3.7 Flash and extracts product category suggestions, dominant color palettes, and custom recommended background scenes.

- **Method:** `POST`
- **URL:** `/api/v1/studio/analyze-product`
- **Authentication:** Required

### Request Body:
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "mimeType": "image/jpeg"
}
```

### Success Response (200 OK):
```json
{
  "productName": "Amber Glass Fragrance Decant",
  "category": "Cosmetics & Fragrance",
  "dominantColors": ["#2D1E18", "#D4AF37", "#FFFFFF"],
  "recommendedScenes": [
    {
      "title": "Minimal Travertine Pedestal",
      "prompt": "Resting on a rough-edged travertine stone podium with golden hour sunlight and warm shadows"
    },
    {
      "title": "Dark Velvet Studio",
      "prompt": "On rich black velvet drapery with dramatic top-down rim lighting and subtle crystal reflections"
    }
  ],
  "compositionAdvice": "Recommended 1:1 square crop for hero catalog display and high conversion."
}
```
