# Number Rush — Documentation complète du projet

---

## Présentation du projet

Number Rush est un jeu multijoueur on-chain déployé sur Solana via Magic Block. Le concept est simple : un nombre secret est généré aléatoirement, et les joueurs s'affrontent pour le trouver le plus vite possible, en un minimum de tentatives. Chaque partie implique une mise en SOL, et le pot est redistribué en fin de partie selon les performances de chaque joueur.

L'ensemble de la logique de jeu tourne sur un Private Ephemeral Rollup (PER) fourni par Magic Block, exécuté dans un TEE (Trusted Execution Environment). Cela garantit des transactions ultra-rapides, la confidentialité cryptographiquement enforced des chiffres soumis en temps réel, et un règlement final transparent et vérifiable sur la blockchain Solana.

---

## Règles du jeu

### Lobby et mise de départ

- Entre 2 et 10 joueurs rejoignent un lobby créé à l'avance.
- Chaque joueur paie une mise initiale en SOL (montant défini par le créateur du lobby).
- La partie ne commence que lorsque tous les joueurs ont confirmé leur paiement.
- Le pot total = mise × nombre de joueurs. Une commission est prélevée par la plateforme avant distribution.

### Début de partie

Une fois le lobby complet et les mises verrouillées :

1. Le VRF (Verifiable Random Function) de Magic Block génère un nombre secret entre 0 et 1000.
2. Ce nombre est commité on-chain sur le PER avant l'ouverture des soumissions. Aucun joueur, ni même la plateforme, ne peut modifier ce nombre après ce point.
3. La première manche commence.

### Déroulement d'un round

Chaque partie se joue sur 5 rounds. Pour chaque round :

**Phase de soumission (5 secondes par tentative)**

- Tous les joueurs soumettent simultanément un nombre entre 0 et 1000.
- Chaque joueur a 5 secondes pour envoyer son chiffre. Passé ce délai, la tentative du joueur est ignorée pour ce tour (elle compte quand même comme un coup utilisé).
- Les chiffres soumis sont stockés dans le PlayerGuess du joueur, protégé par le Permission Program du PER. Seul le joueur propriétaire peut lire ses propres guesses — cette privacy est enforced cryptographiquement par le TEE.

**Phase de feedback (immédiate)**

Après chaque tentative, chaque joueur reçoit :
- Une indication de direction : plus (+) ou moins (−)
- Un état de proximité :
  - Glacial : écart > 400
  - Froid : écart entre 200 et 400
  - Tiède : écart entre 100 et 200
  - Chaud : écart entre 50 et 100
  - Bouillant : écart entre 1 et 50
  - Trouvé : écart = 0

**Ce que les autres joueurs voient**

Les adversaires voient pour chaque joueur l'état de proximité (chaud, froid, etc.) et la direction (+/-), mais pas le chiffre exact soumis. Cette asymétrie d'information est le cœur de la dimension stratégique du jeu. La privacy est enforced par le Permission Program — même un client modifié ne peut pas lire les guesses des autres joueurs sur le PER.

**Fin de round**

Un round se termine lorsque tous les joueurs actifs ont trouvé le nombre, ou lorsqu'une limite de tentatives est atteinte (voir section anti-blocage). À la fin de chaque round :
- Les permissions sur les PlayerGuess sont ouvertes (members: None) → tout le monde peut voir les guesses de tout le monde
- Le nombre cible est révélé dans le RoundReveal
- Les permissions sont re-créées (members: [owner]) pour le round suivant

Un nouveau nombre est généré via VRF pour le round suivant.

### Leaderboard et scoring

Le leaderboard classe les joueurs par nombre total de tentatives cumulées sur les 5 rounds. Moins un joueur utilise de tentatives, mieux il est classé.

En cas d'égalité parfaite : le joueur qui a trouvé le nombre le plus rapidement (en temps total cumulé) est favorisé.

### Distribution du pot

À la fin des 5 rounds, le pot est distribué selon le classement final :

- 1er : 50% du pot net
- 2e : 25% du pot net
- 3e : 15% du pot net
- 4e et suivants : le reste est partagé équitablement

(Les pourcentages peuvent être ajustés selon le nombre de joueurs dans le lobby. La logique exacte est inscrite dans le smart contract avant le début de la partie.)

La commission de la plateforme est déduite du pot brut avant distribution.

---

## Règles anti-blocage et gestion des comportements passifs

### Joueur inactif (ne soumet rien)

- Si un joueur ne soumet aucun chiffre pendant 3 rounds consécutifs, il est automatiquement exclu du leaderboard.
- Son score final est figé au pire rang possible.
- Il ne perçoit aucune part du pot.
- Sa mise reste dans le pot et est redistribuée aux joueurs actifs.

