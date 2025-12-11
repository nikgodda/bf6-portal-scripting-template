import { CorePlayer_APlayer } from './APlayer'
import { Core_AGameMode } from '../AGameMode'

/**
 * CorePlayer_APlayerManager
 *
 * Manages logical players (APlayer) and dispatches ALL player-related events.
 * Converts raw engine mod.Player events into high-level logical events.
 *
 * Lifecycle:
 *   Engine Event -> GameMode._internal -> PlayerManager -> APlayer.emit
 *
 * APlayer subclasses never call emit; they only subscribe to events.
 */

export abstract class CorePlayer_APlayerManager {
    protected players = new Map<number, CorePlayer_APlayer>()
    protected gameMode: Core_AGameMode

    constructor(gameMode: Core_AGameMode) {
        this.gameMode = gameMode
    }

    abstract createPlayer(player: mod.Player): CorePlayer_APlayer

    addPlayer(player: mod.Player): CorePlayer_APlayer {
        const id = mod.GetObjId(player)
        let lp = this.players.get(id)

        if (!lp) {
            lp = this.createPlayer(player)
            this.players.set(id, lp)

            // Notify other players that someone joined
            for (const other of this.players.values()) {
                if (other !== lp) {
                    other.emit('OnPlayerJoinGame', lp)
                }
            }
        }
        return lp
    }

    removePlayer(playerId: number): void {
        const lp = this.players.get(playerId)

        if (lp) {
            lp.listeners = []
        }

        this.players.delete(playerId)
    }

    get(player: mod.Player): CorePlayer_APlayer | undefined {
        if (!mod.IsPlayerValid(player)) return undefined
        const id = mod.GetObjId(player)
        return this.players.get(id)
    }

    getById(id: number): CorePlayer_APlayer | undefined {
        return this.players.get(id)
    }

    allPlayers(): CorePlayer_APlayer[] {
        return [...this.players.values()]
    }

    /* ------------------------------------------------------------
     * Ongoing
     * ------------------------------------------------------------ */

    tick(eventPlayer: mod.Player): void {
        const lp = this.get(eventPlayer)
        lp?.emit('OngoingPlayer')
    }

    /* ------------------------------------------------------------
     * Lifecycle
     * ------------------------------------------------------------ */

    OnPlayerDeployed(lp: CorePlayer_APlayer): void {
        lp.emit('OnPlayerDeployed')
    }

