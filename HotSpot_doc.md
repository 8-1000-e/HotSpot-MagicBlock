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
         │  - RoundSecret      │  ← Privé (target VRF)
         │                     │
         │  Instructions :     │
         │  - init_game        │
         │  - spawn_player     │
         │  - delegate_game    │
         │  - delegate_meta    │
         │  - delegate_player  │
         │  - create_player_   │
         │      permission     │
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

Le programme utilise Anchor 0.32.1 + `ephemeral-rollups-sdk 0.8.0` (feature `anchor`) pour la délégation, `magicblock-permission-client` (vendored) pour les permissions Group+Permission du TEE, et `session-keys 3.0.11` pour le pattern session signer. Pas de BOLT ECS — le jeu n'a pas besoin du pattern Entity/Component/System car il n'y a pas d'entités en mouvement temps réel.

**Programme unique** : `number_rush` (`r8DW7ECLY6zhpYzYUazULHUyHCas3A2j1Ecfvzd1xRa`) contient toute la logique (accounts + instructions + delegation + permissions + session validation).

**Vendored crate** : [crates/magicblock-permission-client/](crates/magicblock-permission-client/) — copié depuis `magicblock-labs/private-payments-demo` (le repo upstream est privé, non publié sur crates.io).

**Structure du code** :
```
programs/number-rush/src/
├── lib.rs                          ← router + #[ephemeral] #[program]
├── constants.rs                    ← seeds, limits, PLATFORM_FEE_BPS, TEE validators
├── errors.rs                       ← GameError enum
├── state/
│   ├── game_config.rs              ← + enum GameStatus
│   ├── round_secret.rs             ← target VRF (privé)
│   ├── player_state.rs             ← + enum Direction
│   ├── player_guess.rs             ← guesses du round en cours (privé)
│   ├── vault.rs                    ← pot SOL
│   ├── leaderboard.rs
│   └── round_reveal.rs
└── instructions/
    ├── init_game.rs
    ├── spawn_player.rs
    ├── delegate_game.rs
    ├── delegate_meta.rs
    ├── delegate_player.rs
    ├── create_player_permission.rs       ← CreateGroup + CreatePermission CPI (PlayerGuess privé)
    ├── create_round_secret_permission.rs ← CreateGroup (members vide) + CreatePermission CPI
    ├── start_game.rs                     ← Session-aware (PER)
    ├── request_target.rs                 ← VRF request via DEFAULT_EPHEMERAL_QUEUE (PER)
    ├── vrf_callback_set_target.rs        ← Callback signé par VRF identity (PER)
    ├── submit_guess.rs                   ← Session-aware (PER)
    ├── end_round.rs                      ← Session-aware (PER)
    └── end_game.rs                       ← Session-aware + commit_and_undelegate (PER → L1)
```

**Workspace** :
```
crates/magicblock-permission-client/    ← Vendored client (repo upstream privé)
programs/number-rush/                    ← Programme Anchor principal
app/                                     ← Frontend Next.js
```

**Accounts** (state) :

| Account | PDA Seeds | Rôle | Visibilité PER |
|---|---|---|---|
| `GameConfig` | `[game, game_id]` | Status, rounds, bet, joueurs registry | Public |
| `RoundSecret` | `[secret, game]` | Target VRF du round en cours | **Privé** (lisible uniquement par le programme) |
| `PlayerState` | `[player, game, authority]` | Proximité, direction, attempts, alive | Public |
| `PlayerGuess` | `[guess, game, authority]` | Historique des guesses du round en cours | **Privé** (Permission Program → owner only) |
| `Vault` | `[vault, game]` | Pot SOL, deposits, payout status | Public |
| `Leaderboard` | `[leaderboard, game]` | Classement trié par attempts + tiebreak slots | Public |
| `RoundReveal` | `[reveal, game]` | Targets révélés, résumé par joueur par round | Public après round |

**Instructions** :

| Instruction | Quand | Signé par | Où |
|---|---|---|---|
| `init_game` | Création du lobby | Creator | L1 |
| `spawn_player` | Join + deposit bet | Player | L1 |
| `create_player_permission` | **Avant** delegate_player | Player | L1 (CPI Group + Permission via `magicblock-permission-client`) |
| `create_round_secret_permission` | **Avant** delegate_game | Creator | L1 (idem, group avec members vide) |
| `delegate_game` | Après init + permissions | Creator | L1 → PER (game_config + vault + round_secret) |
| `delegate_meta` | Après init | Creator | L1 → PER (leaderboard + round_reveal) |
| `delegate_player` | Après spawn + permission | Player | L1 → PER (player_state + player_guess) |
| `start_game` | Lobby terminé | Creator via session key | PER |
| `request_target` | Juste après start_game | Creator via session key | PER (CPI VRF) |
| `submit_guess` | Chaque tentative | Player via session key (no popup) | PER |
| `end_round` | Fin de round | Creator via session key | PER |
| `end_game` | Fin partie + payout | Creator via session key | PER → L1 (commit + undelegate) |

