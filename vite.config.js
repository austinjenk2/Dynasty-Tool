import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Binds to 0.0.0.0 instead of just localhost, so `npm run dev` prints a
    // Network URL (e.g. http://192.168.x.x:5173) reachable from other
    // devices on the same Wi-Fi -- no need to push/redeploy to preview a
    // change, just save the file and the page reloads.
    host: true,
  },
});