    OnPlayerDied(
        lp: CorePlayer_APlayer,
        other: CorePlayer_APlayer | undefined,
        eventDeathType: mod.DeathType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void {
        lp.emit('OnPlayerDied', other, eventDeathType, eventWeaponUnlock)
    }

    OnPlayerUndeploy(lp: CorePlayer_APlayer): void {
        lp.emit('OnPlayerUndeploy')
    }

    /* ------------------------------------------------------------
     * Damage / kills
     * ------------------------------------------------------------ */

    OnPlayerDamaged(
        lp: CorePlayer_APlayer,
        other: CorePlayer_APlayer | undefined,
        eventDamageType: mod.DamageType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void {
        lp.emit('OnPlayerDamaged', other, eventDamageType, eventWeaponUnlock)
    }

    OnPlayerEarnedKill(
        lp: CorePlayer_APlayer,
        other: CorePlayer_APlayer | undefined,
        eventDeathType: mod.DeathType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void {
        lp.emit('OnPlayerEarnedKill', other, eventDeathType, eventWeaponUnlock)
    }

    OnPlayerEarnedKillAssist(
        lp: CorePlayer_APlayer,
        other: CorePlayer_APlayer | undefined
    ): void {
        lp.emit('OnPlayerEarnedKillAssist', other)
    }

    OnMandown(
        lp: CorePlayer_APlayer,
        other: CorePlayer_APlayer | undefined
    ): void {
        lp.emit('OnMandown', other)
    }

    OnRevived(
        lp: CorePlayer_APlayer,
        other: CorePlayer_APlayer | undefined
    ): void {
        lp.emit('OnRevived', other)
    }

    /* ------------------------------------------------------------
     * Interaction & triggers
     * ------------------------------------------------------------ */

    OnPlayerInteract(
        lp: CorePlayer_APlayer,
        eventInteractPoint: mod.InteractPoint
    ): void {
        lp.emit('OnPlayerInteract', eventInteractPoint)
    }

    OnPlayerEnterAreaTrigger(
        lp: CorePlayer_APlayer,
        eventAreaTrigger: mod.AreaTrigger
    ): void {
        lp.emit('OnPlayerEnterAreaTrigger', eventAreaTrigger)
    }

    OnPlayerExitAreaTrigger(
        lp: CorePlayer_APlayer,
        eventAreaTrigger: mod.AreaTrigger
    ): void {
        lp.emit('OnPlayerExitAreaTrigger', eventAreaTrigger)
    }

    OnPlayerEnterCapturePoint(
        lp: CorePlayer_APlayer,
        eventCapturePoint: mod.CapturePoint
    ): void {
        lp.emit('OnPlayerEnterCapturePoint', eventCapturePoint)
    }

    OnPlayerExitCapturePoint(
        lp: CorePlayer_APlayer,
        eventCapturePoint: mod.CapturePoint
    ): void {
        lp.emit('OnPlayerExitCapturePoint', eventCapturePoint)
    }

    /* ------------------------------------------------------------
     * Vehicles
     * ------------------------------------------------------------ */

    OnPlayerEnterVehicle(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle
    ): void {
        lp.emit('OnPlayerEnterVehicle', eventVehicle)
    }

    OnPlayerExitVehicle(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle
    ): void {
        lp.emit('OnPlayerExitVehicle', eventVehicle)
    }

    OnPlayerEnterVehicleSeat(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle,
        eventSeat: mod.Object
    ): void {
        lp.emit('OnPlayerEnterVehicleSeat', eventVehicle, eventSeat)
    }

    OnPlayerExitVehicleSeat(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle,
        eventSeat: mod.Object
    ): void {
        lp.emit('OnPlayerExitVehicleSeat', eventVehicle, eventSeat)
    }

    /* ------------------------------------------------------------
     * Team / UI
     * ------------------------------------------------------------ */

    OnPlayerSwitchTeam(lp: CorePlayer_APlayer, eventTeam: mod.Team): void {
        lp.emit('OnPlayerSwitchTeam', eventTeam)
    }

    OnPlayerUIButtonEvent(
        lp: CorePlayer_APlayer,
        eventUIWidget: mod.UIWidget,
        eventUIButtonEvent: mod.UIButtonEvent
    ): void {
        lp.emit('OnPlayerUIButtonEvent', eventUIWidget, eventUIButtonEvent)
    }

    /* ------------------------------------------------------------
     * Raycast
     * ------------------------------------------------------------ */

    OnRayCastHit(
        lp: CorePlayer_APlayer,
        eventPoint: mod.Vector,
        eventNormal: mod.Vector
    ): void {
        lp.emit('OnRayCastHit', eventPoint, eventNormal)
    }

    OnRayCastMissed(lp: CorePlayer_APlayer): void {
        lp.emit('OnRayCastMissed')
    }

    /* ------------------------------------------------------------
     * Spawner
     * ------------------------------------------------------------ */

    OnSpawnerSpawned(lp: CorePlayer_APlayer, eventSpawner: mod.Spawner): void {
        lp.emit('OnSpawnerSpawned', eventSpawner)
    }

    /* ------------------------------------------------------------
     * Movement compact events
     * ------------------------------------------------------------ */

    OnAIMoveToFailed(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIMoveToFailed')
    }

    OnAIMoveToRunning(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIMoveToRunning')
    }

    OnAIMoveToSucceeded(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIMoveToSucceeded')
    }

    /* ------------------------------------------------------------
     * Parachute
     * ------------------------------------------------------------ */

    OnAIParachuteRunning(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIParachuteRunning')
    }

    OnAIParachuteSucceeded(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIParachuteSucceeded')
    }

    /* ------------------------------------------------------------
     * Waypoint idle
     * ------------------------------------------------------------ */

    OnAIWaypointIdleFailed(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIWaypointIdleFailed')
    }

    OnAIWaypointIdleRunning(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIWaypointIdleRunning')
    }

    OnAIWaypointIdleSucceeded(lp: CorePlayer_APlayer): void {
        lp.emit('OnAIWaypointIdleSucceeded')
    }
}
