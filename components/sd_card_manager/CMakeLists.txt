# SPDX-FileCopyrightText: 2026 Thomas Stoll
# SPDX-License-Identifier: Apache-2.0

idf_component_register(
    SRCS "sd_card_manager.c"
    INCLUDE_DIRS "include"
    REQUIRES fatfs sdmmc esp_driver_gpio esp_driver_sdmmc esp_driver_sdspi esp_driver_spi esp_http_server nvs_flash espressif__cjson web_interface
    EMBED_FILES "assets/sd_card.html" "assets/sd_card.js"
                "assets/sd_settings.html" "assets/sd_settings.js"
)
