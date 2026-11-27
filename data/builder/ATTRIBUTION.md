# Bike Builder attributions

Phase 1 ships facts with citations, CC BY 4.0 rows, and MIT measurements. It does not ship Bike Book (CC BY-SA), Bike Index ODbL data, Reference Source records, BikePartPicker data, scraped geometry, or manufacturer PDFs.

## Pedal Brief, CC BY 4.0

Road and gravel groupset speeds, chainring sizes, and cassette ranges used on some seed parts.

Pedal Brief (pedalbrief.com), “Road and gravel groupsets 2026, as Shimano, SRAM and Campagnolo state them”, https://pedalbrief.com/data/road-gravel-groupsets-2026, CC BY 4.0. Sources checked 20 Oct 2026.

Changes: rows were turned into individual parts. Tooth counts and speed counts were kept. Model codes that the row did not state were left blank or marked draft. No prices were present in the source.

License: https://creativecommons.org/licenses/by/4.0/

## boothinator/derailleur-analysis, MIT

Pull-ratio figures in `src/builder/standards.js` are measurements from https://github.com/boothinator/derailleur-analysis

Copyright (c) 2024 Joshua Booth

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## isaacrowntree/bike-part-planner, MIT

The native / needs-adapter / incompatible adapter model, and the idea that a verdict is block, warn, or pass, follows https://github.com/isaacrowntree/bike-part-planner

The BikeBrowser engine is original code, not a verbatim copy. The MIT notice is included because the pattern is used.

Copyright (c) 2026 Isaac Rowntree

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## E-bike fitment

Mid-drive shell and voltage notes (BBS02 68/73 mm BSA, separate 36 V and 48 V models, BBSHD 100 mm, UART versus CAN) are draft and cited to Bafang's site: https://www.bafang-e.com/

They are not copied from a manual PDF. A blank voltage, current, or shell does not pass.

## Manufacturer facts

Shimano freehub bodies and spacer notes: https://productinfo.shimano.com/en/compatibility/C-731

Shimano compatibility charts (cited, not re-hosted): https://productinfo.shimano.com/pdfs/product/archive/2025-2026_Compatibility_v037_en.pdf

RD-M3100-SGS and RD-M370-SGS numbers were copied from the product specification tables on bike.shimano.com on 2026-11-27.

SRAM XD/XDR, AXS, hydraulic brakes, capacity, and Full Mount / UDH pages are cited on the rules and the parts that use them.

## Not bundled

Reference Source (https://referencesource.org/bike-drivetrain-groupset-compatibility/) was used only as a reminder of which questions to ask. None of its records are copied into this repo.
