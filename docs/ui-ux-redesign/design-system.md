# Design System — e-Santé Sénégal

## Direction artistique : "Modern Medical Trust"

**Style** : Soft UI Evolution — hybride entre flat design et neumorphisme léger, WCAG AA+.

## Palette de couleurs

### Mode clair
| Token | Hex | Usage |
|-------|-----|-------|
| `--primary` | `#0891B2` | Actions principales, liens, accents |
| `--primary-600` | `#0E7490` | Hover sur primary |
| `--primary-soft` | `#ECFEFF` | Backgrounds de badges, chips actifs |
| `--accent` | `#059669` | Succès, confirmations, CTA secondaire |
| `--bg` | `#F8FFFE` | Fond de page |
| `--surface` | `#FFFFFF` | Cartes, modales |
| `--surface-2` | `#F0FDFA` | Backgrounds légers |
| `--text` | `#134E4A` | Texte principal |
| `--muted` | `#5F7B7E` | Texte secondaire |
| `--border` | `#D5E8E4` | Bordures |
| `--danger` | `#DC2626` | Erreurs, actions destructives |
| `--warn` | `#D97706` | Avertissements |
| `--info` | `#0284C7` | Informations |

### Mode sombre
Les tokens sont redéfinis dans `[data-theme='dark']` avec des variantes désaturées et plus claires.

## Typographie

| Rôle | Police | Poids |
|------|--------|-------|
| Titres (`--font-heading`) | Figtree | 600-800 |
| Corps (`--font-body`) | Noto Sans | 400-600 |

**Échelle** : 0.72rem / 0.78rem / 0.82rem / 0.875rem / 0.9rem / 0.95rem / 1rem / 1.05rem / 1.25rem / 1.5rem / 1.75rem

## Élévation

| Niveau | Token | Usage |
|--------|-------|-------|
| xs | `--shadow-xs` | KPI cards |
| sm | `--shadow-sm` | Cards par défaut |
| md | `--shadow-md` | Float cards, toasts |
| lg | `--shadow-lg` | Modales |

## Rayons de bordure

| Token | Valeur | Usage |
|-------|--------|-------|
| `--radius-sm` | 8px | Boutons, inputs |
| `--radius` | 12px | Cards, modales |
| `--radius-lg` | 16px | Sections, empty states |
| `--radius-xl` | 20px | Modale, CTA band |
| `--radius-full` | 9999px | Chips, badges, avatars |

## Icônes

**Bibliothèque** : Lucide React (SVG, tree-shakeable)
**Tailles standardisées** : 14px (inline), 16px (boutons), 18px (navigation), 20px (features), 32px (empty states)
**Import centralisé** : `src/icons.jsx`

## Espacement

Échelle base 4px : 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
