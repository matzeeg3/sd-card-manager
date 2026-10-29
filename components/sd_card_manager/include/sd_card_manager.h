/* SPDX-FileCopyrightText: 2026 Thomas Stoll
 * SPDX-License-Identifier: Apache-2.0
 */

#pragma once

#include <stdbool.h>
#include <stdint.h>
#include "esp_err.h"
#include "freertos/FreeRTOS.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    bool mounted;
    bool free_space_known;
    uint64_t total_bytes;
    uint64_t free_bytes;
    char message[128];
} sd_card_manager_status_t;

/* Registers the authenticated UI extension and starts/retries non-destructive mounts. */
esp_err_t sd_card_manager_init(void);
void sd_card_manager_get_status(sd_card_manager_status_t *status);
/* Optional. When the callback returns true, a bus mode change from the web interface is saved
 * but the device is not restarted. Call before the web server starts; the callback must not block. */
void sd_card_manager_set_busy_callback(bool (*callback)(void));
/* Acquires the shared card lock only while the SD card is mounted. */
esp_err_t sd_card_manager_storage_acquire(TickType_t timeout_ticks);
void sd_card_manager_storage_release(void);

#ifdef __cplusplus
}
#endif
