// NAME: osu Lookup
// AUTHOR: SpeezyBeez
// DESCRIPTION: Opens osu! beatmap search from the song context menu.
/// <reference path="../globals.d.ts" />

(function osuLookup() {
    if (
        !Spicetify.ContextMenu ||
        !Spicetify.URI ||
        !Spicetify.Menu ||
        !Spicetify.PopupModal ||
        !Spicetify.GraphQL ||
        !Spicetify.React ||
        !Spicetify.ReactDOM
    ) {
        setTimeout(osuLookup, 300);
        return;
    }

    // ─── Config Helpers ───────────────────────────────────────────────────────

    const STORAGE_KEY = "osuLookup_settings";

    const DEFAULTS = {
        mode: "",           // blank = let osu! decide
        status: "",         // blank = osu! default (has leaderboard)
        nsfw: true,         // true = show explicit content (no nsfw=false appended)
        general: {
            recommended: false,
            converts: false,
            follows: false,
            spotlights: false,
            featured_artists: false,
        },
    };

    function loadSettings() {
        try {
            const raw = Spicetify.LocalStorage.get(STORAGE_KEY);
            return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
        } catch {
            return { ...DEFAULTS };
        }
    }

    function saveSettings(cfg) {
        Spicetify.LocalStorage.set(STORAGE_KEY, JSON.stringify(cfg));
    }

    let settings = loadSettings();

    // ─── URL Builder ──────────────────────────────────────────────────────────

    function buildOsuUrl(artist, track) {
        const params = new URLSearchParams();

        params.set("q", `${artist} ${track}`);

        if (settings.mode !== "") {
            params.set("m", settings.mode);
        }

        if (settings.status !== "") {
            params.set("s", settings.status);
        }

        if (!settings.nsfw) {
            params.set("nsfw", "false");
        }

        const generalFlags = Object.entries(settings.general)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);

        if (generalFlags.length > 0) {
            params.set("c", generalFlags.join("."));
        }

        return `https://osu.ppy.sh/beatmapsets?${params.toString()}`;
    }

    // ─── GraphQL Track Fetchers ───────────────────────────────────────────────
    // Uses Spicetify.GraphQL instead of the REST Web API, which Spotify has
    // restricted. This mirrors the approach used by the copy-text extension.

    async function fetchTrackName(uri) {
        const { getTrackName } = Spicetify.GraphQL.Definitions;
        const { data } = await Spicetify.GraphQL.Request(getTrackName, {
            uri,
            offset: 0,
            limit: 10,
        });
        return data.trackUnion.name;
    }

    async function fetchFirstArtist(uri) {
        const { queryTrackArtists } = Spicetify.GraphQL.Definitions;
        const { data } = await Spicetify.GraphQL.Request(queryTrackArtists, {
            uri,
            trackUri: uri,  // both keys needed for backward compat per copy-text source
            offset: 0,
            limit: 10,
        });
        return data.trackUnion.artists.items[0].profile.name;
    }

    // ─── Context Menu ─────────────────────────────────────────────────────────

    async function onClick(uris) {
        const trackUri = uris[0];

        try {
            const [track, artist] = await Promise.all([
                fetchTrackName(trackUri),
                fetchFirstArtist(trackUri),
            ]);
            const url = buildOsuUrl(artist, track);
            window.open(url, "_blank");
        } catch (e) {
            Spicetify.showNotification("osu! Lookup: Failed to fetch track info.", true);
            console.error("[osu! Lookup]", e);
        }
    }

    function shouldAdd(uris) {
        if (uris.length !== 1) return false;
        return Spicetify.URI.isTrack(uris[0]);
    }

    const contextMenuItem = new Spicetify.ContextMenu.Item(
        "Search on osu!",
        onClick,
        shouldAdd,
        "search"
    );
    contextMenuItem.register();

    // ─── Settings UI ──────────────────────────────────────────────────────────

    function buildSettingsContent() {
        const content = document.createElement("div");

        // ── Styles ──
        const style = document.createElement("style");
        style.innerHTML = `
            .osu-settings {
                padding: 8px 4px;
                color: var(--spice-text);
                font-size: 14px;
            }
            .osu-settings h2 {
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                color: var(--spice-subtext);
                margin: 18px 0 10px;
            }
            .osu-settings h2:first-child {
                margin-top: 4px;
            }
            .osu-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 0;
            }
            .osu-setting-row label {
                flex: 1;
                padding-right: 12px;
            }
            .osu-setting-row .osu-desc {
                font-size: 12px;
                color: var(--spice-subtext);
                margin-top: 2px;
            }
            .osu-toggle {
                position: relative;
                width: 40px;
                height: 22px;
                flex-shrink: 0;
            }
            .osu-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
                position: absolute;
            }
            .osu-toggle-slider {
                position: absolute;
                inset: 0;
                background-color: rgba(var(--spice-rgb-shadow), 0.7);
                border-radius: 22px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .osu-toggle-slider::before {
                content: "";
                position: absolute;
                width: 16px;
                height: 16px;
                left: 3px;
                bottom: 3px;
                background-color: var(--spice-text);
                border-radius: 50%;
                transition: transform 0.2s;
            }
            .osu-toggle input:checked + .osu-toggle-slider {
                background-color: var(--spice-button);
            }
            .osu-toggle input:checked + .osu-toggle-slider::before {
                transform: translateX(18px);
            }
            .osu-select {
                background-color: rgba(var(--spice-rgb-shadow), 0.7);
                color: var(--spice-text);
                border: 1px solid rgba(var(--spice-rgb-text), 0.2);
                border-radius: 6px;
                padding: 5px 10px;
                font-size: 13px;
                cursor: pointer;
                outline: none;
                min-width: 140px;
            }
            .osu-select:focus {
                border-color: var(--spice-button);
            }
        `;
        content.appendChild(style);

        const wrap = document.createElement("div");
        wrap.className = "osu-settings";
        content.appendChild(wrap);

        function addToggle(parent, labelText, descText, checked, onChange) {
            const row = document.createElement("div");
            row.className = "osu-setting-row";

            const labelWrap = document.createElement("div");
            const lbl = document.createElement("label");
            lbl.textContent = labelText;
            labelWrap.appendChild(lbl);
            if (descText) {
                const desc = document.createElement("div");
                desc.className = "osu-desc";
                desc.textContent = descText;
                labelWrap.appendChild(desc);
            }
            row.appendChild(labelWrap);

            const toggle = document.createElement("label");
            toggle.className = "osu-toggle";
            const input = document.createElement("input");
            input.type = "checkbox";
            input.checked = checked;
            input.addEventListener("change", () => onChange(input.checked));
            const slider = document.createElement("span");
            slider.className = "osu-toggle-slider";
            toggle.appendChild(input);
            toggle.appendChild(slider);
            row.appendChild(toggle);

            parent.appendChild(row);
            return input;
        }

        function addSelect(parent, labelText, options, currentValue, onChange) {
            const row = document.createElement("div");
            row.className = "osu-setting-row";

            const lbl = document.createElement("label");
            lbl.textContent = labelText;
            row.appendChild(lbl);

            const sel = document.createElement("select");
            sel.className = "osu-select";
            options.forEach(({ label, value }) => {
                const opt = document.createElement("option");
                opt.value = value;
                opt.textContent = label;
                if (value === currentValue) opt.selected = true;
                sel.appendChild(opt);
            });
            sel.addEventListener("change", () => onChange(sel.value));
            row.appendChild(sel);

            parent.appendChild(row);
        }

        // ── Game Mode ──
        const h1 = document.createElement("h2");
        h1.textContent = "Game Mode";
        wrap.appendChild(h1);

        addSelect(wrap, "Default mode", [
            { label: "osu! default (no filter)", value: "" },
            { label: "osu! standard", value: "0" },
            { label: "osu!taiko", value: "1" },
            { label: "osu!catch", value: "2" },
            { label: "osu!mania", value: "3" },
        ], settings.mode, (val) => {
            settings.mode = val;
            saveSettings(settings);
        });

        // ── Beatmap Status ──
        const h2 = document.createElement("h2");
        h2.textContent = "Beatmap Status";
        wrap.appendChild(h2);

        addSelect(wrap, "Filter by status", [
            { label: "Default (has leaderboard)", value: "" },
            { label: "Any", value: "any" },
            { label: "Ranked", value: "ranked" },
            { label: "Qualified", value: "qualified" },
            { label: "Loved", value: "loved" },
            { label: "Graveyard", value: "graveyard" },
        ], settings.status, (val) => {
            settings.status = val;
            saveSettings(settings);
        });

        // ── Content ──
        const h3 = document.createElement("h2");
        h3.textContent = "Content";
        wrap.appendChild(h3);

        addToggle(wrap, "Show explicit content (NSFW)", "When off, explicit beatmaps are hidden", settings.nsfw, (val) => {
            settings.nsfw = val;
            saveSettings(settings);
        });

        // ── General Filters ──
        const h4 = document.createElement("h2");
        h4.textContent = "General Filters";
        wrap.appendChild(h4);

        const generalOptions = [
            { key: "recommended", label: "Recommended difficulty" },
            { key: "converts", label: "Include converts" },
            { key: "follows", label: "Followed mappers" },
            { key: "spotlights", label: "Spotlights" },
            { key: "featured_artists", label: "Featured artists" },
        ];

        generalOptions.forEach(({ key, label }) => {
            addToggle(wrap, label, null, settings.general[key], (val) => {
                settings.general[key] = val;
                saveSettings(settings);
            });
        });

        return content;
    }

    // ─── Profile Menu Entry ───────────────────────────────────────────────────

    new Spicetify.Menu.Item(
        "osu! Lookup Settings",
        false,
        () => {
            Spicetify.PopupModal.display({
                title: "osu! Lookup Settings",
                content: buildSettingsContent(),
                isLarge: false,
            });
        }
    ).register();

})();