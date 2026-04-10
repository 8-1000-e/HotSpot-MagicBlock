# Number Rush — Documentation complète du projet

---

## Présentation du projet

Number Rush est un jeu multijoueur on-chain déployé sur Solana via Magic Block. Le concept est simple : un nombre secret est généré aléatoirement, et les joueurs s'affrontent pour le trouver le plus vite possible, en un minimum de tentatives. Chaque partie implique une mise en SOL, et le pot est redistribué en fin de partie selon les performances de chaque joueur.

L'ensemble de la logique de jeu tourne sur un ephemeral rollup privé fourni par Magic Block, ce qui garantit des transactions ultra-rapides, la confidentialité des chiffres soumis en temps réel, et un règlement final transparent et vérifiable sur la blockchain Solana.

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
2. Ce nombre est commité on-chain sur l'ephemeral rollup privé avant l'ouverture des soumissions. Aucun joueur, ni même la plateforme, ne peut modifier ce nombre après ce point.
3. La première manche commence.

### Déroulement d'un round

Chaque partie se joue sur 5 rounds. Pour chaque round :

**Phase de soumission (5 secondes par tentative)**

- Tous les joueurs soumettent simultanément un nombre entre 0 et 1000.
- Chaque joueur a 5 secondes pour envoyer son chiffre. Passé ce délai, la tentative du joueur est ignorée pour ce tour (elle compte quand même comme un coup utilisé).
- Les chiffres soumis transitent sur l'ephemeral rollup privé et ne sont pas visibles par les autres joueurs en temps réel.

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

Les adversaires voient pour chaque joueur l'état de proximité (chaud, froid, etc.) et la direction (+/-), mais pas le chiffre exact soumis. Cette asymétrie d'information est le cœur de la dimension stratégique du jeu.

**Fin de round**

