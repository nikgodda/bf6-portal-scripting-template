import { CorePlayer_IGameModeEvents } from './IGameModeEvents'
import { CorePlayer_APlayer } from './Player/APlayer'
import { CorePlayer_APlayerManager } from './Player/APlayerManager'

/**
 * Core_AGameMode
 *
 * High-level game mode base class.
 *
 * - Engine calls main.ts functions (OnPlayerDamaged, OngoingGlobal, etc).
 * - main.ts forwards these to gameMode._internal.OnX(...).
 * - _internal:
 *     - Converts mod.Player to CorePlayer_APlayer via PlayerManager.
 *     - Ensures PlayerManager is created on first join.
 *     - Calls protected hook methods (OnX) for game logic.
 *
 * Always use "override" when implementing hooks, for example:
 *
 *     protected override OnGameModeStarted(): void {
 *         console.log("Game mode started")
 *     }
 */

export abstract class Core_AGameMode {
    protected playerManager!: CorePlayer_APlayerManager

    constructor() {}

    protected abstract createPlayerManager(): CorePlayer_APlayerManager

    /** Helper: map engine player to logical player, or undefined if invalid. */
    protected lp(eventPlayer: mod.Player): CorePlayer_APlayer | undefined {
        return this.playerManager.get(eventPlayer)
    }

    protected lpId(eventNumber: number): CorePlayer_APlayer | undefined {
        return this.playerManager.getById(eventNumber)
    }

    /* ------------------------------------------------------------
     * Protected hooks (to be overridden in game modes)
     * ------------------------------------------------------------ */

    // Ongoing
    protected OngoingGlobal(): void {}
    protected OngoingAreaTrigger(eventAreaTrigger: mod.AreaTrigger): void {}
    protected OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {}
    protected OngoingEmplacementSpawner(
        eventEmplacementSpawner: mod.EmplacementSpawner
    ): void {}
    protected OngoingHQ(eventHQ: mod.HQ): void {}
    protected OngoingInteractPoint(
        eventInteractPoint: mod.InteractPoint
    ): void {}
    protected OngoingLootSpawner(eventLootSpawner: mod.LootSpawner): void {}
    protected OngoingMCOM(eventMCOM: mod.MCOM): void {}
    protected OngoingPlayer(lp: CorePlayer_APlayer): void {}
    protected OngoingRingOfFire(eventRingOfFire: mod.RingOfFire): void {}
    protected OngoingSector(eventSector: mod.Sector): void {}
    protected OngoingSpawner(eventSpawner: mod.Spawner): void {}
    protected OngoingSpawnPoint(eventSpawnPoint: mod.SpawnPoint): void {}
    protected OngoingTeam(eventTeam: mod.Team): void {}
    protected OngoingVehicle(eventVehicle: mod.Vehicle): void {}
    protected OngoingVehicleSpawner(
        eventVehicleSpawner: mod.VehicleSpawner
    ): void {}
    protected OngoingWaypointPath(eventWaypointPath: mod.WaypointPath): void {}
    protected OngoingWorldIcon(eventWorldIcon: mod.WorldIcon): void {}

    // AI movement and waypoint events
    protected OnAIMoveToFailed(lp: CorePlayer_APlayer): void {}
    protected OnAIMoveToRunning(lp: CorePlayer_APlayer): void {}
    protected OnAIMoveToSucceeded(lp: CorePlayer_APlayer): void {}

    protected OnAIParachuteRunning(lp: CorePlayer_APlayer): void {}
    protected OnAIParachuteSucceeded(lp: CorePlayer_APlayer): void {}

    protected OnAIWaypointIdleFailed(lp: CorePlayer_APlayer): void {}
    protected OnAIWaypointIdleRunning(lp: CorePlayer_APlayer): void {}
    protected OnAIWaypointIdleSucceeded(lp: CorePlayer_APlayer): void {}

    // CapturePoint events
    protected OnCapturePointCaptured(
        eventCapturePoint: mod.CapturePoint
    ): void {}
    protected OnCapturePointCapturing(
        eventCapturePoint: mod.CapturePoint
    ): void {}
    protected OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {}

    // Game mode lifecycle
    protected OnGameModeEnding(): void {}
    protected OnGameModeStarted(): void {}

    // Player state events (undefined-only for "other" player)
    protected OnMandown(
        lp: CorePlayer_APlayer,
        eventOtherPlayer: CorePlayer_APlayer | undefined
    ): void {}

