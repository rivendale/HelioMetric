/**
 * EntanglementLogic: Physics engine for calculating system entropy
 * based on Wu Xing (Five Elements) interaction theory.
 *
 * Models family relationships as an "entanglement matrix" where each
 * pair of nodes has an interaction energy derived from their elemental
 * affinities (constructive, destructive, or neutral).
 */

import type { ZodiacSign } from './HelioEngine';

// Element type alias for clarity
export type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

// Interaction types between elements
export type InteractionType = 'Constructive' | 'Destructive' | 'Neutral' | 'Same';

// Interaction result between two nodes
export interface ElementInteraction {
  nodeAId: string;
  nodeBId: string;
  nodeAElement: WuXingElement;
  nodeBElement: WuXingElement;
  interactionType: InteractionType;
  entropyContribution: number; // 0-100 contribution to system entropy
  description: string;
}

// System-wide entropy report
export interface SystemEntropyReport {
  systemStressScore: number; // 0-100 overall stress
  interactions: ElementInteraction[];
  constructiveCount: number;
  destructiveCount: number;
  neutralCount: number;
  dominantElement: WuXingElement | null;
  stabilityIndex: number; // 0-1, higher = more stable
}

// Node interface (simplified for entanglement calculations)
export interface EntanglementNode {
  id: string;
  name: string;
  element: WuXingElement;
}

/**
 * Wu Xing Generating Cycle (Constructive - Low Entropy):
 * Wood → Fire → Earth → Metal → Water → Wood
 * Each element "feeds" the next, creating harmony
 */
const GENERATING_CYCLE: Record<WuXingElement, WuXingElement> = {
  Wood: 'Fire',
  Fire: 'Earth',
  Earth: 'Metal',
  Metal: 'Water',
  Water: 'Wood',
};

/**
 * Wu Xing Overcoming Cycle (Destructive - High Entropy):
 * Wood → Earth → Water → Fire → Metal → Wood
 * Each element "controls/overcomes" the next, creating tension
 */
const OVERCOMING_CYCLE: Record<WuXingElement, WuXingElement> = {
  Wood: 'Earth',
  Earth: 'Water',
  Water: 'Fire',
  Fire: 'Metal',
  Metal: 'Wood',
};

/**
 * Entropy values for different interaction types
 */
const ENTROPY_VALUES = {
  Same: 5,           // Same elements: very low entropy, natural harmony
  Constructive: 15,  // Generating cycle: low entropy, supportive
  Neutral: 40,       // No direct relationship: moderate baseline entropy
  Destructive: 85,   // Overcoming cycle: high entropy, conflict
};

/**
 * EntanglementMatrix: Core physics engine for system dynamics
 */
export class EntanglementMatrix {
  private nodes: EntanglementNode[] = [];

  constructor(nodes?: EntanglementNode[]) {
    if (nodes) {
      this.nodes = nodes;
    }
  }

  /**
   * Set the nodes for calculation
   */
  setNodes(nodes: EntanglementNode[]): void {
    this.nodes = nodes;
  }

  /**
   * Convert a node with zodiac info to an entanglement node
   */
  static fromZodiacNode(node: { id: string; name: string; zodiacSign: ZodiacSign }): EntanglementNode {
    return {
      id: node.id,
      name: node.name,
      element: node.zodiacSign.element as WuXingElement,
    };
  }

  /**
   * Determine the interaction type between two elements
   */
  getInteractionType(elementA: WuXingElement, elementB: WuXingElement): InteractionType {
    // Same element
    if (elementA === elementB) {
      return 'Same';
    }

    // Check generating cycle (A generates B or B generates A)
    if (GENERATING_CYCLE[elementA] === elementB || GENERATING_CYCLE[elementB] === elementA) {
      return 'Constructive';
    }

    // Check overcoming cycle (A overcomes B or B overcomes A)
    if (OVERCOMING_CYCLE[elementA] === elementB || OVERCOMING_CYCLE[elementB] === elementA) {
      return 'Destructive';
    }

    // No direct relationship
    return 'Neutral';
  }

  /**
   * Get a human-readable description of the interaction
   */
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

  /**
   * Calculate the interaction between two nodes
   */
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

  /**
   * Calculate system entropy by evaluating all pairwise interactions
   * Returns a System Stress Score from 0-100
   */
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

    // Calculate all pairwise interactions
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

    // Calculate average entropy across all interactions
    const totalEntropy = interactions.reduce((sum, i) => sum + i.entropyContribution, 0);
    const averageEntropy = interactions.length > 0 ? totalEntropy / interactions.length : 0;

    // Calculate dominant element
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

    // Calculate stability index (inverse of entropy, weighted by constructive relationships)
    const totalPairs = interactions.length;
    const harmoniousPairs = constructiveCount + sameCount;
    const stabilityIndex = totalPairs > 0
      ? (harmoniousPairs / totalPairs) * (1 - averageEntropy / 100)
      : 1;

    return {
      systemStressScore: Math.round(averageEntropy),
      interactions,
      constructiveCount: constructiveCount + sameCount, // Group same with constructive
      destructiveCount,
      neutralCount,
      dominantElement,
      stabilityIndex: Math.max(0, Math.min(1, stabilityIndex)),
    };
  }

  /**
   * Get remediation suggestions based on system entropy
   */
  getRemediationSuggestions(report: SystemEntropyReport): string[] {
    const suggestions: string[] = [];

    if (report.systemStressScore > 70) {
      suggestions.push('High system stress detected. Consider mediating activities.');
    }

    if (report.destructiveCount > report.constructiveCount) {
      suggestions.push('Destructive interactions outnumber constructive ones.');

      // Find the most destructive pairs
      const destructivePairs = report.interactions
        .filter((i) => i.interactionType === 'Destructive')
        .slice(0, 3);

      destructivePairs.forEach((pair) => {
        const mediator = this.findMediatingElement(pair.nodeAElement, pair.nodeBElement);
        if (mediator) {
          suggestions.push(
            `${pair.nodeAElement}/${pair.nodeBElement} conflict: ${mediator} element can mediate`
          );
        }
      });
    }

    if (report.stabilityIndex < 0.3) {
      suggestions.push('Low stability index. System may benefit from grounding activities.');
    }

    return suggestions;
  }

  /**
   * Find an element that can mediate between two conflicting elements
   */
  private findMediatingElement(elementA: WuXingElement, elementB: WuXingElement): WuXingElement | null {
    // The mediator is the element that A generates and that generates B
    // Or the element in the cycle between them
    const elements: WuXingElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

    for (const element of elements) {
      // Check if this element could bridge the gap
      const aToMediator = this.getInteractionType(elementA, element);
      const mediatorToB = this.getInteractionType(element, elementB);

      if (
        (aToMediator === 'Constructive' || aToMediator === 'Same') &&
        (mediatorToB === 'Constructive' || mediatorToB === 'Same')
      ) {
        return element;
      }
    }

    return null;
  }
}

// Singleton instance for convenience
export const entanglementMatrix = new EntanglementMatrix();

/**
 * Quick helper to calculate entropy from zodiac-based nodes
 */
export function calculateFamilyEntropy(
  nodes: Array<{ id: string; name: string; zodiacSign: ZodiacSign }>
): SystemEntropyReport {
  const entanglementNodes = nodes.map(EntanglementMatrix.fromZodiacNode);
  return entanglementMatrix.calculateSystemEntropy(entanglementNodes);
}
