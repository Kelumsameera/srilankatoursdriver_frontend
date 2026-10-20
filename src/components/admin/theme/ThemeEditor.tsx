"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Download, Save, Trash2, Upload, RotateCcw } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import {
  COLOR_KEYS,
  COLOR_LABELS,
  DEFAULT_THEME,
  FONT_OPTIONS,
  PRESETS,
  resolveTheme,
  type ColorKey,
  type HeadingLevel,
  type ThemeColors,
  type ThemeSettings,
} from "@/lib/theme";
import type { Branding, MediaAsset } from "@/types/cms";
import { Button, Card, ConfirmDialog, ErrorBlock, Input, Label, LoadingBlock, PageHeader, Select, Switch, Tabs, Textarea } from "@/components/admin/ui";
import { MediaField } from "@/components/admin/MediaLibrary";
import { ColorField, NumberField, RangeField, Segmented } from "./fields";
import { ThemePreview } from "./ThemePreview";

type Tab = "themes" | "colors" | "typography" | "background" | "shape" | "css";
type T = ThemeSettings;

const TABS: { value: Tab; label: string }[] = [
  { value: "themes", label: "Presets" },
  { value: "colors", label: "Colours" },
  { value: "typography", label: "Typography" },
  { value: "background", label: "Background" },
  { value: "shape", label: "Shape & spacing" },
  { value: "css", label: "Custom CSS" },
];

const latinFonts = FONT_OPTIONS.filter((f) => !f.script);
const scriptFonts = (script: "sinhala" | "tamil") => FONT_OPTIONS.filter((f) => f.script === script);
const WEIGHTS = [300, 400, 500, 600, 700, 800];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Small coloured dots for a palette (preset cards). */
function Swatches({ colors }: { colors: ThemeColors }) {
  return (
    <span className="flex">
      {(["primary", "secondary", "accent", "background", "text"] as ColorKey[]).map((k) => (
        <span key={k} className="-ms-1 h-5 w-5 rounded-full border-2 border-white first:ms-0" style={{ background: colors[k] }} />
      ))}
    </span>
  );
}

