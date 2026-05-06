export type FailureTreeNode = {
  effect: string;
  explanation: string;
  children: FailureTreeNode[];
};

export type FailurePropagationTree = {
  id: string;
  rootCause: string;
  explanation: string;
  children: FailureTreeNode[];
};

export function buildFailurePropagationTree(failureType = 'pull-ratio-mismatch'): FailurePropagationTree {
  if (failureType === 'pull-ratio-mismatch') {
    return {
      id: failureType,
      rootCause: 'Wrong pull ratio',
      explanation: 'The shifter and derailleur translate cable movement using different standards.',
      children: [
        {
          effect: 'Poor indexing',
          explanation: 'Each shifter click moves the derailleur slightly too far or not far enough.',
          children: [
            {
              effect: 'Chain hesitation',
              explanation: 'The chain rides between cassette ramps instead of settling on one sprocket.',
              children: [
                {
                  effect: 'Skipping under load',
                  explanation: 'Pedaling torque forces the chain to jump when tooth engagement is shallow.',
                  children: [
                    {
                      effect: 'Cassette wear',
                      explanation: 'Sprocket ramps deform and shifting quality keeps degrading.',
                      children: [],
                    },
                  ],
                },
                {
                  effect: 'Chain wear acceleration',
                  explanation: 'Repeated partial engagement rounds chain rollers and cassette teeth faster.',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  return {
    id: failureType,
    rootCause: 'Capacity exceeded',
    explanation: 'The replacement part cannot absorb the range of motion demanded by the drivetrain.',
    children: [
      {
        effect: 'Adjustment range exceeded',
        explanation: 'The part reaches the end of its intended geometry.',
        children: [
          {
            effect: 'Noisy operation',
            explanation: 'Clearances and alignment drift outside tolerance.',
            children: [],
          },
        ],
      },
    ],
  };
}

export default {
  buildFailurePropagationTree,
};
