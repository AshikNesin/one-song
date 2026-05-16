# website
- For the marketing website under website/: use plain HTML, CSS, and JavaScript — no React or other frameworks. Confidence: 0.65
- Keep all assets (logos, screenshots, images) inside website/assets/ so the website directory is fully self-contained with no external file references. Confidence: 0.70
- Use a dark theme with violet/purple accent (#6c5ce7), near-black background (#0d0d0d), dark cards (#1a1a1a), and no gradients — not the warm amber Pocket variant. Confidence: 0.75
- For Netlify hosting, use a netlify.toml with [[redirects]] to serve clean extensionless URLs (e.g., /privacy → /privacy.html with status 200). Confidence: 0.60
- For Netlify hosting, also redirect *.html URLs to their clean extensionless version using a 301 redirect (from = "/*.html", to = "/:splat", status = 301) so users never see .html in the address bar. Confidence: 0.65
- Preserve original SVG logo colors as-is; do not apply theme accent colors to logo SVGs. Confidence: 0.70
- For architecture/documentation pages, keep the tabbed navigation UI (tab bar switching between sections) rather than a single flat scrolling layout. Confidence: 0.65
- When privacy policy text conflicts with analytics usage on website pages, resolve by updating the policy text to disclose analytics rather than removing the analytics script. Confidence: 0.65
