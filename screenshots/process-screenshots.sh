#!/bin/bash
#
# Process screenshots for Chrome Web Store
# Resizes images to 1280x800 (required by Chrome Web Store)
#
# Usage:
#   ./process-screenshots.sh                    # Process all PNGs in raw/
#   ./process-screenshots.sh screenshot1.png    # Process specific file
#

RAW_DIR="$(dirname "$0")/raw"
STORE_DIR="$(dirname "$0")/store"

# Ensure directories exist
mkdir -p "$RAW_DIR" "$STORE_DIR"

# Check if sips is available (macOS)
if ! command -v sips &> /dev/null; then
    echo "Error: sips command not found. This script requires macOS."
    exit 1
fi

process_image() {
    local input="$1"
    local filename=$(basename "$input")
    local output="$STORE_DIR/$filename"
    
    echo "Processing: $filename"
    
    # Get current dimensions
    local width=$(sips -g pixelWidth "$input" | tail -n1 | awk '{print $2}')
    local height=$(sips -g pixelHeight "$input" | tail -n1 | awk '{print $2}')
    
    echo "  Original: ${width}x${height}"
    
    # Resize to 1280x800
    sips -z 800 1280 "$input" --out "$output" > /dev/null 2>&1
    
    # Verify output
    local new_width=$(sips -g pixelWidth "$output" | tail -n1 | awk '{print $2}')
    local new_height=$(sips -g pixelHeight "$output" | tail -n1 | awk '{print $2}')
    
    echo "  Resized:  ${new_width}x${new_height} → $output"
    echo ""
}

# Main logic
if [ $# -eq 0 ]; then
    # Process all PNGs in raw directory
    count=0
    for file in "$RAW_DIR"/*.png "$RAW_DIR"/*.PNG; do
        if [ -f "$file" ]; then
            process_image "$file"
            ((count++))
        fi
    done
    
    if [ $count -eq 0 ]; then
        echo "No PNG files found in $RAW_DIR"
        echo ""
        echo "Copy your screenshots to: $RAW_DIR"
        echo "Then run this script again."
        exit 1
    fi
    
    echo "✅ Processed $count screenshots"
    echo "📁 Output: $STORE_DIR/"
else
    # Process specific files
    for file in "$@"; do
        if [ -f "$file" ]; then
            process_image "$file"
        elif [ -f "$RAW_DIR/$file" ]; then
            process_image "$RAW_DIR/$file"
        else
            echo "File not found: $file"
        fi
    done
fi

echo ""
echo "Next steps:"
echo "  1. Review screenshots in screenshots/store/"
echo "  2. Upload to Chrome Web Store Developer Dashboard"

