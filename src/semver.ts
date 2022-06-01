import {SemVer, compare, gte, lt} from 'semver'

/**
 * Determines the correct base version for a given target version
 * @param target the target version
 * @param existing the existing versions
 * @returns the base for the target version, or itself
 */
export function determineVersionBase(
  target: SemVer,
  existing: SemVer[]
): SemVer {
  // if we have no existing versions, the base is whatever the target is
  // in reality, this never happens for readme sites
  if (existing.length === 0) {
    return target
  }

  // ascending order
  const ordered: (SemVer | undefined)[] = existing.sort(compare)

  // throw one on the end that's undefined
  ordered.push(undefined)

  for (let i = 0; i < ordered.length - 1; i++) {
    const current = ordered[i] as SemVer
    const next = ordered[i + 1]

    // if we're: target >= current
    if (gte(target, current)) {
      // if we're: next == null || next > target
      if (!next || lt(target, next)) {
        // return current
        return current
      }
    }
  }

  // return the highest existing value
  return ordered[ordered.length - 2] as SemVer
}
