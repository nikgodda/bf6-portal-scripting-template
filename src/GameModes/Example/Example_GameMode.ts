import { CorePlayer_APlayerManager } from 'src/Core/Player/APlayerManager'
import { Core_AGameMode } from '../../Core/AGameMode'
import { Example_PlayerManager } from './Example_PlayerManager'
import { Example_FooClass } from './Foo/FooClass'

/**
 * Example_GameMode
 *
 * Minimal game mode that uses Example_PlayerManager and Example_Player.
 * This class demonstrates how to:
 * - Initialize a custom player manager
 * - React to basic events
 * - Use the lp() and lpId() helpers from Core_AGameMode
 */
export class Example_GameMode extends Core_AGameMode {
    protected declare playerManager: Example_PlayerManager

    protected createPlayerManager(): CorePlayer_APlayerManager {
        // here we are inside TDM, so using TDM_PlayerManager is fine
        return new Example_PlayerManager(this)
    }

    protected override OnGameModeStarted(): void {
        console.log('Example game mode started!')

        mod.DisplayHighlightedWorldLogMessage(
            mod.Message(`debug.gamemode.started`)
        )

        // Foo class to demostrate throttled OngoingGlobal event
        const foo: Example_FooClass = new Example_FooClass(this)
    }
}
