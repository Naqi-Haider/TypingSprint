# Custom Fonts Guide for Typing Sprint

## How to Add Custom Fonts

There are three main ways to add custom fonts to your Typing Sprint game:

### Method 1: Google Fonts (Easiest)

1. **Browse Google Fonts**: Go to [fonts.google.com](https://fonts.google.com)
2. **Select a Font**: Choose your desired font
3. **Get the Import Link**: Click "Get font" → "Get embed code"
4. **Add to `index.css`**: Add the import at the top of your CSS file

**Example:**
```css
/* At the top of src/index.css */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --font-primary: 'JetBrains Mono', monospace;
  /* ... rest of your variables */
}
```

### Method 2: Local Font Files (Best Performance)

1. **Get Font Files**: Download `.woff2` or `.ttf` font files
2. **Create Fonts Folder**: Create `src/assets/fonts/` directory
3. **Add Font Files**: Place your font files in this folder
4. **Declare Fonts in CSS**:

```css
/* In src/index.css */
@font-face {
  font-family: 'MyCustomFont';
  src: url('./assets/fonts/MyCustomFont-Regular.woff2') format('woff2'),
       url('./assets/fonts/MyCustomFont-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'MyCustomFont';
  src: url('./assets/fonts/MyCustomFont-Bold.woff2') format('woff2'),
       url('./assets/fonts/MyCustomFont-Bold.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-primary: 'MyCustomFont', monospace;
}
```

### Method 3: CDN Fonts (Alternative)

Use a font CDN like cdnfonts.com or fontsource:

```css
/* At the top of src/index.css */
@import url('https://fonts.cdnfonts.com/css/your-font-name');

:root {
  --font-primary: 'Your Font Name', monospace;
}
```

## Recommended Fonts for Typing Games

### Monospace Fonts (Best for Typing):
- **JetBrains Mono** - Modern, clear, excellent for code
- **Fira Code** - Popular developer font with ligatures
- **Source Code Pro** - Clean and professional
- **IBM Plex Mono** - Geometric and modern
- **Space Mono** - Retro-futuristic style
- **Roboto Mono** - Google's monospace font

### Display Fonts (For Titles):
- **Orbitron** (currently used) - Futuristic
- **Rajdhani** - Modern and bold
- **Exo 2** - Tech-inspired
- **Audiowide** - Retro gaming style

## Current Font Setup

Your game currently uses:
- **Primary Font** (typing): `Consolas` (system font) with fallback to `Courier New`
- **Display Font** (titles): `Orbitron` (Google Font)

## Example: Changing to JetBrains Mono

To change the typing font to JetBrains Mono:

1. Open `src/index.css`
2. Update the import at the top:
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
```

3. Update the CSS variable:
```css
:root {
  --font-primary: 'JetBrains Mono', 'Consolas', monospace;
  /* ... */
}
```

## Performance Tips

1. **Limit Font Weights**: Only import the weights you need (400, 600, 700)
2. **Use `font-display: swap`**: Prevents invisible text while loading
3. **Prefer WOFF2**: Modern format with best compression
4. **Subset Fonts**: Only include characters you need (for local fonts)
5. **Preload Critical Fonts**: Add to `index.html`:
```html
<link rel="preload" href="/fonts/MyFont.woff2" as="font" type="font/woff2" crossorigin>
```

## Testing Your Fonts

After changing fonts:
1. Clear browser cache (Ctrl+Shift+R)
2. Check that text renders correctly
3. Test on different screen sizes
4. Verify readability during fast typing

## Troubleshooting

**Font not loading?**
- Check the import URL is correct
- Verify font name matches exactly (case-sensitive)
- Check browser console for errors
- Try clearing cache

**Font looks wrong?**
- Check font-weight values match what you imported
- Verify fallback fonts are appropriate
- Test in different browsers
