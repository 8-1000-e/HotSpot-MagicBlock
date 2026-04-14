/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/number_rush.json`.
 */
export type NumberRush = {
  "address": "CMncdtg37g7aDrszRyaUUhvtU8yia9JuNVrGJxnXbmWt",
  "metadata": {
    "name": "numberRush",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "createPlayerPermission",
      "discriminator": [
        166,
        251,
        27,
        79,
        162,
        158,
        149,
        149
      ],
      "accounts": [
        {
          "name": "gameConfig"
        },
        {
          "name": "playerAuthority"
        },
        {
          "name": "playerGuess",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  117,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              },
              {
                "kind": "account",
                "path": "playerAuthority"
              }
            ]
          }
        },
        {
          "name": "permission",
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "Server wallet — pays for the permission account rent"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "permissionProgram",
          "address": "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createRoundSecretPermission",
      "discriminator": [
        95,
        40,
        217,
        90,
        150,
        112,
        189,
        78
      ],
      "accounts": [
        {
          "name": "gameConfig"
        },
        {
          "name": "roundSecret",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  99,
                  114,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "permission",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "permissionProgram",
          "address": "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegateGame",
      "discriminator": [
        116,
        183,
        70,
        107,
        112,
        223,
        122,
        210
      ],
      "accounts": [
        {
          "name": "bufferGameConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                168,
                195,
                191,
                174,
                95,
                81,
                47,
                195,
                3,
                233,
                42,
                72,
                100,
                221,
                80,
                146,
                192,
                150,
                62,
                184,
                212,
                106,
                168,
                138,
                245,
                182,
                100,
                147,
                44,
                69,
                34,
                133
              ]
            }
          }
        },
        {
          "name": "delegationRecordGameConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataGameConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "bufferVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                168,
                195,
                191,
                174,
                95,
                81,
                47,
                195,
                3,
                233,
                42,
                72,
                100,
                221,
                80,
                146,
                192,
                150,
                62,
                184,
                212,
                106,
                168,
                138,
                245,
                182,
                100,
                147,
                44,
                69,
                34,
                133
              ]
            }
          }
        },
        {
          "name": "delegationRecordVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "bufferRoundSecret",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "roundSecret"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                168,
                195,
                191,
                174,
                95,
                81,
                47,
                195,
                3,
                233,
                42,
                72,
                100,
                221,
                80,
                146,
                192,
                150,
                62,
                184,
                212,
                106,
                168,
                138,
                245,
                182,
                100,
                147,
                44,
                69,
                34,
                133
              ]
            }
          }
        },
        {
          "name": "delegationRecordRoundSecret",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "roundSecret"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataRoundSecret",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "roundSecret"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "roundSecret",
          "writable": true
        },
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "ownerProgram",
          "address": "CMncdtg37g7aDrszRyaUUhvtU8yia9JuNVrGJxnXbmWt"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegateMeta",
      "discriminator": [
        252,
        185,
        232,
        131,
        23,
        51,
        35,
        8
      ],
      "accounts": [
        {
          "name": "gameConfig"
        },
        {
          "name": "bufferLeaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "leaderboard"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                168,
                195,
                191,
                174,
                95,
                81,
                47,
                195,
                3,
                233,
                42,
                72,
                100,
                221,
                80,
                146,
                192,
                150,
                62,
                184,
                212,
                106,
                168,
                138,
                245,
                182,
                100,
                147,
                44,
                69,
                34,
                133
              ]
            }
          }
        },
        {
          "name": "delegationRecordLeaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "leaderboard"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataLeaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "leaderboard"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "leaderboard",
          "writable": true
        },
        {
          "name": "bufferRoundReveal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "roundReveal"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                168,
                195,
                191,
                174,
                95,
                81,
                47,
                195,
                3,
                233,
                42,
                72,
                100,
                221,
                80,
                146,
                192,
                150,
                62,
                184,
                212,
                106,
                168,
                138,
                245,
                182,
                100,
                147,
                44,
                69,
                34,
                133
              ]
            }
          }
        },
        {
          "name": "delegationRecordRoundReveal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "roundReveal"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataRoundReveal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "roundReveal"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "roundReveal",
          "writable": true
        },
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "ownerProgram",
          "address": "CMncdtg37g7aDrszRyaUUhvtU8yia9JuNVrGJxnXbmWt"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "delegatePlayer",
      "discriminator": [
        235,
        159,
        245,
        102,
        161,
        199,
        254,
        89
      ],
      "accounts": [
        {
          "name": "gameConfig"
        },
        {
          "name": "playerAuthority"
        },
        {
          "name": "bufferPlayerState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "playerState"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                168,
                195,
                191,
                174,
                95,
                81,
                47,
                195,
                3,
                233,
                42,
                72,
                100,
                221,
                80,
                146,
                192,
                150,
                62,
                184,
                212,
                106,
                168,
                138,
                245,
                182,
                100,
                147,
                44,
                69,
                34,
                133
              ]
            }
          }
        },
        {
          "name": "delegationRecordPlayerState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "playerState"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataPlayerState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "playerState"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "playerState",
          "writable": true
        },
        {
          "name": "bufferPlayerGuess",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "playerGuess"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                168,
                195,
                191,
                174,
                95,
                81,
                47,
                195,
                3,
                233,
                42,
                72,
                100,
                221,
                80,
                146,
                192,
                150,
                62,
                184,
                212,
                106,
                168,
                138,
                245,
                182,
                100,
                147,
                44,
                69,
                34,
                133
              ]
            }
          }
        },
        {
          "name": "delegationRecordPlayerGuess",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "playerGuess"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataPlayerGuess",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "playerGuess"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "playerGuess",
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "Server wallet — pays for delegation"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "ownerProgram",
          "address": "CMncdtg37g7aDrszRyaUUhvtU8yia9JuNVrGJxnXbmWt"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "endGame",
      "discriminator": [
        224,
        135,
        245,
        99,
        67,
        175,
        121,
        252
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "leaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  100,
                  101,
                  114,
                  98,
                  111,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "authority",
          "docs": [
            "Creator of the game — receives platform fee, must match game_config.authority"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "endRound",
      "discriminator": [
        54,
        47,
        1,
        200,
        250,
        6,
        144,
        63
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "leaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  100,
                  101,
                  114,
                  98,
                  111,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "roundReveal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "roundSecret",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  99,
                  114,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initGame",
      "discriminator": [
        251,
        46,
        12,
        208,
        184,
        148,
        157,
        73
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "leaderboard",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  101,
                  97,
                  100,
                  101,
                  114,
                  98,
                  111,
                  97,
                  114,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "roundReveal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  118,
                  101,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "roundSecret",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  99,
                  114,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        },
        {
          "name": "betAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "requestTarget",
      "discriminator": [
        223,
        55,
        184,
        56,
        205,
        83,
        40,
        40
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "roundSecret",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  99,
                  114,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "oracleQueue",
          "writable": true,
          "address": "5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc"
        },
        {
          "name": "programIdentity",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  105,
                  100,
                  101,
                  110,
                  116,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "vrfProgram",
          "address": "Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz"
        },
        {
          "name": "slotHashes",
          "address": "SysvarS1otHashes111111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "spawnPlayer",
      "discriminator": [
        128,
        8,
        217,
        15,
        73,
        1,
        73,
        51
      ],
      "accounts": [
        {
          "name": "playerState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "playerGuess",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  117,
                  101,
                  115,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "player",
          "docs": [
            "The player joining the game — pays only the bet, signs to authorize"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "payer",
          "docs": [
            "Server wallet — pays for PDA rent (player_state + player_guess)"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "startGame",
      "discriminator": [
        249,
        47,
        252,
        172,
        184,
        162,
        245,
        14
      ],
      "accounts": [
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "vault",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "submitGuess",
      "discriminator": [
        61,
        124,
        32,
        227,
        64,
        198,
        252,
        3
      ],
      "accounts": [
        {
          "name": "playerState",
          "writable": true
        },
        {
          "name": "playerGuess",
          "writable": true
        },
        {
          "name": "gameConfig",
          "writable": true
        },
        {
          "name": "roundSecret",
          "docs": [
            "Program reads target from here — players can't read via RPC (permission: members=[])"
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  99,
                  114,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "gameConfig"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "playerState",
            "playerGuess"
          ]
        }
      ],
      "args": [
        {
          "name": "guess",
          "type": "u16"
        }
      ]
    },
    {
      "name": "vrfCallbackSetTarget",
      "discriminator": [
        218,
        164,
        25,
        159,
        81,
        248,
        192,
        95
      ],
      "accounts": [
        {
          "name": "vrfProgramIdentity",
          "docs": [
            "VRF program identity — only the Ephemeral VRF program can sign here."
          ],
          "signer": true,
          "address": "9irBy75QS2BN81FUgXuHcjqceJJRuc9oDkAe8TKVvvAw"
        },
        {
          "name": "roundSecret",
          "docs": [
            "The RoundSecret PDA. Owned by THIS program → direct mutation OK."
          ],
          "writable": true
        }
      ],
      "args": [
        {
          "name": "randomness",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gameConfig",
      "discriminator": [
        45,
        146,
        146,
        33,
        170,
        69,
        96,
        133
      ]
    },
    {
      "name": "leaderboard",
      "discriminator": [
        247,
        186,
        238,
        243,
        194,
        30,
        9,
        36
      ]
    },
    {
      "name": "playerGuess",
      "discriminator": [
        241,
        237,
        140,
        80,
        155,
        21,
        242,
        228
      ]
    },
    {
      "name": "playerState",
      "discriminator": [
        56,
        3,
        60,
        86,
        174,
        16,
        244,
        195
      ]
    },
    {
      "name": "roundReveal",
      "discriminator": [
        132,
        43,
        180,
        66,
        165,
        70,
        192,
        109
      ]
    },
    {
      "name": "roundSecret",
      "discriminator": [
        81,
        230,
        76,
        166,
        69,
        99,
        137,
        216
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "gameNotWaiting",
      "msg": "Game is not in Waiting state"
    },
    {
      "code": 6001,
      "name": "gameNotPlaying",
      "msg": "Game is not in Playing state"
    },
    {
      "code": 6002,
      "name": "gameFinished",
      "msg": "Game is already finished"
    },
    {
      "code": 6003,
      "name": "tooManyPlayers",
      "msg": "Too many players"
    },
    {
      "code": 6004,
      "name": "playerEliminated",
      "msg": "Player is eliminated"
    },
    {
      "code": 6005,
      "name": "alreadyFound",
      "msg": "Player already found the number this round"
    },
    {
      "code": 6006,
      "name": "guessOutOfRange",
      "msg": "Guess out of range (0-1000)"
    },
    {
      "code": 6007,
      "name": "maxAttemptsReached",
      "msg": "Max attempts reached for this round"
    },
    {
      "code": 6008,
      "name": "timerExpired",
      "msg": "Timer expired for this attempt"
    },
    {
      "code": 6009,
      "name": "roundNotOver",
      "msg": "Round is not over yet"
    },
    {
      "code": 6010,
      "name": "allRoundsCompleted",
      "msg": "All rounds completed"
    },
    {
      "code": 6011,
      "name": "lobbyNotOver",
      "msg": "Lobby not over yet"
    },
    {
      "code": 6012,
      "name": "notEnoughPlayers",
      "msg": "Not enough players"
    },
    {
      "code": 6013,
      "name": "alreadyDistributed",
      "msg": "Payout already distributed"
    },
    {
      "code": 6014,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6015,
      "name": "invalidBetAmount",
      "msg": "Invalid bet amount (must be > 0)"
    },
    {
      "code": 6016,
      "name": "invalidGameStatus",
      "msg": "Game is not in the expected status"
    },
    {
      "code": 6017,
      "name": "maxPlayersReached",
      "msg": "Max players reached for this game"
    }
  ],
  "types": [
    {
      "name": "direction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "none"
          },
          {
            "name": "higher"
          },
          {
            "name": "lower"
          }
        ]
      }
    },
    {
      "name": "gameConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "gameStatus"
              }
            }
          },
          {
            "name": "activePlayers",
            "type": "u8"
          },
          {
            "name": "currentRound",
            "type": "u8"
          },
          {
            "name": "roundStartSlot",
            "type": "u64"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "lobbyEnd",
            "type": "i64"
          },
          {
            "name": "betAmount",
            "docs": [
              "Bet amount in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "authority",
            "docs": [
              "Creator of the game"
            ],
            "type": "pubkey"
          },
          {
            "name": "players",
            "docs": [
              "Player state PDAs registry (max 10)"
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                10
              ]
            }
          },
          {
            "name": "playerCount",
            "type": "u8"
          },
          {
            "name": "roundFoundCount",
            "docs": [
              "Number of players who found the number this round"
            ],
            "type": "u8"
          },
          {
            "name": "eliminatedCount",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gameStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "waiting"
          },
          {
            "name": "playing"
          },
          {
            "name": "finished"
          }
        ]
      }
    },
    {
      "name": "leaderboard",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "entries",
            "docs": [
              "Player pubkeys sorted by rank (index 0 = best)"
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                10
              ]
            }
          },
          {
            "name": "attempts",
            "docs": [
              "Total attempts per player (parallel array)"
            ],
            "type": {
              "array": [
                "u16",
                10
              ]
            }
          },
          {
            "name": "times",
            "docs": [
              "Total time per player in ms (tiebreaker)"
            ],
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "count",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerGuess",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "guesses",
            "type": {
              "array": [
                "u16",
                15
              ]
            }
          },
          {
            "name": "count",
            "type": "u8"
          },
          {
            "name": "lastGuessSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "playerState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "alive",
            "type": "bool"
          },
          {
            "name": "proximity",
            "docs": [
              "Proximity level (0-6)"
            ],
            "type": "u8"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "direction"
              }
            }
          },
          {
            "name": "roundAttempts",
            "type": "u8"
          },
          {
            "name": "totalAttempts",
            "docs": [
              "Total attempts across all rounds (scoring)"
            ],
            "type": "u16"
          },
          {
            "name": "foundThisRound",
            "type": "bool"
          },
          {
            "name": "totalTimeSlot",
            "docs": [
              "Total time in ms to find numbers (tiebreaker)"
            ],
            "type": "u64"
          },
          {
            "name": "inactiveRounds",
            "docs": [
              "Consecutive rounds without submission (>= 3 = eliminated)"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "roundReveal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "targets",
            "docs": [
              "Target numbers revealed after each round"
            ],
            "type": {
              "array": [
                "u16",
                5
              ]
            }
          },
          {
            "name": "playerAttempts",
            "docs": [
              "Attempts per player per round"
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    10
                  ]
                },
                5
              ]
            }
          },
          {
            "name": "playerFound",
            "docs": [
              "Whether player found the number per round"
            ],
            "type": {
              "array": [
                {
                  "array": [
                    "bool",
                    10
                  ]
                },
                5
              ]
            }
          },
          {
            "name": "lastRevealedRound",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "roundSecret",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "targetNumber",
            "docs": [
              "VRF-generated target number (0-1000)"
            ],
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "game",
            "type": "pubkey"
          },
          {
            "name": "totalPot",
            "type": "u64"
          },
          {
            "name": "depositsCount",
            "type": "u8"
          },
          {
            "name": "payoutStatus",
            "docs": [
              "0 = Pending, 1 = Distributed"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
