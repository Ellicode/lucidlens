import { RunnableSequence } from '@langchain/core/runnables'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'

export class AgentChain {
  constructor(agents) {
    this.agents = agents
  }

  buildChain(searchcb) {
    return RunnableSequence.from([
      {
        search: this.agents.search.execute.bind(this.agents.search),
        originalInput: (input) => input.input,
      },
      {
        input: (prevOutput) => {
          console.log('prevOutput', prevOutput)

          searchcb(prevOutput.search.output)
          return {
            input: `Original query: "${prevOutput.originalInput}"\nSearch results: ${prevOutput.search.output}`,
            agent_scratchpad: '',
          }
        },
      },
      this.agents.writer.execute.bind(this.agents.writer),
    ])
  }
}