    protected OnPlayerDamaged(
        lp: CorePlayer_APlayer,
        eventOtherPlayer: CorePlayer_APlayer | undefined,
        eventDamageType: mod.DamageType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void {}

    protected OnPlayerDeployed(lp: CorePlayer_APlayer): void {}

    protected OnPlayerDied(
        lp: CorePlayer_APlayer,
        eventOtherPlayer: CorePlayer_APlayer | undefined,
        eventDeathType: mod.DeathType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void {}

    protected OnPlayerEarnedKill(
        lp: CorePlayer_APlayer,
        eventOtherPlayer: CorePlayer_APlayer | undefined,
        eventDeathType: mod.DeathType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void {}

    protected OnPlayerEarnedKillAssist(
        lp: CorePlayer_APlayer,
        eventOtherPlayer: CorePlayer_APlayer | undefined
    ): void {}

    protected OnRevived(
        lp: CorePlayer_APlayer,
        eventOtherPlayer: CorePlayer_APlayer | undefined
    ): void {}

    // Interaction and triggers
    protected OnPlayerInteract(
        lp: CorePlayer_APlayer,
        eventInteractPoint: mod.InteractPoint
    ): void {}

    protected OnPlayerEnterAreaTrigger(
        lp: CorePlayer_APlayer,
        eventAreaTrigger: mod.AreaTrigger
    ): void {}

    protected OnPlayerExitAreaTrigger(
        lp: CorePlayer_APlayer,
        eventAreaTrigger: mod.AreaTrigger
    ): void {}

    protected OnPlayerEnterCapturePoint(
        lp: CorePlayer_APlayer,
        eventCapturePoint: mod.CapturePoint
    ): void {}

    protected OnPlayerExitCapturePoint(
        lp: CorePlayer_APlayer,
        eventCapturePoint: mod.CapturePoint
    ): void {}

    // Vehicles
    protected OnPlayerEnterVehicle(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle
    ): void {}

    protected OnPlayerExitVehicle(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle
    ): void {}

    protected OnPlayerEnterVehicleSeat(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle,
        eventSeat: mod.Object
    ): void {}

    protected OnPlayerExitVehicleSeat(
        lp: CorePlayer_APlayer,
        eventVehicle: mod.Vehicle,
        eventSeat: mod.Object
    ): void {}

    // Team / UI
    protected OnPlayerSwitchTeam(
        lp: CorePlayer_APlayer,
        eventTeam: mod.Team
    ): void {}

    protected OnPlayerUIButtonEvent(
        lp: CorePlayer_APlayer,
        eventUIWidget: mod.UIWidget,
        eventUIButtonEvent: mod.UIButtonEvent
    ): void {}

    // Spawner / raycast / misc
    protected OnSpawnerSpawned(
        lp: CorePlayer_APlayer,
        eventSpawner: mod.Spawner
    ): void {}

    protected OnRayCastHit(
        lp: CorePlayer_APlayer,
        eventPoint: mod.Vector,
        eventNormal: mod.Vector
    ): void {}

    protected OnRayCastMissed(lp: CorePlayer_APlayer): void {}

    // Player join/leave/undeploy
    protected OnPlayerJoinGame(lp: CorePlayer_APlayer): void {}
    protected OnPlayerLeaveGame(lp: CorePlayer_APlayer): void {}
    protected OnPlayerUndeploy(lp: CorePlayer_APlayer): void {}

    // Ring of Fire / time limit / vehicles / MCOM
    protected OnRingOfFireZoneSizeChange(
        eventRingOfFire: mod.RingOfFire,
        eventNumber: number
    ): void {}

    protected OnTimeLimitReached(): void {}

    protected OnVehicleDestroyed(eventVehicle: mod.Vehicle): void {}
    protected OnVehicleSpawned(eventVehicle: mod.Vehicle): void {}

    protected OnMCOMArmed(eventMCOM: mod.MCOM): void {}
    protected OnMCOMDefused(eventMCOM: mod.MCOM): void {}
    protected OnMCOMDestroyed(eventMCOM: mod.MCOM): void {}

    /* ------------------------------------------------------------
     * Internal router: main.ts -> _internal -> PlayerManager + hooks
     * ------------------------------------------------------------ */

    public readonly _internal = {
        // Ongoing
        OngoingGlobal: (): void => {
            this.emit('OngoingGlobal')
            this.OngoingGlobal()
        },

        OngoingAreaTrigger: (eventAreaTrigger: mod.AreaTrigger): void => {
            this.OngoingAreaTrigger(eventAreaTrigger)
        },

        OngoingCapturePoint: (eventCapturePoint: mod.CapturePoint): void => {
            this.OngoingCapturePoint(eventCapturePoint)
        },

        OngoingEmplacementSpawner: (
            eventEmplacementSpawner: mod.EmplacementSpawner
        ): void => {
            this.OngoingEmplacementSpawner(eventEmplacementSpawner)
        },

        OngoingHQ: (eventHQ: mod.HQ): void => {
            this.OngoingHQ(eventHQ)
        },

        OngoingInteractPoint: (eventInteractPoint: mod.InteractPoint): void => {
            this.OngoingInteractPoint(eventInteractPoint)
        },

        OngoingLootSpawner: (eventLootSpawner: mod.LootSpawner): void => {
            this.OngoingLootSpawner(eventLootSpawner)
        },

        OngoingMCOM: (eventMCOM: mod.MCOM): void => {
            this.OngoingMCOM(eventMCOM)
        },

        OngoingPlayer: (eventPlayer: mod.Player): void => {
            if (!this.playerManager) return
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.tick(eventPlayer)
            this.OngoingPlayer(lp)
        },

        OngoingRingOfFire: (eventRingOfFire: mod.RingOfFire): void => {
            this.OngoingRingOfFire(eventRingOfFire)
        },

        OngoingSector: (eventSector: mod.Sector): void => {
            this.OngoingSector(eventSector)
        },

        OngoingSpawner: (eventSpawner: mod.Spawner): void => {
            this.OngoingSpawner(eventSpawner)
        },

        OngoingSpawnPoint: (eventSpawnPoint: mod.SpawnPoint): void => {
            this.OngoingSpawnPoint(eventSpawnPoint)
        },

        OngoingTeam: (eventTeam: mod.Team): void => {
            this.OngoingTeam(eventTeam)
        },

        OngoingVehicle: (eventVehicle: mod.Vehicle): void => {
            this.OngoingVehicle(eventVehicle)
        },

        OngoingVehicleSpawner: (
            eventVehicleSpawner: mod.VehicleSpawner
        ): void => {
            this.OngoingVehicleSpawner(eventVehicleSpawner)
        },

        OngoingWaypointPath: (eventWaypointPath: mod.WaypointPath): void => {
            this.OngoingWaypointPath(eventWaypointPath)
        },

        OngoingWorldIcon: (eventWorldIcon: mod.WorldIcon): void => {
            this.OngoingWorldIcon(eventWorldIcon)
        },

        // AI movement and waypoint events
        OnAIMoveToFailed: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIMoveToFailed(lp)
            this.OnAIMoveToFailed(lp)
        },

        OnAIMoveToRunning: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIMoveToRunning(lp)
            this.OnAIMoveToRunning(lp)
        },

        OnAIMoveToSucceeded: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIMoveToSucceeded(lp)
            this.OnAIMoveToSucceeded(lp)
        },

        OnAIParachuteRunning: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIParachuteRunning(lp)
            this.OnAIParachuteRunning(lp)
        },

