/**
 * EntanglementLogic: Physics engine for calculating system entropy
 * based on Wu Xing (Five Elements) interaction theory.
 */

import type { ZodiacSign } from './HelioEngine';

export type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type InteractionType = 'Constructive' | 'Destructive' | 'Neutral' | 'Same';

export interface ElementInteraction {
  nodeAId: string;
  nodeBId: string;
  nodeAElement: WuXingElement;
  nodeBElement: WuXingElement;
  interactionType: InteractionType;
  entropyContribution: number;
  description: string;
}

export interface SystemEntropyReport {
  systemStressScore: number;
  interactions: ElementInteraction[];
  constructiveCount: number;
  destructiveCount: number;
  neutralCount: number;
  dominantElement: WuXingElement | null;
  stabilityIndex: number;
}

export interface EntanglementNode {
  id: string;
  name: string;
  element: WuXingElement;
}

const GENERATING_CYCLE: Record<WuXingElement, WuXingElement> = {
  Wood: 'Fire',
  Fire: 'Earth',
  Earth: 'Metal',
  Metal: 'Water',
  Water: 'Wood',
};

const OVERCOMING_CYCLE: Record<WuXingElement, WuXingElement> = {
  Wood: 'Earth',
  Earth: 'Water',
  Water: 'Fire',
  Fire: 'Metal',
  Metal: 'Wood',
};

const ENTROPY_VALUES = {
  Same: 5,
  Constructive: 15,
  Neutral: 40,
  Destructive: 85,
};

export class EntanglementMatrix {
  private nodes: EntanglementNode[] = [];

  constructor(nodes?: EntanglementNode[]) {
    if (nodes) {
      this.nodes = nodes;
    }
  }

  setNodes(nodes: EntanglementNode[]): void {
    this.nodes = nodes;
  }

  static fromZodiacNode(node: { id: string; name: string; zodiacSign: ZodiacSign }): EntanglementNode {
    return {
      id: node.id,
      name: node.name,
      element: node.zodiacSign.element as WuXingElement,
    };
  }

  getInteractionType(elementA: WuXingElement, elementB: WuXingElement): InteractionType {
    if (elementA === elementB) {
      return 'Same';
    }

    if (GENERATING_CYCLE[elementA] === elementB || GENERATING_CYCLE[elementB] === elementA) {
      return 'Constructive';
    }

    if (OVERCOMING_CYCLE[elementA] === elementB || OVERCOMING_CYCLE[elementB] === elementA) {
      return 'Destructive';
    }

    return 'Neutral';
  }

  getInteractionDescription(
    elementA: WuXingElement,
    elementB: WuXingElement,
    type: InteractionType
  ): string {
    switch (type) {
      case 'Same':
        return `${elementA} ↔ ${elementB}: Resonant harmony (same element)`;
      case 'Constructive':
        if (GENERATING_CYCLE[elementA] === elementB) {
          return `${elementA} → ${elementB}: ${elementA} nourishes ${elementB}`;
        }
        return `${elementB} → ${elementA}: ${elementB} nourishes ${elementA}`;
      case 'Destructive':
        if (OVERCOMING_CYCLE[elementA] === elementB) {
          return `${elementA} ⊗ ${elementB}: ${elementA} controls ${elementB}`;
        }
        return `${elementB} ⊗ ${elementA}: ${elementB} controls ${elementA}`;
      case 'Neutral':
        return `${elementA} ∥ ${elementB}: Independent oscillation`;
      default:
        return `${elementA} ? ${elementB}: Unknown interaction`;
    }
  }

  calculateInteraction(nodeA: EntanglementNode, nodeB: EntanglementNode): ElementInteraction {
    const interactionType = this.getInteractionType(nodeA.element, nodeB.element);
    const entropyContribution = ENTROPY_VALUES[interactionType];
    const description = this.getInteractionDescription(nodeA.element, nodeB.element, interactionType);

    return {
      nodeAId: nodeA.id,
      nodeBId: nodeB.id,
      nodeAElement: nodeA.element,
      nodeBElement: nodeB.element,
      interactionType,
      entropyContribution,
      description,
    };
  }

  calculateSystemEntropy(nodes?: EntanglementNode[]): SystemEntropyReport {
    const targetNodes = nodes || this.nodes;

    if (targetNodes.length < 2) {
      return {
        systemStressScore: 0,
        interactions: [],
        constructiveCount: 0,
        destructiveCount: 0,
        neutralCount: 0,
        dominantElement: targetNodes[0]?.element || null,
        stabilityIndex: 1,
      };
    }

    const interactions: ElementInteraction[] = [];
    let constructiveCount = 0;
    let destructiveCount = 0;
    let neutralCount = 0;
    let sameCount = 0;

    for (let i = 0; i < targetNodes.length; i++) {
      for (let j = i + 1; j < targetNodes.length; j++) {
        const interaction = this.calculateInteraction(targetNodes[i], targetNodes[j]);
        interactions.push(interaction);

        switch (interaction.interactionType) {
          case 'Constructive':
            constructiveCount++;
            break;
          case 'Destructive':
            destructiveCount++;
            break;
          case 'Neutral':
            neutralCount++;
            break;
          case 'Same':
            sameCount++;
            break;
        }
      }
    }

    const totalEntropy = interactions.reduce((sum, i) => sum + i.entropyContribution, 0);
    const averageEntropy = interactions.length > 0 ? totalEntropy / interactions.length : 0;

    const elementCounts: Record<WuXingElement, number> = {
      Wood: 0,
      Fire: 0,
      Earth: 0,
      Metal: 0,
      Water: 0,
    };
    targetNodes.forEach((node) => {
      elementCounts[node.element]++;
    });

    let dominantElement: WuXingElement | null = null;
    let maxCount = 0;
    for (const [element, count] of Object.entries(elementCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantElement = element as WuXingElement;
      }
    }

    const totalPairs = interactions.length;
    const harmoniousPairs = constructiveCount + sameCount;
    const stabilityIndex = totalPairs > 0
      ? (harmoniousPairs / totalPairs) * (1 - averageEntropy / 100)
      : 1;

    return {
      systemStressScore: Math.round(averageEntropy),
      interactions,
      constructiveCount: constructiveCount + sameCount,
      destructiveCount,
      neutralCount,
      dominantElement,
      stabilityIndex: Math.max(0, Math.min(1, stabilityIndex)),
    };
  }
}

export const entanglementMatrix = new EntanglementMatrix();

export function calculateFamilyEntropy(
  nodes: Array<{ id: string; name: string; zodiacSign: ZodiacSign }>
): SystemEntropyReport {
  const entanglementNodes = nodes.map(EntanglementMatrix.fromZodiacNode);
  return entanglementMatrix.calculateSystemEntropy(entanglementNodes);
}
