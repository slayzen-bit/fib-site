# Site officiel du FIB — Federal Investigation Bureau (serveur RP)

Site complet (front + back) pour un serveur roleplay : accueil public,
recrutement, espace agent, niveau commandement, et blocage des citoyens
sans rôle autorisé — via un système de **codes d'accès** (pas de Discord).
Responsive mobile/ordinateur.

## 1. Prérequis

- [Node.js](https://nodejs.org/) 18 ou supérieur.

## 2. Configurer le projet

```bash
cp .env.example .env
```

Ouvrez `.env` et définissez vos propres codes :

```
AGENT_CODES=AGENT-2547,AGENT-1190
COMMAND_CODES=CMD-0001
```

- `AGENT_CODES` : un ou plusieurs codes donnant accès à l'**espace agent**.
- `COMMAND_CODES` : un ou plusieurs codes donnant accès au **niveau
  commandement** (qui inclut automatiquement l'espace agent).
- Séparez plusieurs codes par une virgule, sans espace.

Changez également `SESSION_SECRET` par une chaîne longue et aléatoire.

## 3. Installer et lancer

```bash
npm install
npm start
```

Le site est alors disponible sur http://localhost:3000

## 4. Comment fonctionne l'accès

- La page `/connexion` demande un indicatif (nom affiché, libre) et un
  **code d'accès**.
- Le code est comparé côté serveur à `AGENT_CODES` / `COMMAND_CODES`.
  Un code inconnu est **refusé** : aucune session n'est créée, l'utilisateur
  reste un simple citoyen sans accès.
- `/espace-agent` exige une session avec le niveau Agent ou Commandement.
- `/commandement` exige strictement le niveau Commandement.
- Toute tentative d'accès direct à une page protégée sans code valide
  affiche une page « Accès refusé » et redirige vers la connexion.
- La session expire après 8h d'inactivité.

⚠️ Ce système est volontairement simple (pas de base de données, pas de
compte individuel). Pour une sécurité plus fine par utilisateur ou une
vérification automatique des rôles de votre serveur Discord, voir la
variante avec connexion Discord OAuth2.

## 5. Distribuer les codes

Communiquez les codes uniquement aux membres validés (en message privé,
jamais publiquement). Pour révoquer un accès individuel, il faut changer
le code correspondant dans `.env` et redémarrer le serveur — tous les
détenteurs de l'ancien code perdent alors l'accès, il faudra donc leur
redonner le nouveau code.

## 6. Mettre le site en ligne

Hébergez ce projet sur n'importe quel service Node.js (Railway, Render,
VPS...). Pensez à définir les variables d'environnement sur la plateforme
d'hébergement plutôt que de committer votre fichier `.env`.

## 7. Structure du projet

```
fib-site/
├── server.js              # serveur Express, auth par code, protection des routes
├── .env.example            # variables à copier dans .env
├── views/                  # pages EJS (accueil, recrutement, connexion, dashboards...)
│   └── partials/            # en-tête / pied de page communs
└── public/
    ├── css/style.css        # identité visuelle "dossier fédéral"
    ├── js/main.js            # menu mobile
    └── img/seal.svg           # sceau du Bureau
```

## 8. Personnaliser

- Textes des missions, grades et conditions : `views/index.ejs` et
  `views/recrutement.ejs`.
- Couleurs et typographies : variables en haut de `public/css/style.css`.
- Contenu des espaces protégés : `views/dashboard.ejs` et
  `views/commandement.ejs`.
