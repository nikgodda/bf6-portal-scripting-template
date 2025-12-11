import { Core_AGameMode } from 'src/Core/AGameMode'
import { CorePlayer_APlayer } from '../../Core/Player/APlayer'

/**
 * Example_Player
 *
 * Minimal logical player class.
 * Stores no custom data, only demonstrates event subscription.
 */
export class Example_Player extends CorePlayer_APlayer {
    constructor(player: mod.Player, gamemode: Core_AGameMode) {
        super(player, gamemode)

        this.addListener({
            OnPlayerDeployed: () => {
                console.log(
                    'Example player deployed: ' + mod.GetObjId(this.player)
                )
                mod.DisplayHighlightedWorldLogMessage(
                    mod.Message(
                        `debug.player.deployed`,
                        mod.GetObjId(this.player)
                    )
                )
            },

            OnPlayerDied: (
                eventOtherPlayer,
                eventDeathType,
                eventWeaponUnlock
            ) => {
                console.log('Example player died: ' + mod.GetObjId(this.player))

                mod.DisplayHighlightedWorldLogMessage(
                    mod.Message(`debug.player.died`, mod.GetObjId(this.player))
                )
            },
        })
    }
}
