import { DidDocument } from '@lisk-did/lisk-decentralized-identifier';

export function isTheLastControllerAndNoKeysRemains(targetDIDDocument: DidDocument, controller: string) {
  const isTheLastController =
    targetDIDDocument.controller.length === 1 && targetDIDDocument.controller[0] === controller;
  const noKeysRemains = targetDIDDocument.verificationMethod.length === 0;
  return isTheLastController && noKeysRemains;
}
