import { test } from '@playwright/test';

// Mirrors .maestro/flows/09-scan-barcode.yaml
//
// Intentionally skipped on web: this flow depends on the device camera and the
// native photo-library picker (Maestro injects an image into the simulator gallery
// via `addMedia`). Neither is available to a headless browser, so barcode
// scanning is only exercised by the native Maestro suite. The rest of the
// add-card path (shop select → manual number entry → save) is covered by
// 02-add-card.spec.ts.
test.skip('scan barcode from gallery (native-only, see Maestro flow 09)', async () => {
  // no-op
});