### Joueur déconnecté

- Si un joueur se déconnecte en cours de partie, il est traité comme inactif à partir du round suivant.
- La règle des 3 rounds inactifs s'applique normalement.
- Aucun remboursement n'est possible une fois la partie commencée (les fonds sont verrouillés dans le smart contract dès le début).

### Timer dépassé sans soumission

- Chaque tentative non soumise dans les 5 secondes compte comme un coup raté (le joueur est enregistré comme ayant utilisé un coup sans progresser).
- Cela pénalise passivement les joueurs lents sans bloquer la progression des autres.

### Limite de tentatives par round

- Un round ne peut pas durer indéfiniment. Une limite maximale de 15 tentatives par joueur par round est appliquée.
- Si un joueur n'a pas trouvé après 15 tentatives, son round est clôturé automatiquement avec le score maximum (15 coups) pour ce round.

---

## Stack technique

### Vue d'ensemble

```
[Joueurs] ──► [Frontend (React/Next.js)]
                    │
                    ▼ (auth token + TEE verification)
         [Magic Block Private Ephemeral Rollup (PER)]
         [TEE — Trusted Execution Environment]
                    │
         ┌──────────┴──────────┐
         │  Anchor Program     │
         │  "number_rush"      │
         │                     │
         │  Accounts :         │
         │  - GameConfig       │  ← Public
         │  - PlayerState      │  ← Public (proximité, direction)
         │  - PlayerGuess      │  ← Privé (Permission Program)
         │  - Vault            │  ← SOL pot
         │  - Leaderboard      │  ← Public
         │  - RoundReveal      │  ← Public après fin de round
         │                     │
         │  Instructions :     │
         │  - init_game        │
         │  - spawn_player     │
         │  - delegate_game    │
         │  - delegate_player  │
         │  - start_game       │
         │  - submit_guess     │  ← Via session key (no popup)
         │  - end_round        │
         │  - end_game         │
         └─────────────────────┘
                    │
                    ▼
         [Settlement Solana Devnet]
         (commit + undelegate, distribution du pot)
```

### Architecture — Anchor pur + PER

Le programme utilise Anchor 0.32.1 avec le SDK `ephemeral-rollups-sdk` pour la délégation vers le Private Ephemeral Rollup. Pas de BOLT ECS — le jeu n'a pas besoin du pattern Entity/Component/System car il n'y a pas d'entités en mouvement temps réel.

**Programme unique** : `number_rush` contient toute la logique (accounts + instructions + delegation).

**Accounts** (state) :

| Account | PDA Seeds | Rôle | Visibilité PER |
|---|---|---|---|
| `GameConfig` | `[game, game_id]` | Status, rounds, target, bet, joueurs registry | Public |
| `PlayerState` | `[player, game, authority]` | Proximité, direction, attempts, alive | Public |
| `PlayerGuess` | `[guess, game, authority]` | Historique des guesses du round en cours | **Privé** (Permission Program) |
| `Vault` | `[vault, game]` | Pot SOL, deposits, payout status | Public |
| `Leaderboard` | `[leaderboard, game]` | Classement trié par attempts + tiebreak time | Public |
| `RoundReveal` | `[reveal, game]` | Targets révélés, résumé par joueur par round | Public après round |

**Instructions** :

| Instruction | Quand | Signé par | Où |
|---|---|---|---|
| `init_game` | Création du lobby | Wallet (creator) | L1 |
| `spawn_player` | Join + deposit bet | Wallet (player) | L1 |
| `delegate_game` | Après init | Wallet (creator) | L1 → PER |
| `delegate_player` | Après spawn | Wallet (player) | L1 → PER |
| `start_game` | Lobby terminé | Wallet ou crank | PER |
| `submit_guess` | Chaque tentative | **Session key** (no popup) | PER |
| `end_round` | Fin de round | Wallet ou crank | PER |
| `end_game` | Fin partie + payout | Wallet ou crank | PER → L1 (commit) |

### Private Ephemeral Rollup (PER) — comment ça marche

Le PER est un environnement d'exécution temporaire qui tourne dans un TEE (Trusted Execution Environment). Contrairement au ER classique utilisé dans CUBE3D/red-light, le PER enforce la privacy cryptographiquement.

**Différences avec le ER classique :**

| | ER classique (CUBE3D, red-light) | PER / Private ER (Number Rush) |
|---|---|---|
| Exécution | ER standard | TEE (Trusted Execution Environment) |
| RPC | Public, tout le monde subscribe | Auth token requis (signature wallet) |
| Visibilité comptes | Tout le monde lit tout | **Permission Program** contrôle qui lit quoi |
| Validator | magicblock.app standard | TEE validators spécifiques |
| Frontend connect | `new Connection(ER_RPC)` | `verifyTeeRpcIntegrity()` → `getAuthToken()` → `?token=...` |

