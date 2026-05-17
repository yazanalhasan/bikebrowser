# Web Export Target

Godot Web exports should be generated here from `BikeBrowserWorld/export_presets.cfg`.

Initial preset:

- name: `Web Single Threaded`
- export path: `exports/web/index.html`
- intent: iframe-compatible React embedding
- save key: `bikebrowser_godot_test_save`

After export, copy or serve the generated files under the React public path expected by `/godot-prototype`:

```text
public/godot/BikeBrowserWorld/index.html
```
