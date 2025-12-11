import { Core_AGameMode } from '../AGameMode'
import { CorePlayer_IPlayerEvents } from './IPlayerEvents'

/**
 * CorePlayer_APlayer
 *
 * Logical wrapper around mod.Player. Provides event subscription capabilities
 * and a stable place to store gameplay-related data. Real projects should
 * extend this class to add their own fields and event responses.
 *
 * Event subscriptions:
 * --------------------
 * APlayer instances can subscribe to logical events emitted by the
 * PlayerManager. The PlayerManager emits all player-related events under the
 * hood, so subclasses only need to call addListener.
 *
 * Example:
 * --------
 * Subclasses register to receive events by using addListener(). PlayerManager
 * emits events such as OnPlayerDamaged, OnPlayerDied, etc, after processing
 * raw engine events. A logical player reacts to them here.
 *
 *     class MyPlayer extends CorePlayer_APlayer {
 *         constructor(player: mod.Player, gameMode: Core_AGameMode) {
 *             super(player, gameMode)
 *
 *             this.addListener({
 *                 OnPlayerDamaged: (
 *                     eventOtherPlayer,
 *                     eventDamageType,
 *                     eventWeaponUnlock
 *                 ) => {
 *                     const selfId = mod.GetObjId(this.player)
 *                     const otherId = eventOtherPlayer
 *                         ? mod.GetObjId(eventOtherPlayer.player)
 *                         : null
 *
 *                     console.log("damaged:", selfId, "by:", otherId)
 *                 },
 *
 *                 OnPlayerDeployed: () => {
 *                     console.log("player deployed:", mod.GetObjId(this.player))
 *                 },
 *             })
 *         }
 *     }
 *
 * Summary:
 * --------
 * APlayer represents the logical player. It does not emit events; it only
 * subscribes to them. All player events originate from PlayerManager.
 */

export abstract class CorePlayer_APlayer {
    player: mod.Player
    gameMode: Core_AGameMode

    listeners: CorePlayer_IPlayerEvents[] = []

    constructor(player: mod.Player, gameMode: Core_AGameMode) {
        this.player = player
        this.gameMode = gameMode
    }

    addListener(listener: CorePlayer_IPlayerEvents): void {
        this.listeners.push(listener)
    }

    removeListener(listener: CorePlayer_IPlayerEvents): void {
        this.listeners = this.listeners.filter((l) => l !== listener)
    }

    emit<E extends keyof CorePlayer_IPlayerEvents>(
        event: E,
        ...args: Parameters<NonNullable<CorePlayer_IPlayerEvents[E]>>
    ): void {
        for (const listener of this.listeners) {
            const fn = listener[event]
            if (typeof fn === 'function') {
                ;(fn as (...a: any[]) => void)(...args)
            }
        }
    }
}
