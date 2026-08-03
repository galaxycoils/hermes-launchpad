import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HermesCurve } from "../target/types/hermes_curve";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("hermes-curve", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HermesCurve as Program<HermesCurve>;
  const admin = provider.wallet;

  const feeWallet = Keypair.generate().publicKey;
  const migrationAuthority = Keypair.generate().publicKey;

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const mint = Keypair.generate();
  const [curvePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("curve"), mint.publicKey.toBuffer()],
    program.programId
  );
  const curveAta = getAssociatedTokenAddressSync(mint.publicKey, curvePda, true);
  const traderAta = getAssociatedTokenAddressSync(mint.publicKey, admin.publicKey);

  it("initializes platform config", async () => {
    await program.methods
      .initialize(new anchor.BN(0))
      .accounts({
        config: configPda,
        admin: admin.publicKey,
        feeWallet,
        migrationAuthority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const config = await program.account.config.fetch(configPda);
    expect(config.admin.toBase58()).to.eq(admin.publicKey.toBase58());
    expect(config.migrationThresholdLamports.toNumber()).to.be.greaterThan(0);
  });

  it("creates a token with full supply on the curve", async () => {
    await program.methods
      .createToken("Antigravity Pump", "AGPUMP", "https://example.com/agpump.json")
      .accounts({
        config: configPda,
        curve: curvePda,
        mint: mint.publicKey,
        curveTokenAccount: curveAta,
        creator: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();
    const curve = await program.account.curve.fetch(curvePda);
    expect(curve.complete).to.eq(false);
    expect(curve.realTokenReserves.toNumber()).to.eq(1_000_000_000_000_000);
  });

  it("buys tokens on the curve and updates reserves", async () => {
    const solIn = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
    await program.methods
      .buy(solIn, new anchor.BN(1))
      .accounts({
        config: configPda,
        curve: curvePda,
        mint: mint.publicKey,
        curveTokenAccount: curveAta,
        traderTokenAccount: traderAta,
        trader: admin.publicKey,
        feeWallet,
        creatorWallet: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const curve = await program.account.curve.fetch(curvePda);
    expect(curve.realSolReserves.toNumber()).to.be.greaterThan(0);
    const ata = await provider.connection.getTokenAccountBalance(traderAta);
    expect(Number(ata.value.amount)).to.be.greaterThan(0);
  });

  it("sells tokens back to the curve", async () => {
    const before = await program.account.curve.fetch(curvePda);
    const tokensIn = new anchor.BN(1_000_000_000); // 1000 tokens
    await program.methods
      .sell(tokensIn, new anchor.BN(1))
      .accounts({
        config: configPda,
        curve: curvePda,
        mint: mint.publicKey,
        curveTokenAccount: curveAta,
        traderTokenAccount: traderAta,
        trader: admin.publicKey,
        feeWallet,
        creatorWallet: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const after = await program.account.curve.fetch(curvePda);
    expect(after.realTokenReserves.toNumber()).to.be.greaterThan(before.realTokenReserves.toNumber());
  });

  it("enforces slippage protection", async () => {
    let failed = false;
    try {
      await program.methods
        .buy(new anchor.BN(0.1 * LAMPORTS_PER_SOL), new anchor.BN("999999999999999999"))
        .accounts({
          config: configPda,
          curve: curvePda,
          mint: mint.publicKey,
          curveTokenAccount: curveAta,
          traderTokenAccount: traderAta,
          trader: admin.publicKey,
          feeWallet,
          creatorWallet: admin.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch {
      failed = true;
    }
    expect(failed).to.eq(true);
  });
});
