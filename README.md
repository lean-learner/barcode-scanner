# Pocket Scan

A mobile-friendly camera barcode scanner with copy, camera switching, and session-only scan history.

## Run locally

```sh
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```

Open http://localhost:8080. Phone camera access requires an HTTPS host such as GitHub Pages.

## Publish with GitHub Pages

In the repository Settings → Pages, select **GitHub Actions** as the source. Run the **Deploy GitHub Pages** workflow manually from Actions when ready to publish. It publishes only `dist/`.

Repository privacy and website access are separate. Standard GitHub Pages sites are publicly accessible; private repository Pages availability depends on your GitHub plan. Review these settings before publishing.

## Privacy and dependencies

Camera images are processed on the visitor's device. The app does not upload camera images or barcode results. Scan history is kept in page memory and clears on reload. No remote scripts, fonts, analytics, or product lookups are loaded. A content security policy limits resources to the same origin and disables outgoing application connections.

Uses native BarcodeDetector when available, otherwise bundled ZXing 0.21.3 (Apache-2.0; license in `dist/vendor/ZXING-LICENSE`). Browser camera permission is requested after Start camera. The camera stops when the page is hidden.

## Validation

JavaScript syntax and result/history behavior checked. Physical-device camera and browser compatibility testing remain necessary.
