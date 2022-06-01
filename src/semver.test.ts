import {parse, SemVer} from 'semver'
import {determineVersionBase} from './semver'

describe('semver', () => {
  it('should determine self is base', () => {
    let target = parse('1.0.0') as SemVer
    let existing: SemVer[] = []

    expect(determineVersionBase(target, existing)).toEqual(target)
  })

  it('should determine a base with a simple setup', () => {
    let target = parse('1.0.0') as SemVer
    let expectedBase = parse('0.5.0') as SemVer
    let existing: SemVer[] = [expectedBase]

    expect(determineVersionBase(target, existing)).toEqual(expectedBase)
  })

  it('should determine a base with a complex setup', () => {
    let target = parse('1.0.0') as SemVer
    let expectedBase = parse('0.5.0') as SemVer
    let existing: SemVer[] = [
      expectedBase,
      parse('0.2.5') as SemVer,
      parse('0.3.2') as SemVer
    ]

    expect(determineVersionBase(target, existing)).toEqual(expectedBase)
  })

  it('should determine a base in the middle', () => {
    let target = parse('1.0.0') as SemVer
    let expectedBase = parse('0.5.0') as SemVer
    let existing: SemVer[] = [
      expectedBase,
      parse('1.2.5') as SemVer,
      parse('0.3.2') as SemVer
    ]

    expect(determineVersionBase(target, existing)).toEqual(expectedBase)
  })
})
