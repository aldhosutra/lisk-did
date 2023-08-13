import { cryptography } from 'lisk-sdk';
import { getEd25519SignatureSuite } from './suite';
import { CreateResolverParam } from '../types';
import { getDIDDocument, parseDIDComponent } from '../did';
import { getVerificationMethod } from './verification';
import { Cipher } from '@digitalcredentials/minimal-cipher/lib';
import { createResolver } from '../resolver';
import { JWEDocument, KeyAgreement } from '../types';
import { encodePrivateKey, encodePublicKey } from './convert';

export async function encrypt(
  data: string,
  recipientKeyId: string[],
  options: CreateResolverParam,
): Promise<JWEDocument> {
  const cipher = new Cipher();
  const keyResolver = async (url: string) => await createResolver(options).get(url);
  const recipients = recipientKeyId
    .map(kid => parseDIDComponent(kid).uri)
    .map(kid => ({ header: { kid, alg: 'ECDH-ES+A256KW' } }));

  const jweDoc = await cipher.encrypt({ data, recipients, keyResolver });
  return jweDoc;
}

export async function decrypt(
  jwe: JWEDocument,
  recipientKeyId: string,
  privateKey: Buffer,
  options: CreateResolverParam,
): Promise<string> {
  const cipher = new Cipher();
  const keyAgreementKey: KeyAgreement = await createResolver(options).get(recipientKeyId);
  keyAgreementKey.privateKeyMultibase = encodePrivateKey(privateKey);
  if (encodePublicKey(cryptography.ed.getPublicKeyFromPrivateKey(privateKey)) !== keyAgreementKey.publicKeyMultibase) {
    throw new Error('provided privateKey and recipientKeyId does not match');
  }
  const object = await cipher.decrypt({ jwe, keyAgreementKey });
  return object;
}

export async function sign(
  data: string,
  did: string,
  privateKey: Buffer,
  options: CreateResolverParam,
): Promise<Buffer> {
  const didDocument = await getDIDDocument(did, options);
  if (!didDocument) throw new Error("DID document doesn't exist");

  const keyPair = await getVerificationMethod(didDocument, { privateKey, relationship: ['assertionMethod'] });
  if (keyPair.length === 0) {
    throw new Error("specified private key doesn't have neccessary permission to sign a data");
  }

  const suite = await getEd25519SignatureSuite({ ...keyPair[0], privateKey });
  return await suite.signer.sign({ data });
}

export async function verify(
  data: string,
  did: string,
  signature: Buffer,
  publicKey: Buffer,
  options: CreateResolverParam & { withDigest?: boolean },
): Promise<boolean> {
  let result = false;

  const didDocument = await getDIDDocument(did, options);
  if (!didDocument) throw new Error("DID document doesn't exist");

  const keyPair = await getVerificationMethod(didDocument, { publicKey, relationship: ['assertionMethod'] });
  if (keyPair.length === 0) {
    throw new Error("specified public key doesn't have neccessary permission to verify a data");
  }

  const suite = await getEd25519SignatureSuite(keyPair[0]);
  result = await suite.verifier.verify({ data, signature });

  if (result) return result;

  // lisk-cryptography implementation use digest to original message
  if (options.withDigest) {
    result = cryptography.ed.verifyMessageWithPublicKey({ message: data, publicKey, signature });
  }

  return result;
}

export async function signLocal(data: string, privateKey: Buffer): Promise<Buffer> {
  const publicKey = cryptography.ed.getPublicKeyFromPrivateKey(privateKey);
  const suite = await getEd25519SignatureSuite({ publicKey, privateKey });
  return await suite.signer.sign({ data });
}

export async function verifyLocal(
  data: string,
  signature: Buffer,
  publicKey: Buffer,
  withDigest = false,
): Promise<boolean> {
  let result;
  const suite = await getEd25519SignatureSuite({ publicKey });
  result = await suite.verifier.verify({ data, signature });

  if (result === true) return result;

  // lisk-cryptography implementation use digest to original message
  if (withDigest) {
    result = cryptography.ed.verifyMessageWithPublicKey({ message: data, publicKey, signature });
  }

  return result;
}
