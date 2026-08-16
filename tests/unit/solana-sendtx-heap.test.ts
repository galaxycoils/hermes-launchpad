import { Buffer } from 'buffer';
import { ComputeBudgetProgram, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { connection, sendTx, type WalletProvider } from '@/lib/solana';

afterEach(() => vi.restoreAllMocks());

describe('sendTx heap frame', () => {
  it('prepends exactly one 256 KiB heap request before program instructions', async () => {
    const payer = Keypair.generate().publicKey;
    const tx = new Transaction().add(new TransactionInstruction({
      programId: Keypair.generate().publicKey,
      keys: [],
      data: Buffer.alloc(0),
    }));
    const provider: WalletProvider = {
      publicKey: payer,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      signAndSendTransaction: vi.fn().mockResolvedValue('sig'),
    };
    const heapInstruction = new TransactionInstruction({
      programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
      keys: [],
      data: Buffer.from([1, 0, 0, 4, 0]),
    });
    const requestHeapFrame = vi.spyOn(ComputeBudgetProgram, 'requestHeapFrame')
      .mockReturnValue(heapInstruction);
    vi.spyOn(connection, 'getLatestBlockhash').mockResolvedValue({
      blockhash: '11111111111111111111111111111111',
      lastValidBlockHeight: 1,
    });
    vi.spyOn(connection, 'confirmTransaction').mockResolvedValue({
      context: { slot: 1 }, value: { err: null },
    });

    await sendTx(provider, tx);

    const heapFrames = tx.instructions.filter((ix) =>
      ix.programId.toBase58() === 'ComputeBudget111111111111111111111111111111',
    );
    expect(heapFrames).toHaveLength(1);
    expect(requestHeapFrame).toHaveBeenCalledWith({ bytes: 256 * 1024 });
    expect(Array.from(heapFrames[0]?.data ?? [])).toEqual([1, 0, 0, 4, 0]);
    expect(tx.instructions[0]?.programId.toBase58())
      .toBe('ComputeBudget111111111111111111111111111111');
  });

  it('replaces an existing heap request instead of emitting a duplicate', async () => {
    const payer = Keypair.generate().publicKey;
    const existingHeap = new TransactionInstruction({
      programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
      keys: [],
      data: Buffer.from([1, 0, 0, 2, 0]),
    });
    const tx = new Transaction().add(existingHeap, new TransactionInstruction({
      programId: Keypair.generate().publicKey,
      keys: [],
      data: Buffer.alloc(0),
    }));
    const provider: WalletProvider = {
      publicKey: payer,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      signAndSendTransaction: vi.fn().mockResolvedValue('sig'),
    };
    vi.spyOn(ComputeBudgetProgram, 'requestHeapFrame').mockReturnValue(
      new TransactionInstruction({
        programId: new PublicKey('ComputeBudget111111111111111111111111111111'),
        keys: [],
        data: Buffer.from([1, 0, 0, 4, 0]),
      }),
    );
    vi.spyOn(connection, 'getLatestBlockhash').mockResolvedValue({
      blockhash: '11111111111111111111111111111111',
      lastValidBlockHeight: 1,
    });
    vi.spyOn(connection, 'confirmTransaction').mockResolvedValue({
      context: { slot: 1 }, value: { err: null },
    });

    await sendTx(provider, tx);

    const heapFrames = tx.instructions.filter((ix) =>
      ix.programId.toBase58() === 'ComputeBudget111111111111111111111111111111' && ix.data[0] === 1,
    );
    expect(heapFrames).toHaveLength(1);
    expect(Array.from(heapFrames[0]?.data ?? [])).toEqual([1, 0, 0, 4, 0]);
    expect(tx.instructions[0]).toBe(heapFrames[0]);
  });
});
