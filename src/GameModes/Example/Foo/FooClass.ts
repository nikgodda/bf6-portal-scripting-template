import { Example_GameMode } from '../Example_GameMode'

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
