import { createOpenAIFunctionsAgent, AgentExecutor } from 'langchain/agents'

export class BaseAgent {
  constructor(model) {
    this.model = model
  }

  async createAgent() {
    this.agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools: this.tools,
      prompt: this.prompt,
    })

    this.executor = new AgentExecutor({
      agent: this.agent,
      tools: this.tools,
    })
  }
}