**Important : ordre des permissions** — Les `create_*_permission` doivent être appelées **AVANT** les `delegate_*` correspondantes. Le CPI `CreatePermission` exige que le `delegated_account` soit signer via `invoke_signed` avec les seeds de la PDA, ce qui n'est possible que tant que le compte appartient au programme number_rush (avant délégation au delegation program).

**Pattern frontend pour les TX TEE** :
- `payer` = `sessionKp.publicKey` (keypair éphémère du navigateur)
- `authority` = `wallet.publicKey` (référence — pas signer direct, validée via session_token)
- `session_token` = PDA Gum dérivée de `[session_token, target_program, sessionSigner, authority]`
- `wallet.signTransaction` n'est PAS appelé sur le PER — seul le sessionKp signe et paye

```
Flow joueur :
1. spawn_player              → popup wallet (signe + transfer bet) sur L1
2. create_player_permission  → popup wallet (group + permission CPI) sur L1
3. delegate_player           → popup wallet sur L1
4. createSession (Gum)       → popup wallet, génère sessionKp local, valide 1h
5. getAuthToken TEE          → popup signMessage pour auth RPC
6. submit_guess (et toutes ER) → 0 popup, sessionKp signe et paye
```

**Note** : `delegate_game` est splitté en 2 instructions (`delegate_game` + `delegate_meta`) car déléguer 5 accounts en une seule TX dépasse la stack limit du SBF VM.

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

**Permission Program** (`BTWAqWNBmF2TboMh3fxMJfgR16xGHYD7Kgr2dPwbRPBi`) :

Le TEE utilise le **nouveau** modèle Group + Permission, pas le modèle members-inline de l'ancien `ACLseoPoy…` (qui appartient au SDK obsolète `ephemeral_rollups_sdk::access_control` et n'est PAS reconnu par le validator TEE).

- 1 `Group` PDA (seeds `["group:", id]`) contient la liste des `members`
- 1 `Permission` PDA (seeds `["permission:", delegated_account]`) lie un compte délégué à un Group
- Plusieurs Permissions peuvent partager un même Group → mutualisation des règles
- `RoundSecret` → Group avec `members = []` (personne lit, le programme accède via instruction)
- `PlayerGuess` → Group avec `members = [player_authority]` (seul ce joueur lit via RPC)

**Pattern CPI** (vendored client `magicblock-permission-client`) :
```rust
use magicblock_permission_client::instructions::{CreateGroupCpiBuilder, CreatePermissionCpiBuilder};

// 1. Group avec les members autorisés
CreateGroupCpiBuilder::new(&permission_program)
    .group(&group_pda)
    .id(unique_id)
    .members(vec![player_authority])
    .payer(&payer)
    .system_program(&system_program)
    .invoke()?;

// 2. Permission liée au compte délégué + au group, signée par la PDA du compte
CreatePermissionCpiBuilder::new(&permission_program)
    .permission(&permission_pda)
    .delegated_account(&player_guess.to_account_info())
    .group(&group_pda)
    .payer(&payer)
    .system_program(&system_program)
    .invoke_signed(&[&[GUESS_SEED, game.as_ref(), authority.as_ref(), &[bump]]])?;
```

**TEE Endpoint & Validator (devnet)** :
- RPC : `https://devnet-tee.magicblock.app` (use `getIdentity` to verify)
- Validator pubkey : `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo` — **doit matcher** la pubkey passée à `DelegateConfig.validator` côté programme, sinon les comptes sont délégués au mauvais validator et toutes les TX TEE échouent avec "Transaction loads a writable account that cannot be written"

**Note historique** : `tee.magicblock.app` (validator `FnE6VJT5…`) était un endpoint plus ancien, instable (Cloudflare 526 SSL errors) et **sans VRF activé**. C'est `devnet-tee` qui supporte VRF.

**Delegation Program** : `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`

**GPL Session Program** : `KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5` (déployé sur devnet par MagicBlock)

**Auth côté frontend :**
```typescript
import { getAuthToken } from "@magicblock-labs/ephemeral-rollups-sdk";

const token = await getAuthToken(
  TEE_RPC_BASE,           // https://devnet-tee.magicblock.app
  wallet.publicKey,
  (msg: Uint8Array) => wallet.signMessage(msg)
);
const perConnection = new Connection(
  `${TEE_RPC_BASE}?token=${token}`,
  { wsEndpoint: `${TEE_WS_BASE}?token=${token}` }
);
```

