# Screenshots for Chrome Web Store

## Folder Structure

```
screenshots/
├── raw/           # Original high-res screenshots (gitignored)
├── store/         # Processed 1280x800 versions (committed)
├── process-screenshots.sh   # Processing script
└── README.md
```

## Usage

### 1. Add your raw screenshots

Copy your original screenshots to the `raw/` folder:

```bash
cp ~/Documents/*.png screenshots/raw/
```

### 2. Process them

Run the processing script:

```bash
cd screenshots
./process-screenshots.sh
```

This will resize all PNGs in `raw/` to 1280x800 and save them to `store/`.

### 3. Review and upload

Check the processed images in `store/`, then upload them to the Chrome Web Store Developer Dashboard.

## Chrome Web Store Requirements

- **Size:** 1280x800 or 640x400 pixels
- **Format:** PNG or JPEG
- **Quantity:** 1-5 screenshots
- **Content:** Should show the extension in action

## Tips

- Use a clean browser profile for screenshots
- Show different features in each screenshot
- Include the sidepanel in at least one shot
- Position the lens using rule of thirds