        OnAIParachuteSucceeded: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIParachuteSucceeded(lp)
            this.OnAIParachuteSucceeded(lp)
        },

        OnAIWaypointIdleFailed: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIWaypointIdleFailed(lp)
            this.OnAIWaypointIdleFailed(lp)
        },

        OnAIWaypointIdleRunning: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIWaypointIdleRunning(lp)
            this.OnAIWaypointIdleRunning(lp)
        },

        OnAIWaypointIdleSucceeded: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnAIWaypointIdleSucceeded(lp)
            this.OnAIWaypointIdleSucceeded(lp)
        },

        // CapturePoint events
        OnCapturePointCaptured: (eventCapturePoint: mod.CapturePoint): void => {
            this.OnCapturePointCaptured(eventCapturePoint)
        },

        OnCapturePointCapturing: (
            eventCapturePoint: mod.CapturePoint
        ): void => {
            this.OnCapturePointCapturing(eventCapturePoint)
        },

        OnCapturePointLost: (eventCapturePoint: mod.CapturePoint): void => {
            this.OnCapturePointLost(eventCapturePoint)
        },

        // Game mode lifecycle
        OnGameModeEnding: (): void => {
            this.OnGameModeEnding()
        },

        OnGameModeStarted: (): void => {
            this.OnGameModeStarted()
        },

        // Player state events
        OnMandown: (
            eventPlayer: mod.Player,
            eventOtherPlayer: mod.Player
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            const other = this.lp(eventOtherPlayer)
            this.playerManager.OnMandown(lp, other)
            this.OnMandown(lp, other)
        },

        OnPlayerDamaged: (
            eventPlayer: mod.Player,
            eventOtherPlayer: mod.Player,
            eventDamageType: mod.DamageType,
            eventWeaponUnlock: mod.WeaponUnlock
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            const other = this.lp(eventOtherPlayer)
            this.playerManager.OnPlayerDamaged(
                lp,
                other,
                eventDamageType,
                eventWeaponUnlock
            )
            this.OnPlayerDamaged(lp, other, eventDamageType, eventWeaponUnlock)
        },

        OnPlayerDeployed: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerDeployed(lp)
            this.OnPlayerDeployed(lp)
        },

        OnPlayerDied: (
            eventPlayer: mod.Player,
            eventOtherPlayer: mod.Player,
            eventDeathType: mod.DeathType,
            eventWeaponUnlock: mod.WeaponUnlock
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            const other = this.lp(eventOtherPlayer)
            this.playerManager.OnPlayerDied(
                lp,
                other,
                eventDeathType,
                eventWeaponUnlock
            )
            this.OnPlayerDied(lp, other, eventDeathType, eventWeaponUnlock)
        },

        OnPlayerEarnedKill: (
            eventPlayer: mod.Player,
            eventOtherPlayer: mod.Player,
            eventDeathType: mod.DeathType,
            eventWeaponUnlock: mod.WeaponUnlock
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            const other = this.lp(eventOtherPlayer)
            this.playerManager.OnPlayerEarnedKill(
                lp,
                other,
                eventDeathType,
                eventWeaponUnlock
            )
            this.OnPlayerEarnedKill(
                lp,
                other,
                eventDeathType,
                eventWeaponUnlock
            )
        },

        OnPlayerEarnedKillAssist: (
            eventPlayer: mod.Player,
            eventOtherPlayer: mod.Player
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            const other = this.lp(eventOtherPlayer)
            this.playerManager.OnPlayerEarnedKillAssist(lp, other)
            this.OnPlayerEarnedKillAssist(lp, other)
        },

        OnRevived: (
            eventPlayer: mod.Player,
            eventOtherPlayer: mod.Player
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            const other = this.lp(eventOtherPlayer)
            this.playerManager.OnRevived(lp, other)
            this.OnRevived(lp, other)
        },

        // MCOM events
        OnMCOMArmed: (eventMCOM: mod.MCOM): void => {
            this.OnMCOMArmed(eventMCOM)
        },

        OnMCOMDefused: (eventMCOM: mod.MCOM): void => {
            this.OnMCOMDefused(eventMCOM)
        },

        OnMCOMDestroyed: (eventMCOM: mod.MCOM): void => {
            this.OnMCOMDestroyed(eventMCOM)
        },

        // Interaction and triggers
        OnPlayerInteract: (
            eventPlayer: mod.Player,
            eventInteractPoint: mod.InteractPoint
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerInteract(lp, eventInteractPoint)
            this.OnPlayerInteract(lp, eventInteractPoint)
        },

        OnPlayerEnterAreaTrigger: (
            eventPlayer: mod.Player,
            eventAreaTrigger: mod.AreaTrigger
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerEnterAreaTrigger(lp, eventAreaTrigger)
            this.OnPlayerEnterAreaTrigger(lp, eventAreaTrigger)
        },

        OnPlayerExitAreaTrigger: (
            eventPlayer: mod.Player,
            eventAreaTrigger: mod.AreaTrigger
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerExitAreaTrigger(lp, eventAreaTrigger)
            this.OnPlayerExitAreaTrigger(lp, eventAreaTrigger)
        },

        OnPlayerEnterCapturePoint: (
            eventPlayer: mod.Player,
            eventCapturePoint: mod.CapturePoint
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerEnterCapturePoint(lp, eventCapturePoint)
            this.OnPlayerEnterCapturePoint(lp, eventCapturePoint)
        },

        OnPlayerExitCapturePoint: (
            eventPlayer: mod.Player,
            eventCapturePoint: mod.CapturePoint
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerExitCapturePoint(lp, eventCapturePoint)
            this.OnPlayerExitCapturePoint(lp, eventCapturePoint)
        },

        // Vehicle events
        OnPlayerEnterVehicle: (
            eventPlayer: mod.Player,
            eventVehicle: mod.Vehicle
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerEnterVehicle(lp, eventVehicle)
            this.OnPlayerEnterVehicle(lp, eventVehicle)
        },

        OnPlayerExitVehicle: (
            eventPlayer: mod.Player,
            eventVehicle: mod.Vehicle
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerExitVehicle(lp, eventVehicle)
            this.OnPlayerExitVehicle(lp, eventVehicle)
        },

        OnPlayerEnterVehicleSeat: (
            eventPlayer: mod.Player,
            eventVehicle: mod.Vehicle,
            eventSeat: mod.Object
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerEnterVehicleSeat(
                lp,
                eventVehicle,
                eventSeat
            )
            this.OnPlayerEnterVehicleSeat(lp, eventVehicle, eventSeat)
        },

        OnPlayerExitVehicleSeat: (
            eventPlayer: mod.Player,
            eventVehicle: mod.Vehicle,
            eventSeat: mod.Object
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerExitVehicleSeat(
                lp,
                eventVehicle,
                eventSeat
            )
            this.OnPlayerExitVehicleSeat(lp, eventVehicle, eventSeat)
        },

        // Player join/leave
        OnPlayerJoinGame: (eventPlayer: mod.Player): void => {
            if (!this.playerManager) {
                this.playerManager = this.createPlayerManager()
            }
            const lp = this.playerManager.addPlayer(eventPlayer)
            this.OnPlayerJoinGame(lp)
        },

        OnPlayerLeaveGame: (eventNumber: number): void => {
            const lp = this.lpId(eventNumber)
            if (lp) {
                this.OnPlayerLeaveGame(lp)
            }
            this.playerManager.removePlayer(eventNumber)
        },

        // Team / UI
        OnPlayerSwitchTeam: (
            eventPlayer: mod.Player,
            eventTeam: mod.Team
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerSwitchTeam(lp, eventTeam)
            this.OnPlayerSwitchTeam(lp, eventTeam)
        },

        OnPlayerUIButtonEvent: (
            eventPlayer: mod.Player,
            eventUIWidget: mod.UIWidget,
            eventUIButtonEvent: mod.UIButtonEvent
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerUIButtonEvent(
                lp,
                eventUIWidget,
                eventUIButtonEvent
            )
            this.OnPlayerUIButtonEvent(lp, eventUIWidget, eventUIButtonEvent)
        },

        // Undeploy
        OnPlayerUndeploy: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnPlayerUndeploy(lp)
            this.OnPlayerUndeploy(lp)
        },

        // Raycast
        OnRayCastHit: (
            eventPlayer: mod.Player,
            eventPoint: mod.Vector,
            eventNormal: mod.Vector
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnRayCastHit(lp, eventPoint, eventNormal)
            this.OnRayCastHit(lp, eventPoint, eventNormal)
        },

        OnRayCastMissed: (eventPlayer: mod.Player): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnRayCastMissed(lp)
            this.OnRayCastMissed(lp)
        },

        // Spawner
        OnSpawnerSpawned: (
            eventPlayer: mod.Player,
            eventSpawner: mod.Spawner
        ): void => {
            const lp = this.lp(eventPlayer)
            if (!lp) return
            this.playerManager.OnSpawnerSpawned(lp, eventSpawner)
            this.OnSpawnerSpawned(lp, eventSpawner)
        },

        // Ring of fire / time limit / vehicles
        OnRingOfFireZoneSizeChange: (
            eventRingOfFire: mod.RingOfFire,
            eventNumber: number
        ): void => {
            this.OnRingOfFireZoneSizeChange(eventRingOfFire, eventNumber)
        },

        OnTimeLimitReached: (): void => {
            this.OnTimeLimitReached()
        },

        OnVehicleDestroyed: (eventVehicle: mod.Vehicle): void => {
            this.OnVehicleDestroyed(eventVehicle)
        },

        OnVehicleSpawned: (eventVehicle: mod.Vehicle): void => {
            this.OnVehicleSpawned(eventVehicle)
        },
    }

    /* ------------------------------------------------------------
     * Simple event bus for observers (AI, debug, UI)
     * ------------------------------------------------------------ */

    listeners: CorePlayer_IGameModeEvents[] = []

    addListener(listener: CorePlayer_IGameModeEvents): void {
        this.listeners.push(listener)
    }

    removeListener(listener: CorePlayer_IGameModeEvents): void {
        this.listeners = this.listeners.filter((l) => l !== listener)
    }

    emit<E extends keyof CorePlayer_IGameModeEvents>(
        event: E,
        ...args: Parameters<NonNullable<CorePlayer_IGameModeEvents[E]>>
    ): void {
        for (const listener of this.listeners) {
            const fn = listener[event]
            if (typeof fn === 'function') {
                ;(fn as (...a: any[]) => void)(...args)
            }
        }
    }
}
