import { Injectable } from '@nestjs/common';

export interface MerkleTree {
  root: string;
  nodes: string[][];
  depth: number;
}

export interface MerkleProof {
  creditHash: string;
  merklePath: string[];
  merkleIndices: number[];
  root: string;
}

@Injectable()
export class MerkleService {
  private trees: Map<string, MerkleTree> = new Map();

  async buildTree(leaves: string[], registry: string): Promise<MerkleTree> {
    const depth = 20;
    const nodes: string[][] = [leaves];

    let currentLevel = leaves;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = await this.hashPair(left, right);
        nextLevel.push(combined);
      }
      nodes.push(nextLevel);
      currentLevel = nextLevel;
    }

    const tree: MerkleTree = {
      root: currentLevel[0] || '0x0',
      nodes,
      depth,
    };

    this.trees.set(registry, tree);
    return tree;
  }

  async getRoot(registry: string): Promise<string | null> {
    const tree = this.trees.get(registry);
    return tree?.root || null;
  }

  async rebuildTrees(): Promise<Record<string, string>> {
    return {};
  }

  async getMerkleProof(creditHash: string): Promise<MerkleProof | null> {
    return null;
  }

  verifyProof(
    leaf: string,
    path: string[],
    indices: number[],
    root: string,
  ): boolean {
    return false;
  }

  private async hashPair(left: string, right: string): Promise<string> {
    return `0x${left}${right}`;
  }
}