Un round se termine lorsque tous les joueurs actifs ont trouvé le nombre, ou lorsqu'une limite de tentatives est atteinte (voir section anti-blocage). À la fin de chaque round, les chiffres soumis par tous les joueurs sont révélés à tout le monde. Le nombre cible est également révélé.

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
                    ▼
         [Magic Block Ephemeral Rollup Privé]
                    │
         ┌──────────┴──────────┐
         │   BOLT ECS Engine   │
         │                     │
         │  Entities :         │
         │  - GameSession      │
         │  - Player           │
         │                     │
         │  Components :       │
         │  - PlayerGuess      │  ← Privé
         │  - PlayerState      │  ← Exposé au frontend
         │  - PlayerRegistry   │  ← Public (sur l'entité GameSession)
         │  - RoundData        │  ← Révélé en fin de round
         │  - Leaderboard      │  ← Public
         │                     │
         │  Systems :          │
         │  - GuessProcessor   │
         │  - StateUpdater     │
         │  - RoundManager     │
         │  - LeaderboardSync  │
         └─────────────────────┘
                    │
                    ▼
         [Settlement Solana Devnet]
         (distribution du pot, fin de partie)
```

### BOLT ECS — pourquoi c'est le bon choix

BOLT est un framework Entity Component System (ECS) natif Solana, conçu pour les jeux on-chain. Il est nativement compatible avec les ephemeral rollups Magic Block.

**Entity** : une session de jeu est une entité. Chaque joueur est une entité.

**Component** : les données attachées à une entité. Exemples dans Number Rush :
- `PlayerGuess` : le chiffre soumis par le joueur au tour actuel (privé)
- `PlayerState` : l'état de proximité calculé (chaud/froid, +/-) visible par tous
- `PlayerRegistry` : registre centralisé de tous les joueurs actifs, attaché à l'entité GameSession (public)
- `RoundReveal` : les chiffres de tous les joueurs, déverrouillés en fin de round
- `Leaderboard` : le classement global, mis à jour après chaque round

**System** : la logique qui transforme les composants. Exemples :
- `GuessProcessor` : reçoit un chiffre soumis, le compare au nombre cible, calcule l'état
- `RoundManager` : gère les timers, détecte la fin d'un round, déclenche le reveal
- `LeaderboardSync` : met à jour et trie le classement à chaque fin de round

ECS est particulièrement adapté ici car l'état du jeu évolue très vite (5 secondes par coup) avec plusieurs entités en parallèle. La séparation données/logique propre à ECS facilite aussi les audits de sécurité.

### PlayerRegistry — registre centralisé des joueurs

Le `PlayerRegistry` est un component BOLT attaché à l'entité GameSession (pas aux entités joueurs individuelles). Il sert de registre centralisé pour tracker tous les joueurs actifs dans une partie. Ce pattern est utilisé dans tous les jeux TNTX multijoueurs (CUBE3D, red-light, Number Rush).

**Structure du component :**

```rust
use bolt_lang::*;

pub const MAX_PLAYERS: usize = 10;

#[component(delegate)]
pub struct PlayerRegistry {
    pub players: [[u8; 32]; MAX_PLAYERS],        // PDAs Position des joueurs (raw bytes)
    pub player_states: [[u8; 32]; MAX_PLAYERS],   // PDAs PlayerState des joueurs (raw bytes)
    pub count: u8,                                 // Nombre de joueurs enregistrés
}
```

**Pourquoi `[u8; 32]` et pas `Pubkey` ?**
Le trait `Default` n'est pas implémenté pour les tableaux de `Pubkey` en Rust. On stocke donc les pubkeys en raw bytes (`[u8; 32]`) et on les convertit via `Pubkey::new_from_array()` côté lecture.

**Méthode `add_player` :**

```rust
impl PlayerRegistry {
    pub fn add_player(&mut self, pubkey: Pubkey, player_state_pda: Pubkey) -> Result<()> {
        require!(self.count < MAX_PLAYERS as u8, RegistryError::RegistryFull);
        self.players[self.count as usize] = pubkey.to_bytes();
        self.player_states[self.count as usize] = player_state_pda.to_bytes();
        self.count += 1;
        Ok(())
    }
}
```

**Rôle dans le flow de jeu :**

1. **Création de la partie** : Le `PlayerRegistry` est initialisé sur l'entité GameSession avec `count = 0`.
2. **Join d'un joueur** : Le system `SpawnPlayer` appelle `add_player()` pour enregistrer le PDA Position et le PDA PlayerState du nouveau joueur.
3. **Discovery côté frontend** : Le client souscrit au PDA du `PlayerRegistry` via WebSocket. À chaque changement (nouveau joueur), il parse les nouveaux PDAs et crée automatiquement des souscriptions pour chaque `PlayerState`.
4. **Delegation** : Le component est marqué `#[component(delegate)]`, ce qui permet sa délégation vers l'ephemeral rollup. Les mises à jour sont donc instantanées sur le ER.

**Parsing côté frontend :**

```typescript
function parsePlayerRegistry(data: Buffer) {
  const offset = 8; // skip discriminator BOLT
  // players: 10 * 32 bytes = 320 bytes (offset 8 → 328)
  // player_states: 10 * 32 bytes = 320 bytes (offset 328 → 648)
  // count: 1 byte (offset 648)
  const count = data.readUInt8(offset + 320 + 320);

  const playerStates: PublicKey[] = [];
  for (let i = 0; i < count; i++) {
    const start = offset + 320 + i * 32;
    const bytes = data.slice(start, start + 32);
    playerStates.push(new PublicKey(bytes));
  }
  return { count, playerStates };
}
```

**Flow WebSocket :**

```
Frontend subscribe au PlayerRegistry PDA (sur l'entité GameSession)
  │
  ▼ onAccountChange détecte count++ (nouveau joueur)
  │
  ▼ Parse le nouveau PlayerState PDA depuis player_states[count-1]
  │
  ▼ Crée une souscription WebSocket sur ce PlayerState PDA
  │
  ▼ Reçoit les updates en temps réel (proximité, direction, tentatives)
```

Ce pattern évite au frontend de devoir connaître à l'avance les PDAs de tous les joueurs. Il suffit de surveiller un seul account (le registre) pour découvrir dynamiquement tous les participants.

### Private Ephemeral Rollup — ce que "privé" signifie vraiment

L'ephemeral rollup de Magic Block est un environnement d'exécution temporaire délégué depuis Solana. Il traite les transactions à très haute vitesse sans les publier immédiatement on-chain.

**"Privé" ne veut pas dire que rien n'est visible.** Cela signifie que les transactions de l'ephemeral rollup ne sont pas lisibles publiquement sur la chaîne principale pendant la session.

En pratique :
- Le serveur de jeu (autorité du rollup) a accès à tout l'état.
- Tu contrôles ce que tu exposes côté client via ton API.
- Tu peux très bien afficher des données issues du rollup — tu décides lesquelles.

Pour Number Rush, la séparation est la suivante :

| Composant | Visibilité |
|---|---|
| PlayerGuess (chiffre soumis) | Privé pendant le round, révélé en fin de round |
| PlayerState (chaud/froid, +/-) | Public en temps réel pour tous |
| PlayerRegistry | Public en permanence (discovery des joueurs) |
| RoundReveal | Public uniquement après la fin du round |
| Leaderboard | Public en permanence |

### VRF Magic Block

Le VRF (Verifiable Random Function) est utilisé pour générer le nombre cible à chaque round. Il garantit que le résultat est aléatoire, vérifiable, et non manipulable — ni par les joueurs, ni par la plateforme.

Règle importante : le VRF est appelé et son résultat est commité on-chain AVANT l'ouverture des soumissions des joueurs. Cette séquence est obligatoire pour garantir la fairness. Si le nombre était généré après les premières soumissions, un vecteur de manipulation existerait.

### Settlement Solana Devnet

À la fin de la partie, l'ephemeral rollup se ferme et le résultat final (leaderboard, distribution du pot) est réglé sur Solana Devnet. Ce mécanisme garantit que la distribution des fonds est transparente et auditée publiquement, même si la partie elle-même s'est déroulée sur le rollup privé.

---

## Sécurité et fairness

**Impossibilité de voir les chiffres des adversaires en temps réel**
Les soumissions transitent sur le rollup privé. Aucune transaction publique ne révèle le chiffre avant la fin du round. Un joueur ne peut pas intercepter les chiffres adverses en lisant la blockchain.

**Impossibilité de manipuler le nombre cible**
Le nombre cible est généré via VRF et commité avant les soumissions. Il est immuable une fois la manche lancée.

**Fonds verrouillés dès le départ**
Les mises sont envoyées dans un smart contract au moment du lobby. Ni la plateforme ni les joueurs ne peuvent y accéder pendant la partie. La distribution se fait automatiquement à la fin, selon les règles encodées dans le contrat.

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
| Confidentialité | Ephemeral rollup privé, reveal en fin de round |
| Framework on-chain | BOLT ECS sur Magic Block |
| Règlement final | Solana Devnet |
| Commission plateforme | % prélevé sur le pot brut avant distribution |
