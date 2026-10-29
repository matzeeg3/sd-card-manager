<!-- SPDX-FileCopyrightText: 2026 Thomas Stoll
     SPDX-License-Identifier: Apache-2.0 -->

# SD Card Manager

**Use an SD card in an ESP32 project and manage its files in a browser,
without implementing the storage integration again.**

This package was created for [EBCTester](https://github.com/Gemelon/EBCTester).
Long battery tests should record measurements outside home Wi-Fi coverage.
They need local storage and an interface for accessing data and language files.

Card integration and file management are independent components so other
ESP-IDF projects can reuse them.

## Features

- FAT32 cards over **4-bit SDMMC or SPI**.
- Card detection, mount/unmount, and nonblocking retry.
- Local web file management: browse, upload, download, create, rename, move,
  and delete files or empty folders.
- Shared storage lock for clients such as SQLite and SD language providers.
- No automatic formatting or recursive deletion of populated folders.
- Missing cards do not prevent the rest of the application from starting.

## Architecture and dependencies

| Repository | Responsibility |
| --- | --- |
| [EBCTester](https://github.com/Gemelon/EBCTester) | Battery tests, database, and recording |
| [ota-suite](https://github.com/Gemelon/ota-suite) | Networking and shared authenticated web interface |
| **sd-card-manager** | Storage integration and web extension |

The package contains `components/sd_card_manager`. It needs OTA Suite's
`web_interface`, including the `I18n` runtime, but no EBCTester code.
Applications import both packages with `EXTRA_COMPONENT_DIRS`; EBCTester
pins them as submodules. Development content is always English; requested
UI translations are retained. See [AGENTS.md](AGENTS.md).

## Using and compiling

```powershell
git clone https://github.com/Gemelon/sd-card-manager.git
git clone https://github.com/Gemelon/ota-suite.git
```

Both repositories are public. Use an ESP-IDF application with VS Code and the
ESP-IDF extension. Tested with **ESP-IDF 6.0.1 / ESP32-S3**.
This package alone is not a flashable application.

1. Add both packages' `components` directories to `EXTRA_COMPONENT_DIRS`.
2. Require `sd_card_manager` and `device_app` from the application component.
3. Call `sd_card_manager_init()` before `device_app_start()`.
4. Configure the default bus mode, pins, clock, mount point, and card
   detection under **menuconfig -> SD Card Manager**.
5. Build the consuming application with **ESP-IDF: Build your project**.

The **SD card bus** card in the web interface settings switches between SPI
and 4-bit SDMMC at runtime. The selection is stored in NVS (namespace
`sd_card`) and applies after a restart; both pin sets are always compiled in.
Optionally register `sd_card_manager_set_busy_callback()` so that "Save and
restart" never restarts the device while the application is busy.

Initialization registers the SD tab and starts card polling. HTTP operations
use OTA Suite's login and CSRF protection. SD errors are reported; the
application can still start its web interface.

## Hardware defaults

| Signal | SDMMC GPIO |
| --- | ---: |
| CLK | 14 |
| CMD | 15 |
| D0 / D1 / D2 / D3 | 2 / 4 / 5 / 6 |
| Card detect | 7, active HIGH |

SPI defaults: MISO 2, MOSI 15, CS 6, CLK 14; card detect remains GPIO 7.
Both modes default to 10 MHz. Long wiring may need lower clocks. Use external
pull-ups; internal pull-ups do not replace correct hardware.

Detection polls every 250 ms; four consistent readings confirm insertion or
removal. Active-HIGH detection needs a stable 3.3 V level. Never drive ESP32
pins with 5 V. The UI displays the detection GPIO and its live level.

## Filesystem and storage access

Use FAT32. exFAT is disabled in the selected ESP-IDF FatFs configuration and
is unsupported. Format separately and back up important data first.
The default mount point is `/sdcard`.

Other components must pair `sd_card_manager_storage_acquire()` with
`sd_card_manager_storage_release()`. The lock protects against concurrent
file management or unmount during a guarded access. Acquire fails explicitly
when the card is unavailable. A database is not part of this package.

Failure to calculate free space does not mark the card unmounted. The UI
shows unknown capacity; uploads receive actual filesystem errors such as a
full card.

Nonempty folders cannot be deleted. Removal and power loss can still damage
data; locking does not replace backups. Use the local HTTP interface only
on a trusted network or protected AP, never on the public internet.

## Tests and contributions

Integration is tested by the consuming application; EBCTester has schema and
localized UI host tests. After changes, verify SDMMC, SPI, card detection,
file actions, full cards, and concurrent storage accesses on hardware.
This package has no independent host-test runner.

Reports with board, wiring, SDK version, and sanitized logs are welcome.
Do not commit credentials, measurements, local `sdkconfig`, or build outputs.
Include license documentation when distributing firmware.

## License and authorship

**Copyright 2026 Thomas Stoll.** Original source and documentation are licensed
under **[Apache-2.0](LICENSE)**. See [NOTICE](NOTICE). Commercial use, changes,
and sale are permitted under its terms, without warranty. Mark modified files
and preserve existing notices. Commentless formats are covered by
[.reuse/dep5](.reuse/dep5). Third-party code retains its own licenses.

## Third-party components and licenses

| Component | Author / origin | License and notices |
| --- | --- | --- |
| ESP-IDF 6.0.1 and SD drivers | Espressif Systems and contributors | Apache-2.0 for original Espressif code - [SDK license](third_party/licenses/esp-idf/LICENSE) |
| FatFs | ChaN | Custom permissive terms - [original notice](third_party/licenses/esp-idf/FatFs-NOTICE.txt) |
| cJSON | Dave Gamble and cJSON contributors | MIT - [original text](third_party/licenses/cjson/LICENSE) |
| FreeRTOS-Kernel | Amazon.com and contributors | MIT - [original text](third_party/licenses/esp-idf/FreeRTOS-LICENSE.md) |
| C runtime: Newlib / Picolibc | Multiple authors | Individual terms - [Newlib](third_party/licenses/esp-idf/COPYING.NEWLIB), [Picolibc](third_party/licenses/esp-idf/COPYING.picolibc) |
| GCC runtime | Free Software Foundation and contributors | GPL-3.0 with GCC Runtime Library Exception 3.1 - [GPL](third_party/licenses/toolchain/COPYING3), [exception](third_party/licenses/toolchain/COPYING.RUNTIME) |
| OTA Suite | Thomas Stoll | Apache-2.0; [repository and dependency list](https://github.com/Gemelon/ota-suite#third-party-components-and-licenses) |
| Bootstrap 5.3.3, through OTA Suite | The Bootstrap Authors | MIT; full text at `components/web_interface/assets/BOOTSTRAP-LICENSE` in OTA Suite |
| TLSF | Matthew Conte | BSD-3-Clause - [original notice](third_party/licenses/esp-idf/TLSF-NOTICE.txt) |
| Other SDK parts of the consuming application | Authors in original headers | [Reference-build notices](third_party/licenses/esp-idf/SOURCE-NOTICES.txt) and [standard texts](third_party/licenses/standard/); conservative scope, not all needed by SD |

OTA Suite documents the consuming application's networking, TLS, and web
dependencies. Its lockfile determines resolved versions. See
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and
[third_party/licenses/](third_party/licenses/) for original texts and provenance.
The project license does not replace upstream licenses; review notices when
adding components or changing SDK versions.
