import { computeSignatureHash, SignatureType } from '../abi/signature';

export const OPCODE_DELEGATECALL = 0xf4;
export const OPCODE_PUSH1 = 0x60;
export const OPCODE_PUSH32 = 0x7f;

function walkOpcodes(bytecode: string, callback: (opcode: number, dataLength: number, data?: Buffer) => boolean) {
    const code = Buffer.from(bytecode.slice(2), 'hex');
    for (let i = 0, len = code.length; i < len; i++) {
        const opcode = code[i];
        if (opcode >= OPCODE_PUSH1 && opcode <= OPCODE_PUSH32) {
            const dataLength = opcode - (OPCODE_PUSH1 - 1);
            const data = code.slice(i + 1, i + dataLength + 1);
            if (callback(opcode, dataLength, data) === false) {
                break;
            }
            i += dataLength;
        } else {
            if (callback(opcode, 0) === false) {
                break;
            }
        }
    }
}

export function extractPotentialSignatures(bytecode: string): Set<string> {
    const result = new Set<string>();
    walkOpcodes(bytecode, (opcode, dataLength, data) => {
        if (dataLength === 32 || dataLength === 4) {
            result.add(data!.toString('hex'));
        }
        return true;
    });
    // const code = Buffer.from(bytecode.slice(2), 'hex');
    // for (let i = 0, len = code.length; i < len; i++) {
    //     const opcode = code[i];
    //     // Look for PUSH<n> opcodes - their pushData may contain a log topic or function signature hash
    //     if (opcode >= 0x60 && opcode <= 0x7f) {
    //         const dataLength = opcode - 0x5f;
    //         if (dataLength === 32 || dataLength === 4) {
    //             const data = code.slice(i + 1, i + dataLength + 1).toString('hex');
    //             // TODO: potentially rule out certain signature hashes
    //             result.add(data);
    //         }
    //         i += dataLength;
    //     }
    // }
    return result;
}

export class ContractBytecode {
    private possibleSignatures: Set<string> | undefined;
    constructor(public bytecode: string) {}

    public getPossibleSignatureHashes(): string[] {
        return [...this.ensurePossibleSigHashes()];
    }

    public hasSignatureHash(sigHash: string): boolean {
        const hash = sigHash.startsWith('0x') ? sigHash.slice(2) : sigHash;
        return this.ensurePossibleSigHashes().has(hash);
    }

    public hasSignature(signature: string, type: SignatureType): boolean {
        return this.hasSignatureHash(computeSignatureHash(signature, type));
    }

    public hasFunctionSignature(signature: string): boolean {
        return this.hasSignature(signature, 'function');
    }

    public hasEventSignature(signature: string): boolean {
        return this.hasSignature(signature, 'event');
    }

    public hasOpcode(opcode: number): boolean {
        let res = false;
        walkOpcodes(this.bytecode, code => {
            if (code === opcode) {
                res = true;
                return false; // stop walking bytecode
            }
            return true;
        });
        return res;
    }

    private ensurePossibleSigHashes(): Set<string> {
        if (this.possibleSignatures === undefined) {
            this.possibleSignatures = extractPotentialSignatures(this.bytecode);
        }
        return this.possibleSignatures;
    }
}
