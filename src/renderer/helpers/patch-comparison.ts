import * as Git from 'nodegit';

export function arePatchesEqual(lhs: Git.ConvenientPatch, rhs: Git.ConvenientPatch) {
  return lhs.oldFile().id().equal(rhs.oldFile().id()) &&
    lhs.newFile().id().equal(rhs.newFile().id()) &&
    lhs.status() === rhs.status() &&
    lhs.size() === rhs.size();
}

export function arePatchesSimilar(lhs: Git.ConvenientPatch, rhs: Git.ConvenientPatch) {
  return lhs.oldFile().path() === rhs.oldFile().path() &&
    lhs.newFile().path() === rhs.newFile().path() &&
    lhs.status() === rhs.status()
}