**Permission Program** (`ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1`) :
- Chaque `PlayerGuess` a un compte `permission` associé
- `members = [player_authority]` → seul ce joueur peut lire
- En fin de round : `members = None` → tout le monde peut lire (reveal)
- Début du round suivant : permissions re-créées

**TEE Validators** :
- Devnet : `FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA`
- Mainnet : `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo`

**Delegation Program** : `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`

**Auth côté frontend :**
```typescript
import { verifyTeeRpcIntegrity, getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";

const isVerified = await verifyTeeRpcIntegrity(EPHEMERAL_RPC_URL);
const token = await getAuthToken(
  EPHEMERAL_RPC_URL,
  wallet.publicKey,
  (msg: Uint8Array) => wallet.signMessage(msg)
);
const perConnection = new Connection(`https://devnet-tee.magicblock.app?token=${token}`);
```

**Visibilité sur le PER :**

| Account | Visibilité PER | Mécanisme |
|---|---|---|
| PlayerGuess (chiffre soumis) | Privé pendant le round, révélé en fin de round | Permission Program (members) |
| PlayerState (chaud/froid, +/-) | Public en temps réel pour tous | Pas de permission |
| GameConfig | Public en permanence | Pas de permission |
| Leaderboard | Public en permanence | Pas de permission |
| RoundReveal | Public après fin de round | Rempli uniquement à end_round |
| Vault | Public | Pas de permission |

### VRF Magic Block

Le VRF (Verifiable Random Function) est utilisé pour générer le nombre cible à chaque round. Il garantit que le résultat est aléatoire, vérifiable, et non manipulable — ni par les joueurs, ni par la plateforme.

Règle importante : le VRF est appelé et son résultat est commité on-chain AVANT l'ouverture des soumissions des joueurs. Cette séquence est obligatoire pour garantir la fairness. Si le nombre était généré après les premières soumissions, un vecteur de manipulation existerait.

### Session keys

Les session keys permettent aux joueurs de soumettre des guesses sans popup wallet à chaque tentative. Le joueur signe une seule fois pour créer sa session key, puis toutes les TX gameplay sont signées par la session key.

```
1. Player signe 1 TX wallet → crée SessionToken PDA
2. Session key = keypair éphémère (validité 60min, funded 0.002 SOL)
3. submit_guess TX signées par session key → 0 popup
4. Session expire ou révoquée manuellement
```

### Settlement Solana Devnet

À la fin de la partie, le PER commit l'état final et undelegate les comptes vers Solana Devnet. Le résultat final (leaderboard, distribution du pot) est réglé sur L1. Ce mécanisme garantit que la distribution des fonds est transparente et auditée publiquement, même si la partie elle-même s'est déroulée sur le PER privé.

---

## Sécurité et fairness

**Impossibilité de voir les chiffres des adversaires en temps réel**
Les guesses sont protégés par le Permission Program du PER. Même un client modifié ne peut pas lire les PlayerGuess des autres joueurs — la privacy est enforced au niveau du TEE, pas par convention frontend.

**Impossibilité de manipuler le nombre cible**
Le nombre cible est généré via VRF et commité avant les soumissions. Il est immuable une fois la manche lancée.

**Fonds verrouillés dès le départ**
Les mises sont envoyées dans le Vault PDA au moment du spawn. Ni la plateforme ni les joueurs ne peuvent y accéder pendant la partie. La distribution se fait automatiquement à la fin, selon les règles encodées dans le contrat.

**Collusion entre joueurs**
La collusion externe (deux joueurs qui se partagent leurs chiffres via un chat vocal) est difficile à éliminer techniquement dans tout jeu multijoueur. Elle est limitée par le timer de 5 secondes par tentative et par le fait que les chiffres ne sont révélés qu'en fin de round. La dimension "inférence à partir des états adverses" reste un skill légitime et non exploitable via collusion directe.

---

## Résumé exécutif

| Critère | Détail |
|---|---|
| Joueurs | 2 à 10 |
| Mise | X SOL défini par le créateur du lobby |
| Rounds | 5 |
| Timer par tentative | 5 secondes |
| Limite par round | 15 tentatives max |
| Exclusion passive | 3 rounds sans soumission = hors leaderboard |
| Génération du nombre | VRF Magic Block, commité avant les soumissions |
| Confidentialité | Private Ephemeral Rollup (PER) + Permission Program + TEE |
| Framework on-chain | Anchor 0.32.1 + ephemeral-rollups-sdk |
| Règlement final | Solana Devnet (commit + undelegate) |
| Commission plateforme | % prélevé sur le pot brut avant distribution |
