export type Sample = { name: string, x: number, y: number, z: number }
export type Data = Sample[]
export type AppState = {
    pointer: {
        x: number,
        y: number,
        z: number,
    }
}