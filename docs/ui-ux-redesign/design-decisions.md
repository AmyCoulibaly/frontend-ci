# Décisions de Design

## Style retenu : Soft UI Evolution

### Pourquoi ce style
- **Confiance médicale** : la profondeur subtile (ombres douces multi-couches) inspire la fiabilité sans être austère
- **Accessibilité** : WCAG AA+ garanti, contrairement au neumorphisme pur qui échoue aux tests de contraste
- **Dark mode complet** : fonctionne dans les deux thèmes (le neumorphisme classique casse en dark)
- **Performance** : aucun blur lourd, aucun gradient complexe — rendu fluide même sur mobile

### Styles rejetés et raisons
| Style | Raison du rejet |
|-------|----------------|
| Neo-Brutalism | Trop agressif et déstabilisant pour un contexte médical sénégalais |
| Glassmorphism | Problèmes d'accessibilité (contraste sur fond flou), performances (backdrop-filter) |
| Neumorphism pur | Contraste insuffisant (échoue WCAG), dark mode impossible |
| Gradient purple/blue | Esthétique "IA générique", aucun lien avec le domaine santé |
| SaaS template standard | Sidebar + cartes blanches — manque d'identité |

## Palette : Medical Teal + Health Green

### Justification
- **Teal (#0891B2)** : universellement associé à la santé et au soin, évoque la propreté
- **Green (#059669)** : symbolise la guérison, le succès, la confiance dans le contexte africain
- **Pas de bleu roi** : trop corporate pour une plateforme de proximité
- **Pas de rouge dominant** : anxiogène dans un contexte médical (réservé aux erreurs/danger)

## Typographie : Figtree + Noto Sans

### Justification
- **Figtree** (titres) : géométrique moderne, excellente lisibilité en gros corps, feeling accessible
- **Noto Sans** (corps) : conçu par Google pour la lisibilité multilingue, supporte les caractères français avec accents
- Les deux sont des Google Fonts gratuites, CDN rapide

## Icônes : Lucide React vs Emojis

### Justification du remplacement
- Les emojis varient selon l'OS/navigateur (un même emoji apparaît différemment sur Chrome/Firefox/Safari)
- Impossible de contrôler la taille, la couleur ou l'alignement des emojis
- Lucide : SVG cohérents, tree-shakeable (seules les icônes importées sont dans le bundle), thémables via CSS
- Lucide est la continuation de Feather Icons avec plus d'icônes et un meilleur support React

## Décisions architecturales

### Pas d'ajout de bibliothèque UI (Tailwind, shadcn, etc.)
Le projet utilise du CSS natif. Ajouter Tailwind aurait impliqué une restructuration majeure de tous les composants sans bénéfice fonctionnel. Le CSS natif avec des custom properties (design tokens) offre le même résultat.

### Conservation de la structure existante
- Même organisation de fichiers (pages/, components/)
- Mêmes noms de classes CSS (préservation de la compatibilité)
- Mêmes hooks et patterns React
- Import centralisé des icônes dans icons.jsx pour faciliter les remplacements futurs
