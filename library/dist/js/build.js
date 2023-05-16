// build.js
const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["./all.js"],
    outfile: "./all-compiled.js",
    bundle: true,
    minify: true,
    target: ["safari11"],
  })
  .catch(() => process.exit(1));
