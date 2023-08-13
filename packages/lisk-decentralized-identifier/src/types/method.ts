import { MethodContext } from 'lisk-sdk';
import { DidModuleConfig } from './config';
import { DidDocument } from './did';
import { NonceStoreData } from './stores';

type Keys = { publicKey: Buffer; relationship: string[] };

export interface DidMethod {
  init(config: DidModuleConfig): void;
  getConfig(): DidModuleConfig;
  read(methodContext: MethodContext, did: string): Promise<DidDocument>;
  getNonce(methodContext: MethodContext, did: string): Promise<NonceStoreData>;
  create(
    methodContext: MethodContext,
    senderPublicKey: Buffer,
    did: string,
    controllers: string[],
    keys: Keys[],
  ): Promise<void>;
  addKeys(
    methodContext: MethodContext,
    target: string,
    keys: Keys[],
    signer: string,
    signature?: Buffer,
  ): Promise<void>;
  removeKeys(
    methodContext: MethodContext,
    target: string,
    publicKeys: Buffer[],
    signer: string,
    signature?: Buffer,
  ): Promise<void>;
  addControllers(
    methodContext: MethodContext,
    target: string,
    controllers: string[],
    signer: string,
    signature?: Buffer,
  ): Promise<void>;
  removeControllers(
    methodContext: MethodContext,
    target: string,
    controllers: string[],
    signer: string,
    signature?: Buffer,
  ): Promise<void>;
  addServiceEndpoint(
    methodContext: MethodContext,
    target: string,
    endpoint: {
      id: string;
      type: string;
      serviceEndpoint: string;
    },
    signer: string,
    signature?: Buffer,
  ): Promise<void>;
  removeServiceEndpoint(
    methodContext: MethodContext,
    target: string,
    endpointId: string,
    signer: string,
    signature?: Buffer,
  ): Promise<void>;
  deactivate(methodContext: MethodContext, target: string, signer: string, signature?: Buffer): Promise<void>;
}
