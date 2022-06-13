import {findX} from '../src/binarySearch'
import {Sample} from '../src/types'

describe('findX', function () {
    it("single", function () {
        expect(findX([{x: 0}] as Sample[], 0)).toBe(0)
        expect(findX([{x: 0}] as Sample[], 1)).toBe(1)
        expect(findX([{x: 0},{x: 1}] as Sample[], 0)).toBe(0)
        expect(findX([{x: 0},{x: 1}] as Sample[], 1)).toBe(1)
        expect(findX([{x: 0},{x: 1}] as Sample[], 0.25)).toBe(1)
        expect(findX([{x: 0},{x: 1}] as Sample[], 0.75)).toBe(1)
        expect(findX([{x: 0},{x: 0.5},{x: 1}] as Sample[], 0.5)).toBe(1)
        expect(findX([{x: 0},{x: 0.5},{x: 1}] as Sample[], 0.25)).toBe(1)
        expect(findX([{x: 0},{x: 0.5},{x: 1}] as Sample[], 0.75)).toBe(2)
    })
})