/** Admin → Theme: edit, preview, save, reset, export and import the website's appearance. */
export function ThemeEditor() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const readOnly = !can("branding:update");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["settings", "/admin/branding"], queryFn: () => api.get<Branding>("/admin/branding") });
  const saved = data ? resolveTheme(data.data) : null;
  // The unsaved draft, tied to the saved version it started from (a reload after Save resets it).
  const [draftState, setDraftState] = useState<{ base: string; theme: T } | null>(null);
  const baseKey = JSON.stringify(saved);
  const theme = draftState && draftState.base === baseKey ? draftState.theme : saved;
  const [tab, setTab] = useState<Tab>("themes");
  const [palette, setPalette] = useState<"colors" | "darkColors">("colors");
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [newName, setNewName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <LoadingBlock />;
  if (error || !theme || !saved) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;

  const dirty = !same(theme, saved);
  const set = (fn: (t: T) => T) => setDraftState({ base: baseKey, theme: fn(theme) });
  const setTypo = (patch: Partial<T["typography"]>) => set((t) => ({ ...t, typography: { ...t.typography, ...patch } }));
  const setBg = (patch: Partial<T["background"]>) => set((t) => ({ ...t, background: { ...t.background, ...patch } }));
  const setImage = (patch: Partial<T["background"]["image"]>) => setBg({ image: { ...theme.background.image, ...patch } });
  const setSize = (h: HeadingLevel, v: number) => setTypo({ headingSizes: { ...theme.typography.headingSizes, [h]: v } });

  // Save: the whole theme, plus the three brand colours mirrored into the older Branding fields.
  const save = async () => {
    setSaving(true);
    try {
      const { primary, secondary, accent } = theme.colors;
      await api.put("/admin/branding", { theme, colors: { primary, secondary, accent } });
      await qc.invalidateQueries({ queryKey: ["settings", "/admin/branding"] });
      setDraftState(null);
      toast.success("Theme saved – the public website has been refreshed");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Export: download the current draft as JSON.
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ version: 1, theme }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "site-theme.json" });
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import: read a JSON file, validate it with the same rules as the website, then show it as an unsaved draft.
  const importJson = async (file: File) => {
    try {
      if (file.size > 200_000) throw new Error("File is too large");
      const parsed = JSON.parse(await file.text()) as { theme?: unknown };
      set(() => resolveTheme({ theme: parsed.theme ?? parsed }));
      toast.success("Theme imported – check the preview, then Save");
    } catch {
      toast.error("That file is not a valid theme export");
    }
  };

  const applyPalette = (preset: string, colors: ThemeColors, darkColors: ThemeColors) => set((t) => ({ ...t, preset, colors, darkColors }));
  const saveCustom = () => {
    const name = newName.trim().slice(0, 60);
    if (!name) return;
    set((t) => ({ ...t, preset: name, customThemes: [...t.customThemes.filter((c) => c.name !== name), { name, colors: t.colors, darkColors: t.darkColors }].slice(-20) }));
    setNewName("");
    toast.success(`Saved "${name}" – click Save to keep it`);
  };

  const defaults = palette === "colors" ? DEFAULT_THEME.colors : DEFAULT_THEME.darkColors;

  return (
    <div>
      <PageHeader
        title="Site Appearance"
        description="Colours, fonts, background and shape of the public website. Changes show in the preview first and go live when you click Save."
        actions={
          <>
            <Button variant="outline" onClick={exportJson}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={readOnly}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importJson(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => setConfirmReset(true)} disabled={readOnly}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={() => setDraftState(null)}>
                Discard changes
              </Button>
            )}
            <Button onClick={save} loading={saving} disabled={readOnly || !dirty}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </>
        }
      />

      {dirty && (
        <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You have unsaved changes. The website still shows the saved theme.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <Tabs value={tab} onChange={setTab} tabs={TABS} />

          {/* Presets and named custom themes */}
          {tab === "themes" && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => applyPalette(p.id, p.colors, p.darkColors)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border p-3 text-start transition hover:border-forest-600 hover:shadow-sm",
                      theme.preset === p.id ? "border-forest-700 ring-2 ring-forest-700/15" : "border-slate-200",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{p.name}</span>
                      <span className="mt-1.5 block">
                        <Swatches colors={p.colors} />
                      </span>
                    </span>
                    {theme.preset === p.id && <Check className="h-4 w-4 text-forest-700" aria-label="Applied" />}
                  </button>
                ))}
              </div>

              <div>
                <h3 className="mb-2 font-sans text-sm font-semibold tracking-normal text-slate-800">Your themes</h3>
                {theme.customThemes.length === 0 ? (
                  <p className="text-sm text-slate-500">No custom themes yet. Adjust the colours, then save them under a name below.</p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {theme.customThemes.map((c) => (
                      <li key={c.name} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="flex items-center gap-3">
                          <Swatches colors={c.colors} />
                          <span className="text-sm font-medium text-slate-800">{c.name}</span>
                        </span>
                        <span className="flex gap-1">
                          <Button size="sm" variant="outline" disabled={readOnly} onClick={() => applyPalette(c.name, c.colors, c.darkColors)}>
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={readOnly}
                            aria-label={`Delete ${c.name}`}
                            onClick={() => set((t) => ({ ...t, customThemes: t.customThemes.filter((x) => x.name !== c.name) }))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex gap-2">
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name, e.g. Monsoon" maxLength={60} disabled={readOnly} aria-label="New theme name" />
                  <Button variant="outline" onClick={saveCustom} disabled={readOnly || !newName.trim()}>
                    Save current colours
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Colour tokens, light and dark palettes */}
          {tab === "colors" && (
            <div>
              {/* Which mode the website uses */}
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Segmented
                  label="Website mode"
                  value={theme.mode}
                  disabled={readOnly}
                  onChange={(mode) => set((t) => ({ ...t, mode }))}
                  options={[
                    { value: "light", label: "Light only" },
                    { value: "dark", label: "Dark only" },
                    { value: "visitor", label: "Visitor chooses" },
                  ]}
                />
                <p className="mt-2 text-xs text-slate-500">
                  {theme.mode === "visitor"
                    ? "A sun/moon button appears in the header. First visit follows the device setting; the choice is remembered for a year."
                    : theme.mode === "dark"
                      ? "Every visitor sees the dark palette."
                      : "Every visitor sees the light palette (the original design)."}
                </p>
              </div>
              <div className="mb-4">
                <Segmented
                  label="Palette"
                  value={palette}
                  onChange={setPalette}
                  options={[
                    { value: "colors", label: "Light" },
                    { value: "darkColors", label: "Dark" },
                  ]}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {COLOR_KEYS.map((k) => (
                  <ColorField
                    key={`${palette}-${k}`}
                    label={COLOR_LABELS[k].label}
                    hint={COLOR_LABELS[k].hint}
                    value={theme[palette][k]}
                    defaultValue={defaults[k]}
                    disabled={readOnly}
                    onChange={(v) => set((t) => ({ ...t, preset: "custom", [palette]: { ...t[palette], [k]: v } }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fonts and sizes */}
          {tab === "typography" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="headingFont">Heading font</Label>
                  <Select id="headingFont" value={theme.typography.headingFont} disabled={readOnly} onChange={(e) => setTypo({ headingFont: e.target.value })}>
                    {latinFonts.map((f) => (
                      <option key={f.name}>{f.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bodyFont">Body font</Label>
                  <Select id="bodyFont" value={theme.typography.bodyFont} disabled={readOnly} onChange={(e) => setTypo({ bodyFont: e.target.value })}>
                    {latinFonts.map((f) => (
                      <option key={f.name}>{f.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sinhalaFont" hint="Sinhala pages">
                    Sinhala font
                  </Label>
                  <Select id="sinhalaFont" value={theme.typography.sinhalaFont} disabled={readOnly} onChange={(e) => setTypo({ sinhalaFont: e.target.value })}>
                    <option value="">Visitor&apos;s system font</option>
                    {scriptFonts("sinhala").map((f) => (
                      <option key={f.name}>{f.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tamilFont" hint="Tamil pages">
                    Tamil font
                  </Label>
                  <Select id="tamilFont" value={theme.typography.tamilFont} disabled={readOnly} onChange={(e) => setTypo({ tamilFont: e.target.value })}>
                    <option value="">Visitor&apos;s system font</option>
                    {scriptFonts("tamil").map((f) => (
                      <option key={f.name}>{f.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <p className="text-xs text-slate-500">Poppins and Playfair Display are bundled with the site. Other fonts load from Google Fonts only on pages that use them.</p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <NumberField label="Base size" suffix="px" value={theme.typography.baseSize} min={12} max={22} disabled={readOnly} onChange={(v) => setTypo({ baseSize: v })} />
                <NumberField label="Line height" value={theme.typography.lineHeight} min={1} max={2.4} step={0.05} disabled={readOnly} onChange={(v) => setTypo({ lineHeight: v })} />
                <div>
                  <Label htmlFor="headingWeight">Heading weight</Label>
                  <Select id="headingWeight" value={theme.typography.headingWeight} disabled={readOnly} onChange={(e) => setTypo({ headingWeight: Number(e.target.value) })}>
                    {WEIGHTS.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bodyWeight">Body weight</Label>
                  <Select id="bodyWeight" value={theme.typography.bodyWeight} disabled={readOnly} onChange={(e) => setTypo({ bodyWeight: Number(e.target.value) })}>
                    {WEIGHTS.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-sans text-sm font-semibold tracking-normal text-slate-800">Heading sizes (desktop)</h3>
                  <Switch checked={theme.typography.responsive} disabled={readOnly} onChange={(v) => setTypo({ responsive: v })} label="Smaller on phones" />
                </div>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                  {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((h) => (
                    <NumberField key={h} label={h.toUpperCase()} suffix="px" value={theme.typography.headingSizes[h]} min={10} max={120} disabled={readOnly} onChange={(v) => setSize(h, v)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Page background */}
          {tab === "background" && (
            <div className="space-y-5">
              <Segmented
                label="Type"
                value={theme.background.type}
                disabled={readOnly}
                onChange={(type) => setBg({ type })}
                options={[
                  { value: "default", label: "Paper texture (default)" },
                  { value: "solid", label: "Solid" },
                  { value: "gradient", label: "Gradient" },
                  { value: "image", label: "Image" },
                ]}
              />
              {theme.background.type === "default" && <p className="text-sm text-slate-500">The original ivory paper texture with palm-frond line drawings. It follows the Background colour.</p>}
              {theme.background.type === "solid" && (
                <div className="max-w-xs">
                  <ColorField label="Colour" value={theme.background.color} disabled={readOnly} onChange={(color) => setBg({ color })} />
                </div>
              )}
              {theme.background.type === "gradient" && (
                <div className="space-y-4">
                  <RangeField label="Direction" value={theme.background.gradient.direction} min={0} max={360} step={5} format={(v) => `${v}°`} disabled={readOnly} onChange={(direction) => setBg({ gradient: { ...theme.background.gradient, direction } })} />
                  <div className="grid gap-4 sm:grid-cols-3">
                    {theme.background.gradient.stops.map((stop, i) => (
                      <ColorField
                        key={i}
                        label={`Colour ${i + 1}`}
                        value={stop}
                        disabled={readOnly}
                        onChange={(v) => setBg({ gradient: { ...theme.background.gradient, stops: theme.background.gradient.stops.map((s, j) => (j === i ? v : s)) } })}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {theme.background.gradient.stops.length < 3 ? (
                      <Button size="sm" variant="outline" disabled={readOnly} onClick={() => setBg({ gradient: { ...theme.background.gradient, stops: [...theme.background.gradient.stops, "#ffffff"] } })}>
                        Add third colour
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={readOnly} onClick={() => setBg({ gradient: { ...theme.background.gradient, stops: theme.background.gradient.stops.slice(0, 2) } })}>
                        Remove third colour
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {theme.background.type === "image" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Upload or choose</Label>
                      <MediaField value={theme.background.image.asset} folder="branding" label="Background image" onChange={(asset: MediaAsset | null) => setImage({ asset })} />
                    </div>
                    <div>
                      <Label htmlFor="bgUrl" hint="used when no image is chosen">
                        Or image URL
                      </Label>
                      <Input
                        id="bgUrl"
                        key={theme.background.image.url}
                        type="url"
                        placeholder="https://…"
                        defaultValue={theme.background.image.url}
                        disabled={readOnly}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (!v || /^https:\/\/[^\s"'()\\<>]+$/.test(v)) setImage({ url: v });
                          else toast.error("Use an https image URL");
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="bgPos">Position</Label>
                      <Select id="bgPos" value={theme.background.image.position} disabled={readOnly} onChange={(e) => setImage({ position: e.target.value as T["background"]["image"]["position"] })}>
                        {["center", "top", "bottom", "left", "right"].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="bgSize">Size</Label>
                      <Select id="bgSize" value={theme.background.image.size} disabled={readOnly} onChange={(e) => setImage({ size: e.target.value as T["background"]["image"]["size"] })}>
                        {["cover", "contain", "auto"].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <Switch checked={theme.background.image.repeat} disabled={readOnly} onChange={(repeat) => setImage({ repeat })} label="Repeat" />
                    <Switch checked={theme.background.image.fixed} disabled={readOnly} onChange={(fixed) => setImage({ fixed })} label="Fixed while scrolling" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField label="Overlay colour" value={theme.background.image.overlayColor} disabled={readOnly} onChange={(overlayColor) => setImage({ overlayColor })} />
                    <RangeField label="Overlay opacity" value={theme.background.image.overlayOpacity} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} disabled={readOnly} onChange={(overlayOpacity) => setImage({ overlayOpacity })} />
                  </div>
                </div>
              )}
              {theme.background.type !== "default" && <p className="text-xs text-slate-500">Light page sections become see-through so this background shows behind them. Dark green bands keep their colour.</p>}
            </div>
          )}

          {/* Corners, buttons and spacing */}
          {tab === "shape" && (
            <div className="space-y-6">
              <RangeField label="Corner roundness" value={theme.radiusScale} min={0} max={2} step={0.05} format={(v) => (v === 1 ? "Default" : `${Math.round(v * 100)}%`)} disabled={readOnly} onChange={(radiusScale) => set((t) => ({ ...t, radiusScale }))} />
              <Segmented
                label="Button style"
                value={theme.buttonStyle}
                disabled={readOnly}
                onChange={(buttonStyle) => set((t) => ({ ...t, buttonStyle }))}
                options={[
                  { value: "pill", label: "Pill (default)" },
                  { value: "rounded", label: "Rounded" },
                  { value: "square", label: "Square" },
                ]}
              />
              <RangeField label="Section spacing" value={theme.spacingScale} min={0.75} max={1.5} step={0.05} format={(v) => (v === 1 ? "Default" : `${Math.round(v * 100)}%`)} disabled={readOnly} onChange={(spacingScale) => set((t) => ({ ...t, spacingScale }))} />
              <p className="text-xs text-slate-500">
                Logos and favicon are on the{" "}
                <Link href="/admin/branding" className="text-forest-700 underline">
                  Branding
                </Link>{" "}
                page.
              </p>
            </div>
          )}

          {/* Custom CSS */}
          {tab === "css" && (
            <div>
              <Label htmlFor="customCss" hint={`${theme.customCss.length} / 20000`}>
                Custom CSS
              </Label>
              <Textarea
                id="customCss"
                value={theme.customCss}
                disabled={readOnly}
                maxLength={20000}
                spellCheck={false}
                rows={14}
                className="font-mono text-xs"
                placeholder={'html[data-site="public"] .eyebrow { letter-spacing: 0.3em; }'}
                onChange={(e) => set((t) => ({ ...t, customCss: e.target.value }))}
              />
              <p className="mt-2 text-xs text-slate-500">
                Added after the theme on every public page. For safety, @import, scripts, &lt; characters and non-https url() are removed when saving. Not shown in the preview – check the website after saving.
              </p>
            </div>
          )}
        </Card>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <ThemePreview theme={theme} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        title="Reset to the default theme?"
        message="Colours, fonts, background, shape and custom CSS go back to the original green & gold design. Your saved custom themes are kept. Nothing changes on the website until you click Save."
        confirmLabel="Reset"
        onConfirm={() => {
          set((t) => ({ ...DEFAULT_THEME, customThemes: t.customThemes }));
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
