# Pocket Scan

Scan barcodes with your phone or computer camera, collect them in one place, and download a JSON file to use with your own tools.

## How to use it

1. Open Pocket Scan in your browser and tap **Start camera**.
2. Allow camera access when your browser asks.
3. Hold the entire barcode inside the frame. Use good lighting and keep the camera steady.
4. Scan more barcodes to build your collection. Use the ↻ button to switch cameras or **Stop** to turn the camera off.
5. Tap **Download JSON** to save your collection. Use **Copy value** if you only need the latest barcode.

**Download before closing or reloading the page.** Your collection is kept only for the current visit. Downloading keeps the collection available so you can continue scanning. **Clear** starts a new collection and asks before removing your scans.

## Counting items

Each barcode and format has one record. Scanning it again increases its quantity. To count the same barcode again, move it out of view for at least three seconds, then scan it again. Keeping a barcode in view counts it only once.

The collection shows the 30 most recently scanned unique barcodes. The downloaded file includes every collected record.

## Your downloaded file

The JSON file contains a batch ID, export time, totals, and a list of barcode records:

```json
{
  "schema_version": "1.0",
  "batch_id": "8a081774-80c7-45bf-921e-72b72cb850bd",
  "exported_at": "2026-11-03T20:10:00.000Z",
  "total_scans": 2,
  "unique_barcodes": 1,
  "items": [
    {
      "id": "341555df-0344-4cce-a9ca-dfe0f32992e2",
      "barcode": "0012345678905",
      "format": "ean_13",
      "quantity": 2,
      "first_scanned_at": "2026-11-03T20:00:00.000Z",
      "last_scanned_at": "2026-11-03T20:05:00.000Z"
    }
  ]
}
```

Barcode values are text, preserving leading zeros. Times use UTC. Record IDs stay the same within the collection; each downloaded snapshot includes its own export time. Clearing the collection creates a new batch ID.

This structure can be mapped into a CRM, inventory system, or database. No integration is connected yet. A barcode is an identifier: Pocket Scan does not automatically look up product names, prices, or other product details. Future importers should validate the file, treat barcode values as untrusted text, and use the batch and record IDs to avoid importing the same snapshot twice. Quantities are cumulative within a batch, so importing a later snapshot should update existing records rather than add the quantities again.

## Privacy

- Camera frames and barcode results are processed on your device. The app does not upload them.
- The camera starts after you tap **Start camera** and grant permission. It stops when you stop scanning or leave the tab.
- There are no analytics, external fonts, or remotely loaded scanning scripts.
- A downloaded file may contain sensitive barcode values. Share it only with people and tools you trust.

The website host receives normal website requests, but this app does not include scan values in those requests. A public copy of this static site does not provide visitors access to the developer's computer.

## Having trouble?

Allow camera access in your browser settings, close other apps using the camera, and try again. The camera needs a secure HTTPS website or localhost. Scan quality and supported formats vary by device; common formats include UPC, EAN, Code 128, and QR codes.

## About

Pocket Scan uses the browser's BarcodeDetector when available, with bundled ZXing 0.21.3 as a fallback. ZXing is licensed under Apache-2.0; see [its license](dist/vendor/ZXING-LICENSE).
