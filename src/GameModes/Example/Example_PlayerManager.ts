import { CorePlayer_APlayerManager } from '../../Core/Player/APlayerManager'
import { Example_GameMode } from './Example_GameMode'
import { Example_Player } from './Example_Player'
import { Core_AGameMode } from 'src/Core/AGameMode'
import { CorePlayer_APlayer } from 'src/Core/Player/APlayer'

/**
 * Example_PlayerManager
 *
 * Minimal implementation of a player manager.
 * Demonstrates:
 * - Creating Example_Player on join
 * - Routing events through CorePlayer_APlayerManager
 * - No AI, no extra logic
 */
export class Example_PlayerManager extends CorePlayer_APlayerManager {
    constructor(gameMode: Core_AGameMode) {
        super(gameMode)
    }

    createPlayer(player: mod.Player): CorePlayer_APlayer {
        return new Example_Player(player, this.gameMode)
    }
}
