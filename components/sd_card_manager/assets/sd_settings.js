// SPDX-FileCopyrightText: 2026 Thomas Stoll
// SPDX-License-Identifier: Apache-2.0

"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const names = { spi: I18n.t("text.60c5158ae188"), sdmmc: I18n.t("text.58640216ee4e") };

  function showMessage(text, kind = "info") {
    const box = $("sd-settings-message");
    if (!box) return;
    box.className = `alert alert-${kind}${text ? "" : " d-none"}`;
    box.textContent = text;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    const text = await response.text();
    if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
    return JSON.parse(text);
  }

  async function refresh() {
    if (!$("sd-settings-form")) return;
    try {
      const status = await fetchJson("/api/sd/status");
      const active = names[status.busMode] || status.busMode;
      $("sd-settings-active").textContent = status.restartRequired ?
        I18n.f("text.d9641c4d3d03", {p0: active, p1: names[status.configuredBusMode]}) : active;
      $("sd-settings-mode").value = status.configuredBusMode;
    } catch (error) {
      showMessage(I18n.message(error.message), "danger");
    }
  }

  async function save(restart) {
    showMessage("");
    for (const id of ["sd-settings-save", "sd-settings-restart"]) $(id).disabled = true;
    let restarting = false;
    try {
      const csrfToken = (await fetchJson("/api/status")).csrfToken || "";
      const response = await fetch("/api/sd/bus", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
        body: JSON.stringify({ mode: $("sd-settings-mode").value, restart }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
      restarting = response.status === 202;
      showMessage(restarting ? I18n.f("text.a43ead60b01b", {p0: I18n.message(text)}) :
        I18n.message(text), "success");
    } catch (error) {
      showMessage(I18n.message(error.message), "danger");
    } finally {
      if (!restarting) {
        await refresh();
        for (const id of ["sd-settings-save", "sd-settings-restart"]) $(id).disabled = false;
      }
    }
  }

  $("sd-settings-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void save(false);
  });
  $("sd-settings-restart").addEventListener("click", () => {
    if (confirm(I18n.t("text.1dcfe6182404"))) void save(true);
  });
  void refresh();
})();