**Visibilité sur le PER :**

| Account | Visibilité PER | Mécanisme |
|---|---|---|
| PlayerGuess (chiffre soumis) | Privé pendant le round, révélé en fin de round | Permission Program (members = [owner]) |
| RoundSecret (target VRF) | Lisible uniquement par le programme | Pas de Permission, pas de RPC read possible |
| PlayerState (chaud/froid, +/-) | Public en temps réel pour tous | Pas de permission |
| GameConfig | Public en permanence | Pas de permission |
| Leaderboard | Public en permanence | Pas de permission |
| RoundReveal | Public après fin de round | Rempli uniquement à end_round |
| Vault | Public | Pas de permission |

### VRF Magic Block

Le VRF (Verifiable Random Function) génère le nombre cible à chaque round. Il garantit que le résultat est aléatoire, vérifiable, et non manipulable — ni par les joueurs, ni par la plateforme.

**Architecture** :
- Programme VRF : `Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz`
- Identité oracle : `9irBy75QS2BN81FUgXuHcjqceJJRuc9oDkAe8TKVvvAw`
- Queue ephemeral (TEE) : `5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc` (constante `DEFAULT_EPHEMERAL_QUEUE`)

**Important : VRF doit tourner sur le TEE, pas sur L1.** Une requête VRF émise sur L1 écrit le `target_number` en clair sur L1 (snapshot public) avant qu'il puisse être protégé par le TEE — fuite immédiate. Notre `request_target` est exécuté **après** délégation, sur le PER, avec la queue ephemeral. L'oracle écoute sur le validator TEE et y livre directement le callback `vrf_callback_set_target` qui écrit dans le `RoundSecret` déjà permissionné.

Ordre obligatoire :
1. `delegate_game` → round_secret passe au validator TEE
2. `create_round_secret_permission` (avant délégation, pour que le compte naisse déjà privé)
3. `start_game` (PER) → status = Playing
4. `request_target` (PER) → CPI VRF → callback ~5s plus tard
5. Joueurs commencent à soumettre

### Session keys (Gum SessionToken)

Le TEE **refuse** le wallet utilisateur comme fee payer (`This account may not be used to pay transaction fees`). On utilise donc le pattern session key standard MagicBlock via le programme [GPL Session](https://github.com/magicblock-labs/gum-program-library) :

```
[Wallet utilisateur (Phantom)]
        │ signe UNE fois createSession sur L1
        ▼
[SessionToken PDA on L1]
   { authority, session_signer, target_program, valid_until }
        │ référence cryptographique
        ▼
[sessionKp éphémère (mémoire navigateur, perdu au refresh)]
        │ signe + paye toutes les TX TEE pour le compte du wallet
        ▼
[TEE PER] ✅
```

**Côté programme** :
- Macro `#[derive(Session)]` sur le struct Accounts
- Champ `session_token: Option<Account<'info, SessionToken>>` avec `#[session(signer = payer, authority = authority.key())]`
- Macro `#[session_auth_or(condition, error)]` sur le handler — autorise si soit `authority` est signer direct, soit le SessionToken valide est présent

**Côté frontend** :
- `Keypair.generate()` à la création de la session
- `SessionTokenManager.program.methods.createSession(true, validUntil, null)` — top_up automatique depuis l'authority si le sessionKp manque de SOL
- Pour chaque TX TEE : `tx.feePayer = sessionKp.publicKey; tx.sign(sessionKp)` (le wallet ne signe pas)
- Validité par défaut : 1h. Au refresh, on perd le sessionKp et il faut re-créer une session.

**Sécurité** : si quelqu'un vole le sessionKp, il peut faire des TX au nom du wallet **uniquement** sur notre programme `r8DW7E…` et **uniquement** pendant la durée de validité. Pas d'accès au reste du wallet.

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
| Confidentialité | Private Ephemeral Rollup (PER) + Permission Program (Group/Permission) + TEE |
| Framework on-chain | Anchor 0.32.1 + ephemeral-rollups-sdk 0.8.0 + magicblock-permission-client (vendored) + session-keys 3.0.11 |
| Endpoint TEE | `https://devnet-tee.magicblock.app` (validator `MTEWGuqx…`) |
| Program ID | `r8DW7ECLY6zhpYzYUazULHUyHCas3A2j1Ecfvzd1xRa` |
| Règlement final | Solana Devnet (commit + undelegate) |
| Commission plateforme | % prélevé sur le pot brut avant distribution |
