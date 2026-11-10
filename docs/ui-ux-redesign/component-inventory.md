# Inventaire des Composants

## Composants partagés (src/components/)

| Composant | Fichier | Modifications |
|-----------|---------|--------------|
| `ToastProvider` | ui.jsx | Icônes toast remplacées par Lucide (Check, CircleAlert, Info) |
| `Modal` | ui.jsx | Bouton fermer : X Lucide au lieu du caractère × |
| `ConfirmModal` | ui.jsx | Aucune modification de logique |
| `Avatar` | ui.jsx | Teintes HSL ajustées (décalage +170 au lieu de +20 pour meilleur contraste) |
| `StatusBadge` | ui.jsx | Aucune modification |
| `Empty` | ui.jsx | Prop `icon` accepte désormais du JSX (Lucide) au lieu d'un string emoji |
| `SkeletonCards` | ui.jsx | Rayons ajustés aux nouveaux design tokens |
| `SkeletonRows` | ui.jsx | Hauteur ajustée (84px) |
| `OrdonnanceModal` | OrdonnanceModal.jsx | Icône d'impression : Printer Lucide |

## Pages (src/pages/)

### Accueil.jsx
| Élément | Avant | Après |
|---------|-------|-------|
| Features icons | Emojis (🔎📅🗂💊📊🕒) | Lucide (Search, Calendar, ClipboardList, Pill, Activity, Clock) |
| Eyebrow | "🇸🇳 La santé connectée..." | "La santé connectée au Sénégal" |
| Float cards | Emojis (💊📅) | Lucide (FileText, CalendarCheck) |

### Auth.jsx (Login + Register)
| Élément | Avant | Après |
|---------|-------|-------|
| Password toggle | 🙈 / 👁 | EyeOff / Eye (Lucide) |
| Toast bienvenue | "Bienvenue X 👋" | "Bienvenue X" |

### Patient.jsx
| Élément | Avant | Après |
|---------|-------|-------|
| Recherche | 🔍 | Search (Lucide) |
| Empty states | 🩺📅💊🕒📭 | Stethoscope, Calendar, Pill, Clock, ClipboardList |
| Banner prochain RDV | ⏰ | CalendarClock (Lucide) |
| Stepper check | ✓ | Check (Lucide) |
| Ordonnance icon | 💊 | Pill (Lucide) |

### Medecin.jsx
| Élément | Avant | Après |
|---------|-------|-------|
| Recherche | 🔍 | Search (Lucide) |
| Empty states | 🗓🕒💊 | Calendar, Clock, Pill |
| Nav jour | ‹ / › | ChevronLeft / ChevronRight |
| Ajout médicament | + | Plus (Lucide) |
| Supprimer ligne | × | X (Lucide) |
| Toast messages | Suppression des ✓ emoji |

## Nouveau fichier : src/icons.jsx

Export centralisé de 44 icônes Lucide utilisées dans le projet. Permet de remplacer une icône globalement en modifiant un seul fichier.

## App.jsx (shell)
| Élément | Avant | Après |
|---------|-------|-------|
| Theme toggle | ☀ / ☾ | Sun / Moon (Lucide) |
| Déconnexion | Texte seul | LogOut icon + texte |
