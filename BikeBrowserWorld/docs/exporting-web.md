# Exporting Web

Use the `Web Single Threaded` export preset.

Target:

```text
BikeBrowserWorld/exports/web/index.html
```

For React embedding, generated files should be copied or exported to:

```text
public/godot/BikeBrowserWorld/
```

The React prototype route expects:

```text
/godot/BikeBrowserWorld/index.html
```

Use a local server such as Vite. Do not test Web export through `file://`.

The first preset is intentionally single-threaded to avoid requiring SharedArrayBuffer and cross-origin isolation during the earliest iframe test.
