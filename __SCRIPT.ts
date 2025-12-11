import * as modlib from 'modlib'

// -------- FILE: src\Core\IGameModeEvents.ts --------
export interface CorePlayer_IGameModeEvents {
    // Lifecycle
    OngoingGlobal?(): void
}

// -------- FILE: src\Core\Player\IPlayerEvents.ts --------
export interface CorePlayer_IPlayerEvents {
    // Lifecycle
    OnPlayerJoinGame?(joinedPlayer: CorePlayer_APlayer): void
    OnPlayerLeaveGame?(): void

    OnPlayerDeployed?(): void
    OnPlayerDied?(
        eventOtherPlayer: CorePlayer_APlayer | undefined,
        eventDeathType: mod.DeathType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void
    OnPlayerUndeploy?(): void

    // Damage / kills
    OnPlayerDamaged?(
        eventOtherPlayer: CorePlayer_APlayer | undefined,
        eventDamageType: mod.DamageType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void
    OnPlayerEarnedKill?(
        eventOtherPlayer: CorePlayer_APlayer | undefined,
        eventDeathType: mod.DeathType,
        eventWeaponUnlock: mod.WeaponUnlock
    ): void
    OnPlayerEarnedKillAssist?(
        eventOtherPlayer: CorePlayer_APlayer | undefined
    ): void
    OnMandown?(eventOtherPlayer: CorePlayer_APlayer | undefined): void
    OnRevived?(eventOtherPlayer: CorePlayer_APlayer | undefined): void

    // Interactions / triggers
    OnPlayerInteract?(eventInteractPoint: mod.InteractPoint): void
    OnPlayerEnterAreaTrigger?(eventAreaTrigger: mod.AreaTrigger): void
    OnPlayerExitAreaTrigger?(eventAreaTrigger: mod.AreaTrigger): void
    OnPlayerEnterCapturePoint?(eventCapturePoint: mod.CapturePoint): void
    OnPlayerExitCapturePoint?(eventCapturePoint: mod.CapturePoint): void

    // Vehicles
    OnPlayerEnterVehicle?(eventVehicle: mod.Vehicle): void
    OnPlayerExitVehicle?(eventVehicle: mod.Vehicle): void
    OnPlayerEnterVehicleSeat?(
        eventVehicle: mod.Vehicle,
        eventSeat: mod.Object
    ): void
    OnPlayerExitVehicleSeat?(
        eventVehicle: mod.Vehicle,
        eventSeat: mod.Object
    ): void

    // Team / UI
    OnPlayerSwitchTeam?(eventTeam: mod.Team): void
    OnPlayerUIButtonEvent?(
        eventUIWidget: mod.UIWidget,
        eventUIButtonEvent: mod.UIButtonEvent
    ): void

    // Raycast
    OnRayCastHit?(eventPoint: mod.Vector, eventNormal: mod.Vector): void
    OnRayCastMissed?(): void

    // Spawner
    OnSpawnerSpawned?(eventSpawner: mod.Spawner): void

    // AI movement
    OnAIMoveToFailed?(): void
    OnAIMoveToRunning?(): void
    OnAIMoveToSucceeded?(): void

    // Waypoint idle
    OnAIWaypointIdleFailed?(): void
    OnAIWaypointIdleRunning?(): void
    OnAIWaypointIdleSucceeded?(): void

    // Parachute
    OnAIParachuteRunning?(): void
    OnAIParachuteSucceeded?(): void

    // Ongoing tick
    OngoingPlayer?(): void
}

// -------- FILE: src\Core\Player\APlayer.ts --------
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

// -------- FILE: src\Core\Player\APlayerManager.ts --------
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

// -------- FILE: src\Core\AGameMode.ts --------
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

// -------- FILE: src\GameModes\Example\Example_Player.ts --------
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

// -------- FILE: src\GameModes\Example\Example_PlayerManager.ts --------
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

// -------- FILE: src\GameModes\Example\Foo\FooClass.ts --------
/**
 * Example_FooClass
 *
 * Demonstrates how to subscribe to Example_GameMode events and throttle
 * OngoingGlobal logic. This class listens to the OngoingGlobal event,
 * which fires every tick, but limits its own execution to once every
 * 4 seconds using a simple Date.now() based throttle.
 *
 * Use this as a reference for building utility systems that need to run
 * periodically without executing every tick.
 */
export class Example_FooClass {
    private lastTime = 0
    private interval = 4000 // ms

    constructor(private gameMode: Example_GameMode) {
        this.gameMode.addListener({
            OngoingGlobal: () => this.onTick(),
        })
    }

    private onTick(): void {
        const now = Date.now()

        if (now - this.lastTime < this.interval) {
            return
        }
        this.lastTime = now

        console.log('Example game mode throttled Ongoing...')

        mod.DisplayHighlightedWorldLogMessage(
            mod.Message('debug.gamemode.ongoing')
        )
    }
}

// -------- FILE: src\GameModes\Example\Example_GameMode.ts --------
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

// -------- FILE: src\main.ts --------
/**
 * Core_AGameMode
 *
 * High-level explanation:
 * -----------------------
 * This class is the central event router and base implementation of all
 * game modes. The Battlefield 6 modding API exposes a large set of raw
 * engine events (such as OnPlayerDied, OnPlayerDamaged, OngoingGlobal, etc).
 * Game modes need a safe and structured way to handle these events without
 * directly dealing with low-level engine Player objects.
 *
 * This class provides that structure.
 *
 * Architecture:
 * -------------
 * 1. _internal (router object)
 *    - Public object containing functions that match the exact signature
 *      of the mod EventHandlerSignatures namespace.
 *    - main.ts must call these functions.
 *    - They are public on purpose, but live inside a child object so they do
 *      NOT appear as override options in derived game mode classes.
 *    - Each router function:
 *        a) Receives raw engine parameters.
 *        b) Converts mod.Player into CorePlayer_APlayer using PlayerManager.
 *        c) Notifies PlayerManager of state changes.
 *        d) Forwards the event to the corresponding protected hook method.
 *
 * 2. Protected hook methods
 *    - These methods represent the actual game mode logic.
 *    - They use CorePlayer_APlayer instead of raw mod.Player.
 *    - Game mode classes (such as TDM_GameMode) override these to implement
 *      their own behavior.
 *    - Example:
 *         protected OnPlayerDied(lp: CorePlayer_APlayer, ...)
 *    - These are clean API methods that mod developers should override.
 *
 * 3. PlayerManager integration
 *    - The PlayerManager tracks logical player state across deploy, death,
 *      team switching, mandown, etc.
 *    - The router updates the PlayerManager before calling the hook so
 *      derived game modes always receive correct state.
 *    - The PlayerManager is created lazily on first OnPlayerJoinGame.
 *
 * 4. Event flow summary
 *    Engine -> main.ts -> _internal.OnX -> PlayerManager -> protected OnX
 *
 * Why this design:
 * ----------------
 * - Prevents accidental overriding of internal routing functions.
 * - Keeps the public API for game mode developers small and predictable.
 * - Ensures all events follow the exact lifecycle rules consistently.
 * - Avoids exposing low-level engine Player objects in game mode code.
 * - Prevents autocomplete pollution with dozens of internal methods.
 *
 * What game mode authors should do:
 * ---------------------------------
 * - Override protected hook methods only (OnPlayerDied, OnPlayerJoinGame, etc).
 * - Never call functions inside _internal directly.
 * - Never override or modify _internal, PlayerManager, or routing logic.
 * - Use CorePlayer_APlayer values passed into hooks, never store mod.Player.
 *
 * Summary:
 * --------
 * Core_AGameMode acts as a stable event bridge between the BF6 engine event
 * system and high-level game mode logic. Its purpose is to enforce a clean
 * separation between routing and gameplay code, unify PlayerManager access,
 * and ensure that custom game modes behave consistently with the engine rules.
 */
const gameMode: Core_AGameMode = new Example_GameMode()

// This will trigger every engine tick while the gamemode is running.
export function OngoingGlobal(): void {
    gameMode._internal.OngoingGlobal()
}

// This will trigger every tick for each AreaTrigger.
export function OngoingAreaTrigger(eventAreaTrigger: mod.AreaTrigger): void {
    gameMode._internal.OngoingAreaTrigger(eventAreaTrigger)
}

// This will trigger every tick for each CapturePoint.
export function OngoingCapturePoint(eventCapturePoint: mod.CapturePoint): void {
    gameMode._internal.OngoingCapturePoint(eventCapturePoint)
}

// This will trigger every tick for each EmplacementSpawner.
export function OngoingEmplacementSpawner(
    eventEmplacementSpawner: mod.EmplacementSpawner
): void {
    gameMode._internal.OngoingEmplacementSpawner(eventEmplacementSpawner)
}

// This will trigger every tick for the HQ object.
export function OngoingHQ(eventHQ: mod.HQ): void {
    gameMode._internal.OngoingHQ(eventHQ)
}

// This will trigger every tick for each InteractPoint.
export function OngoingInteractPoint(
    eventInteractPoint: mod.InteractPoint
): void {
    gameMode._internal.OngoingInteractPoint(eventInteractPoint)
}

// This will trigger every tick for each LootSpawner.
export function OngoingLootSpawner(eventLootSpawner: mod.LootSpawner): void {
    gameMode._internal.OngoingLootSpawner(eventLootSpawner)
}

// This will trigger every tick for each MCOM.
export function OngoingMCOM(eventMCOM: mod.MCOM): void {
    gameMode._internal.OngoingMCOM(eventMCOM)
}

// This will trigger every tick for each Player.
export function OngoingPlayer(eventPlayer: mod.Player): void {
    gameMode._internal.OngoingPlayer(eventPlayer)
}

// This will trigger every tick for each RingOfFire.
export function OngoingRingOfFire(eventRingOfFire: mod.RingOfFire): void {
    gameMode._internal.OngoingRingOfFire(eventRingOfFire)
}

// This will trigger every tick for each Sector.
export function OngoingSector(eventSector: mod.Sector): void {
    gameMode._internal.OngoingSector(eventSector)
}

// This will trigger every tick for each Spawner.
export function OngoingSpawner(eventSpawner: mod.Spawner): void {
    gameMode._internal.OngoingSpawner(eventSpawner)
}

// This will trigger every tick for each SpawnPoint.
export function OngoingSpawnPoint(eventSpawnPoint: mod.SpawnPoint): void {
    gameMode._internal.OngoingSpawnPoint(eventSpawnPoint)
}

// This will trigger every tick for each Team.
export function OngoingTeam(eventTeam: mod.Team): void {
    gameMode._internal.OngoingTeam(eventTeam)
}

// This will trigger every tick for each Vehicle.
export function OngoingVehicle(eventVehicle: mod.Vehicle): void {
    gameMode._internal.OngoingVehicle(eventVehicle)
}

// This will trigger every tick for each VehicleSpawner.
export function OngoingVehicleSpawner(
    eventVehicleSpawner: mod.VehicleSpawner
): void {
    gameMode._internal.OngoingVehicleSpawner(eventVehicleSpawner)
}

// This will trigger every tick for each WaypointPath.
export function OngoingWaypointPath(eventWaypointPath: mod.WaypointPath): void {
    gameMode._internal.OngoingWaypointPath(eventWaypointPath)
}

// This will trigger every tick for each WorldIcon.
export function OngoingWorldIcon(eventWorldIcon: mod.WorldIcon): void {
    gameMode._internal.OngoingWorldIcon(eventWorldIcon)
}

// This will trigger when an AI Soldier stops moving to a destination.
export function OnAIMoveToFailed(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIMoveToFailed(eventPlayer)
}

// This will trigger when an AI Soldier starts moving to a destination.
export function OnAIMoveToRunning(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIMoveToRunning(eventPlayer)
}

// This will trigger when an AI Soldier reaches its destination.
export function OnAIMoveToSucceeded(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIMoveToSucceeded(eventPlayer)
}

// This will trigger when an AI Soldier parachute action is running.
export function OnAIParachuteRunning(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIParachuteRunning(eventPlayer)
}

// This will trigger when an AI Soldier parachute action succeeds.
export function OnAIParachuteSucceeded(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIParachuteSucceeded(eventPlayer)
}

// This will trigger when an AI Soldier stops following a waypoint.
export function OnAIWaypointIdleFailed(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIWaypointIdleFailed(eventPlayer)
}

// This will trigger when an AI Soldier starts following a waypoint.
export function OnAIWaypointIdleRunning(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIWaypointIdleRunning(eventPlayer)
}

// This will trigger when an AI Soldier finishes following a waypoint.
export function OnAIWaypointIdleSucceeded(eventPlayer: mod.Player): void {
    gameMode._internal.OnAIWaypointIdleSucceeded(eventPlayer)
}

// This will trigger when a team captures a CapturePoint.
export function OnCapturePointCaptured(
    eventCapturePoint: mod.CapturePoint
): void {
    gameMode._internal.OnCapturePointCaptured(eventCapturePoint)
}

// This will trigger when a team starts capturing a CapturePoint.
export function OnCapturePointCapturing(
    eventCapturePoint: mod.CapturePoint
): void {
    gameMode._internal.OnCapturePointCapturing(eventCapturePoint)
}

// This will trigger when a team loses control of a CapturePoint.
export function OnCapturePointLost(eventCapturePoint: mod.CapturePoint): void {
    gameMode._internal.OnCapturePointLost(eventCapturePoint)
}

// This will trigger when the gamemode ends.
export function OnGameModeEnding(): void {
    gameMode._internal.OnGameModeEnding()
}

// This will trigger at the start of the gamemode.
export function OnGameModeStarted(): void {
    gameMode._internal.OnGameModeStarted()
}

// This will trigger when a Player enters mandown state.
export function OnMandown(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player
): void {
    gameMode._internal.OnMandown(eventPlayer, eventOtherPlayer)
}

// This will trigger when a MCOM is armed.
export function OnMCOMArmed(eventMCOM: mod.MCOM): void {
    gameMode._internal.OnMCOMArmed(eventMCOM)
}

// This will trigger when a MCOM is defused.
export function OnMCOMDefused(eventMCOM: mod.MCOM): void {
    gameMode._internal.OnMCOMDefused(eventMCOM)
}

// This will trigger when a MCOM is detonated.
export function OnMCOMDestroyed(eventMCOM: mod.MCOM): void {
    gameMode._internal.OnMCOMDestroyed(eventMCOM)
}

// This will trigger when a Player takes damage.
export function OnPlayerDamaged(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDamageType: mod.DamageType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {
    gameMode._internal.OnPlayerDamaged(
        eventPlayer,
        eventOtherPlayer,
        eventDamageType,
        eventWeaponUnlock
    )
}

// This will trigger whenever a Player deploys.
export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    gameMode._internal.OnPlayerDeployed(eventPlayer)
}

// This will trigger whenever a Player dies.
export function OnPlayerDied(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {
    gameMode._internal.OnPlayerDied(
        eventPlayer,
        eventOtherPlayer,
        eventDeathType,
        eventWeaponUnlock
    )
}

// This will trigger when a Player earns a kill.
export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    eventDeathType: mod.DeathType,
    eventWeaponUnlock: mod.WeaponUnlock
): void {
    gameMode._internal.OnPlayerEarnedKill(
        eventPlayer,
        eventOtherPlayer,
        eventDeathType,
        eventWeaponUnlock
    )
}

// This will trigger when a Player earns a kill assist.
export function OnPlayerEarnedKillAssist(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player
): void {
    gameMode._internal.OnPlayerEarnedKillAssist(eventPlayer, eventOtherPlayer)
}

// This will trigger when a Player enters an AreaTrigger.
export function OnPlayerEnterAreaTrigger(
    eventPlayer: mod.Player,
    eventAreaTrigger: mod.AreaTrigger
): void {
    gameMode._internal.OnPlayerEnterAreaTrigger(eventPlayer, eventAreaTrigger)
}

// This will trigger when a Player enters a CapturePoint.
export function OnPlayerEnterCapturePoint(
    eventPlayer: mod.Player,
    eventCapturePoint: mod.CapturePoint
): void {
    gameMode._internal.OnPlayerEnterCapturePoint(eventPlayer, eventCapturePoint)
}

// This will trigger when a Player enters a Vehicle.
export function OnPlayerEnterVehicle(
    eventPlayer: mod.Player,
    eventVehicle: mod.Vehicle
): void {
    gameMode._internal.OnPlayerEnterVehicle(eventPlayer, eventVehicle)
}

// This will trigger when a Player enters a Vehicle seat.
export function OnPlayerEnterVehicleSeat(
    eventPlayer: mod.Player,
    eventVehicle: mod.Vehicle,
    eventSeat: mod.Object
): void {
    gameMode._internal.OnPlayerEnterVehicleSeat(
        eventPlayer,
        eventVehicle,
        eventSeat
    )
}

// This will trigger when a Player exits an AreaTrigger.
export function OnPlayerExitAreaTrigger(
    eventPlayer: mod.Player,
    eventAreaTrigger: mod.AreaTrigger
): void {
    gameMode._internal.OnPlayerExitAreaTrigger(eventPlayer, eventAreaTrigger)
}

// This will trigger when a Player exits a CapturePoint.
export function OnPlayerExitCapturePoint(
    eventPlayer: mod.Player,
    eventCapturePoint: mod.CapturePoint
): void {
    gameMode._internal.OnPlayerExitCapturePoint(eventPlayer, eventCapturePoint)
}

// This will trigger when a Player exits a Vehicle.
export function OnPlayerExitVehicle(
    eventPlayer: mod.Player,
    eventVehicle: mod.Vehicle
): void {
    gameMode._internal.OnPlayerExitVehicle(eventPlayer, eventVehicle)
}

// This will trigger when a Player exits a Vehicle seat.
export function OnPlayerExitVehicleSeat(
    eventPlayer: mod.Player,
    eventVehicle: mod.Vehicle,
    eventSeat: mod.Object
): void {
    gameMode._internal.OnPlayerExitVehicleSeat(
        eventPlayer,
        eventVehicle,
        eventSeat
    )
}

// This will trigger when a Player interacts with an InteractPoint.
export function OnPlayerInteract(
    eventPlayer: mod.Player,
    eventInteractPoint: mod.InteractPoint
): void {
    gameMode._internal.OnPlayerInteract(eventPlayer, eventInteractPoint)
}

// This will trigger when a Player joins the game.
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    gameMode._internal.OnPlayerJoinGame(eventPlayer)
}

// This will trigger when a Player leaves the game.
export function OnPlayerLeaveGame(eventNumber: number): void {
    gameMode._internal.OnPlayerLeaveGame(eventNumber)
}

// This will trigger when a Player switches team.
export function OnPlayerSwitchTeam(
    eventPlayer: mod.Player,
    eventTeam: mod.Team
): void {
    gameMode._internal.OnPlayerSwitchTeam(eventPlayer, eventTeam)
}

// This will trigger when a Player interacts with a UI button.
export function OnPlayerUIButtonEvent(
    eventPlayer: mod.Player,
    eventUIWidget: mod.UIWidget,
    eventUIButtonEvent: mod.UIButtonEvent
): void {
    gameMode._internal.OnPlayerUIButtonEvent(
        eventPlayer,
        eventUIWidget,
        eventUIButtonEvent
    )
}

// This will trigger when a Player undeploys.
export function OnPlayerUndeploy(eventPlayer: mod.Player): void {
    gameMode._internal.OnPlayerUndeploy(eventPlayer)
}

// This will trigger when a Raycast hits a target.
export function OnRayCastHit(
    eventPlayer: mod.Player,
    eventPoint: mod.Vector,
    eventNormal: mod.Vector
): void {
    gameMode._internal.OnRayCastHit(eventPlayer, eventPoint, eventNormal)
}

// This will trigger when a Raycast misses.
export function OnRayCastMissed(eventPlayer: mod.Player): void {
    gameMode._internal.OnRayCastMissed(eventPlayer)
}

// This will trigger when a Player is revived.
export function OnRevived(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player
): void {
    gameMode._internal.OnRevived(eventPlayer, eventOtherPlayer)
}

// This will trigger when a RingOfFire changes size.
export function OnRingOfFireZoneSizeChange(
    eventRingOfFire: mod.RingOfFire,
    eventNumber: number
): void {
    gameMode._internal.OnRingOfFireZoneSizeChange(eventRingOfFire, eventNumber)
}

// This will trigger when an AISpawner spawns an AI Soldier.
export function OnSpawnerSpawned(
    eventPlayer: mod.Player,
    eventSpawner: mod.Spawner
): void {
    gameMode._internal.OnSpawnerSpawned(eventPlayer, eventSpawner)
}

// This will trigger when the time limit is reached.
export function OnTimeLimitReached(): void {
    gameMode._internal.OnTimeLimitReached()
}

// This will trigger when a Vehicle is destroyed.
export function OnVehicleDestroyed(eventVehicle: mod.Vehicle): void {
    gameMode._internal.OnVehicleDestroyed(eventVehicle)
}

// This will trigger when a Vehicle spawns.
export function OnVehicleSpawned(eventVehicle: mod.Vehicle): void {
    gameMode._internal.OnVehicleSpawned(eventVehicle)
}

